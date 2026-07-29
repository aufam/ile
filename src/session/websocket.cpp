module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::Session::handle_websocket(const http_request &req) {
    auto ws = std::make_shared<ws_stream>(std::move(socket));

    co_await ws->async_accept(req);

    std::vector<float> pcm_data;
    while (true) {
        beast::flat_buffer buffer;

        try {
            co_await ws->async_read(buffer);
        } catch (boost::system::system_error &e) {
            if (e.code() == ws::error::closed) {
                fmt::println("closed");
                break;
            }
            throw;
        }

        auto ctx = co_await asio::this_coro::executor;
        asio::co_spawn(ctx, handle_chunk(ws, std::move(buffer), pcm_data), asio::detached);
    }
}
