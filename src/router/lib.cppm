module;

#include <functional>
#include <unordered_map>
#include <map>
#include <atomic>
#include <mutex>
#include "../boost.h"

export module ile:router;

export namespace ile {
    struct Router;
} // namespace ile

struct ile::Router {
    using HttpHandler = std::function<asio::awaitable<void>(const http_request &, http_response &)>;
    using WsHandler   = std::function<asio::awaitable<void>(const http_request &, ws_stream)>;

    std::unordered_map<std::string, HttpHandler> http_handlers;
    std::unordered_map<std::string, WsHandler>   ws_handlers;
    std::map<std::string, std::string>           mounts;
    std::atomic_bool                             is_running = true;

    asio::awaitable<void> handle(beast::tcp_stream) const;
    void                  close_all_streams() const;

private:
    asio::awaitable<bool> handle_http(const std::string &remote_name, beast::tcp_stream &, const http_request &) const;
    asio::awaitable<void> handle_ws(const std::string &remote_name, beast::tcp_stream, const http_request &) const;

    mutable std::mutex                                           mtx;
    mutable std::unordered_map<std::string, beast::tcp_stream *> tcp_streams;
    mutable std::unordered_map<std::string, ws_stream *>         ws_streams;
};
