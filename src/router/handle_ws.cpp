module;

#include "../boost.h"

module ile;

asio::awaitable<bool> ile::Router::handle_ws(beast::tcp_stream &stream, const http_request &req) const {
    auto target = req.target();
    auto path   = std::string(target.substr(0, target.find('?')));

    auto it = ws_handlers.find(path);
    if (it == ws_handlers.end())
        co_return false;

    ws_stream ws(std::move(stream.socket()));
    co_await ws.async_accept(req);

    co_await it->second(req, std::move(ws));
    co_return false;
}
