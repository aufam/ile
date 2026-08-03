module;

#include <functional>
#include <unordered_map>
#include <map>
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

    asio::awaitable<void> handle(beast::tcp_stream) const;

private:
    asio::awaitable<bool> handle_http(beast::tcp_stream &, const http_request &) const;
    asio::awaitable<bool> handle_ws(beast::tcp_stream &, const http_request &) const;
};
