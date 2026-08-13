module;

#include "../boost.h"

module ile;

asio::awaitable<void>
ile::Router::handle_ws(const std::string &remote_name, beast::tcp_stream stream, const http_request &req) const {
    const auto target = req.target();
    const auto uri    = std::string(target.substr(0, target.find('?')));

    auto it = ws_handlers.find(uri);
    if (it == ws_handlers.end())
        co_return;

    auto ws = std::make_shared<ws_stream>(std::move(stream.socket()));
    {
        std::unique_lock<std::mutex> lock(this->mtx);
        this->ws_streams[remote_name] = ws;
    }
    cpx::defer _ = [&]() {
        std::unique_lock<std::mutex> lock(this->mtx);
        this->ws_streams.erase(remote_name);
    };

    co_await ws->async_accept(req);

    co_await it->second(req, ws);

    if (ws->is_open())
        co_await ws->async_close(ws::close_code::normal);
}
