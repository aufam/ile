module;

#include <filesystem>
#include <unordered_map>
#include <xxhash.h>
#include "../boost.h"

module ile;
import fmt;
import cpx;
namespace fs = std::filesystem;

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

std::variant<ile::Router::HttpHandler, std::string>
match_uri(const ile::Router::HttpHandlers &handlers, const ile::Router::Mounts &mounts, const http_request &req) {
    const auto target = req.target();
    const auto uri    = std::string(target.substr(0, target.find('?')));

    auto key = std::string(req.method_string()) + " " + uri;
    auto it  = handlers.find(key);
    if (it != handlers.end())
        return it->second;

    key = uri;
    it  = handlers.find(key);
    if (it != handlers.end())
        return it->second;

    if (req.method_string() == "GET") {
        for (const auto &[root_uri, root_fs] : mounts) {
            auto [path, redirect] = match_filepath(root_uri, root_fs, uri);
            if (path.empty())
                continue;

            if (!redirect)
                return std::move(path);

            return [uri = path](const http_request &, http_response &res) -> asio::awaitable<void> {
                res.result(http::status::moved_permanently);
                res.set(http::field::location, uri);
                co_return;
            };
        }
    }

    return [](const http_request &, http_response &res) -> asio::awaitable<void> {
        res.result(http::status::not_found);
        res.set(http::field::content_type, "text/plain");
        res.body() = "404 Not Found";

        co_return;
    };
}

asio::awaitable<bool>
ile::Router::handle_http(const std::string &remote_name, beast::tcp_stream &stream, const http_request &req) const {

    co_await cpx::visit(
        match_uri(http_handlers, mounts, req),

        [&](ile::Router::HttpHandler fn) -> asio::awaitable<void> {
            http_response res;
            res.version(req.version());
            res.keep_alive(req.keep_alive());
            res.set(http::field::server, "ile");

            co_await fn(req, res);
            res.prepare_payload();

            fmt::println(stderr, "[{}] {} {}", remote_name, res.result_int(), res.reason());
            co_await http::async_write(stream, res);
        },

        [&](std::string path) -> asio::awaitable<void> {
            beast::error_code           ec;
            http::file_body::value_type body;
            body.open(path.c_str(), beast::file_mode::scan, ec);
            if (ec)
                co_return; // TODO

            const auto etag = file_etag(path);
            if (auto it = req.find(http::field::if_none_match); it != req.end() && it->value() == etag) {
                http_response_empty res;
                res.version(req.version());
                res.keep_alive(req.keep_alive());
                res.result(http::status::not_modified);
                res.set(http::field::server, "ile");
                res.set(http::field::etag, etag);
                res.set(http::field::cache_control, "no-cache");

                fmt::println(stderr, "[{}] {} {}", remote_name, res.result_int(), res.reason());

                co_await http::async_write(stream, res);
                co_return;
            }

            http::response<http::file_body> res;
            res.version(req.version());
            res.keep_alive(req.keep_alive());
            res.result(http::status::ok);
            res.set(http::field::server, "ile");
            res.set(http::field::etag, etag);
            res.set(http::field::content_type, mime_type(path));
            res.set(http::field::cache_control, "no-cache");
            res.content_length(body.size());
            res.body() = std::move(body);

            fmt::println(stderr, "[{}] {} {}", remote_name, res.result_int(), res.reason());
            co_await http::async_write(stream, res);
        }
    );

    co_return req.keep_alive();
}
