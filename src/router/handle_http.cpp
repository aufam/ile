module;

#include <filesystem>
#include <map>
#include <unordered_map>
#include <xxhash.h>
#include "../boost.h"

module ile;
import fmt;
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

std::string match_filepath(std::string mounted_root, std::string mounted_path) {
    std::error_code ec;

    fs::path root = fs::weakly_canonical(mounted_root, ec);
    if (ec)
        return "";

    fs::path path = fs::weakly_canonical(root / mounted_path, ec);
    if (ec)
        return "";

    auto rel = path.lexically_relative(root);
    if (rel.empty() || rel.native().starts_with(".."))
        return "";

    if (!fs::exists(path))
        return "";

    if (fs::is_directory(path))
        path /= "index.html";

    return path.string();
}

std::variant<ile::Router::HttpHandler, std::string> match_uri(
    const std::unordered_map<std::string, ile::Router::HttpHandler> &handlers,
    const std::map<std::string, std::string>                        &mounts,
    const http_request                                              &req
) {
    auto target = req.target();
    auto path   = std::string(target.substr(0, target.find('?')));

    auto key = std::string(req.method_string()) + " " + path;
    auto it  = handlers.find(key);
    if (it != handlers.end())
        return it->second;

    key = path;
    it  = handlers.find(key);
    if (it != handlers.end())
        return it->second;

    if (req.method_string() == "GET") {
        for (auto &[root, mounted_root] : mounts) {
            if (path.starts_with(root)) {
                auto res = match_filepath(mounted_root, path.substr(root.size()));
                if (!res.empty())
                    return std::move(res);
            }
        }
    }

    return [](const http_request &, http_response &res) -> asio::awaitable<void> {
        res.result(http::status::not_found);
        res.set(http::field::content_type, "text/plain");
        res.body() = "404 Not Found";

        co_return;
    };
}

asio::awaitable<bool> ile::Router::handle_http(beast::tcp_stream &stream, const http_request &req) const {
    auto h = match_uri(http_handlers, mounts, req);
    if (auto ph = std::get_if<ile::Router::HttpHandler>(&h)) {
        http_response res;
        res.version(req.version());
        res.set(http::field::server, "ile");
        res.keep_alive(req.keep_alive());

        co_await (*ph)(req, res);

        res.prepare_payload();
        co_await http::async_write(stream, res);
    } else {
        auto &path = std::get<std::string>(h);

        beast::error_code           ec;
        http::file_body::value_type body;
        body.open(path.c_str(), beast::file_mode::scan, ec);
        if (ec)
            co_return false; // TODO

        auto etag = file_etag(path);

        if (auto it = req.find(http::field::if_none_match); it != req.end() && it->value() == etag) {
            http::response<http::empty_body> res{http::status::not_modified, req.version()};
            res.set(http::field::server, "ile");
            res.set(http::field::etag, etag);
            res.set(http::field::cache_control, "public, max-age=31536000, immutable");
            res.keep_alive(req.keep_alive());

            co_await http::async_write(stream, res);
            co_return true;
        }

        http::response<http::file_body> res;
        res.version(req.version());
        res.set(http::field::server, "ile");
        res.set(http::field::content_type, mime_type(path));
        res.set(http::field::etag, etag);
        res.set(http::field::cache_control, "public, max-age=31536000, immutable");
        res.content_length(body.size());
        res.keep_alive(req.keep_alive());
        res.body() = std::move(body);

        co_await http::async_write(stream, res);
    }

    co_return req.keep_alive();
}
