module;

#include <functional>
#include <unordered_map>
#include <map>
#include <atomic>
#include <mutex>
#include <memory>
#include "../boost.h"

export module ile:router;

export namespace ile {
    struct Router;
} // namespace ile

struct ile::Router {
    using HttpHandler = std::function<asio::awaitable<void>(const http_request &, http_response &)>;
    using WsHandler   = std::function<asio::awaitable<void>(const http_request &, std::shared_ptr<ws_stream>)>;

    using HttpHandlers = std::unordered_map<std::string, HttpHandler>;
    using WsHandlers   = std::unordered_map<std::string, WsHandler>;

    struct longest_first {
        bool operator()(const std::string &a, const std::string &b) const {
            return a.size() == b.size() ? a < b : a.size() > b.size();
        }
    };
    using Mounts = std::map<std::string, std::string, longest_first>;

    HttpHandlers     http_handlers;
    WsHandlers       ws_handlers;
    Mounts           mounts;
    std::atomic_bool is_running = true;

    asio::awaitable<void> handle(beast::tcp_stream) const;
    asio::awaitable<void> close_all_streams() const;

private:
    asio::awaitable<bool> handle_http(const std::string &remote_name, beast::tcp_stream &, const http_request &) const;
    asio::awaitable<void> handle_ws(const std::string &remote_name, beast::tcp_stream, const http_request &) const;

    mutable std::mutex                                                  mtx;
    mutable std::unordered_map<std::string, beast::tcp_stream *>        tcp_streams;
    mutable std::unordered_map<std::string, std::shared_ptr<ws_stream>> ws_streams;
};
