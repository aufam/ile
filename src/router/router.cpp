module;

// #include <functional>
// #include <unordered_map>
#include <fstream>
#include "../boost.h"

module ile;


asio::awaitable<void> ile::Router::handle(tcp::socket &socket, const http_request &req) const {
    http_response res;
    res.version(req.version());
    res.set(http::field::server, "ile");

    auto h = match(req);
    co_await h(req, res);

    res.prepare_payload();
    co_await http::async_write(socket, res);
}

ile::Router::Handler ile::Router::match(const http_request &req) const {
    auto target = req.target();
    auto path   = target.substr(0, target.find('?'));

    auto key = std::string(req.method_string()) + " " + std::string(path);
    auto it  = handlers.find(key);
    if (it != handlers.end())
        return it->second;

    key = std::string(path);
    it  = handlers.find(key);
    if (it != handlers.end())
        return it->second;

    if (!mounted_dir.empty()) {
        std::ifstream file(mounted_dir + std::string(path), std::ios::binary);
        if (file) {
            std::string body((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

            return [path = std::string(path),
                    body = std::move(body)](const http_request &, http_response &res) mutable -> asio::awaitable<void> {
                if (path.ends_with(".html")) {
                    res.set(http::field::content_type, "text/html");
                } else if (path.ends_with(".js")) {
                    res.set(http::field::content_type, "application/javascript");
                } else if (path.ends_with(".css")) {
                    res.set(http::field::content_type, "text/css");
                } else if (path.ends_with(".md")) {
                    res.set(http::field::content_type, "text/markdown");
                } else if (path.ends_with(".png")) {
                    res.set(http::field::content_type, "image/png");
                } else if (path.ends_with(".jpg")) {
                    res.set(http::field::content_type, "image/jpg");
                } else if (path.ends_with(".jpeg")) {
                    res.set(http::field::content_type, "image/jpg");
                } else if (path.ends_with(".mp4")) {
                    res.set(http::field::content_type, "video/mp4");
                } else if (path.ends_with(".mp3")) {
                    res.set(http::field::content_type, "audio/mp3");
                } else if (path.ends_with(".mpeg")) {
                    res.set(http::field::content_type, "audio/mpeg");
                } else if (path.ends_with(".wav")) {
                    res.set(http::field::content_type, "audio/wav");
                } else if (path.ends_with(".json")) {
                    res.set(http::field::content_type, "application/json");
                } else {
                    res.set(http::field::content_type, "application/octet-stream");
                }

                res.body() = std::move(body);
                res.result(http::status::ok);

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
