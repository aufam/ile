module;

#include <unordered_map>
#include <filesystem>
#include <fstream>
#include <xxhash.h>
#include "../boost.h"
#include "../fs.h"

module ile;
import cpx;

auto not_found(ile::Context &c) -> asio::awaitable<void> {
    auto &res = c.response_string();
    res.result(http::status::not_found);
    res.set(http::field::content_type, "text/plain");
    res.body() = "404 Not Found";
    res.prepare_payload();
    co_await http::async_write(*c.stream, res);
};

std::pair<std::string, bool> match_filepath(const std::string &root_uri, const std::string &root_fs, const std::string &uri) {
    if (!uri.starts_with(root_uri))
        return {};

    if (uri.size() > root_uri.size() && !root_uri.ends_with('/') && uri[root_uri.size()] != '/')
        return {};

    std::error_code ec;
    const auto      root = fs::weakly_canonical(root_fs, ec);
    if (ec)
        return {};

    auto path = fs::weakly_canonical(root / uri.substr(root_uri.size()), ec);
    if (ec)
        return {};

    if (auto rel = path.lexically_relative(root); rel.empty() || rel.native().starts_with(".."))
        return {};

    if (fs::is_directory(path, ec)) {
        if (!uri.ends_with('/'))
            return {uri + '/', true}; // redirect to uri + /

        path /= "index.html";
    } else if (ec) {
        return {};
    }

    if (!fs::is_regular_file(path, ec) || ec)
        return {};

    return {path.string(), false};
}

std::string file_etag(std::string const &path) {
    std::ifstream f(path, std::ios::binary);
    if (!f)
        return {};

    XXH3_state_t *state = XXH3_createState();
    XXH3_128bits_reset(state);

    std::array<char, 8192> buf;
    while (f.read(buf.data(), buf.size()) || f.gcount())
        XXH3_128bits_update(state, buf.data(), f.gcount());

    auto hash = XXH3_128bits_digest(state);
    XXH3_freeState(state);

    char etag[33];
    snprintf(etag, sizeof(etag), "%016llx%016llx", (unsigned long long)hash.high64, (unsigned long long)hash.low64);

    return std::string("\"") + etag + "\"";
}

std::string_view mime_type(fs::path const &p) {
    auto ext = p.extension().string();

    static const std::unordered_map<std::string, std::string_view> mime{
        {".html", "text/html"             },
        {".css",  "text/css"              },
        {".js",   "application/javascript"},
        {".json", "application/json"      },
        {".png",  "image/png"             },
        {".jpg",  "image/jpeg"            },
        {".jpeg", "image/jpeg"            },
        {".svg",  "image/svg+xml"         },
        {".ico",  "image/x-icon"          },
        {".wasm", "application/wasm"      },
    };

    if (auto it = mime.find(ext); it != mime.end())
        return it->second;

    return "application/octet-stream";
}

ile::Router::Handler handle_file(const http::request_header<http::fields> &req, const std::string &path) {
    const auto etag = file_etag(path);
    if (auto it = req.find(http::field::if_none_match); it != req.end() && it->value() == etag)
        return [etag](ile::Context &c) -> awaitable<void> {
            auto &res = c.response_empty();
            res.set(http::field::etag, etag);
            res.set(http::field::cache_control, "no-cache");
            res.result(http::status::not_modified);
            res.prepare_payload();
            co_await http::async_write(*c.stream, res);
        };

    return [=, mime = mime_type(path)](ile::Context &c) -> awaitable<void> {
        auto &res = c.response_file();
        auto  ec  = beast::error_code();
        res.body().open(path.c_str(), beast::file_mode::scan, ec);
        if (ec)
            throw boost::system::system_error(ec);

        res.set(http::field::etag, etag);
        res.set(http::field::cache_control, "no-cache");
        res.result(http::status::ok);
        res.prepare_payload();
        co_await http::async_write(*c.stream, res);
    };
}

void ile::Router::match(Context &c) const {
    const auto  method   = std::string(c.req().method_string());
    const auto &url_path = c.url.path();

    std::scoped_lock<std::mutex> lock(_mtx);
    c.handlers.reserve(middlewares.size() + 1);
    for (const auto &[path, fn] : middlewares) {
        if (url_path.starts_with(path))
            c.handlers.push_back(fn);
    }

    auto fn = [&]() -> Handler {
        auto key = method + " " + url_path;
        auto it  = handlers.find(key);
        if (it != handlers.end())
            return it->second;

        key = url_path;
        it  = handlers.find(key);
        if (it != handlers.end())
            return it->second;

        if (method != "GET")
            return not_found;

        auto &req = c.req();
        for (const auto &[root_uri, root_fs] : file_handlers) {
            auto [path, redirect] = match_filepath(root_uri, root_fs, url_path);
            if (path.empty())
                continue;

            if (!redirect)
                return handle_file(req, path);

            auto query = std::string(c.url.encoded_query());
            return [=](Context &c) -> asio::awaitable<void> {
                auto &res = c.response_empty();
                auto  uri = path + (query.empty() ? "" : "?") + query;
                res.result(http::status::moved_permanently);
                res.set(http::field::location, uri);
                res.prepare_payload();
                co_await http::async_write(*c.stream, res);
            };
        }

        return not_found;
    }();

    c.handlers.push_back(std::move(fn));
}
