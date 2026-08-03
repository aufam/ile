module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::Router::handle(beast::tcp_stream stream) const {
    const auto remote = stream.socket().remote_endpoint();

    beast::flat_buffer buffer;

    http_request req;
    try {
        while (true) {
            co_await http::async_read(stream, buffer, req);

            fmt::println(
                stderr,
                "[{}:{}] {} {} HTTP/{}.{}",
                remote.address().to_string(),
                remote.port(),
                req.method_string(),
                req.target(),
                req.version() / 10,
                req.version() % 10
            );

            if (ws::is_upgrade(req)) {
                fmt::println(stderr, "DEBUG: {}", "upgrade");
                co_await handle_ws(stream, req);
                co_return;
            } else {
                bool keep_alive = co_await handle_http(stream, req);
                if (!keep_alive) {
                    stream.socket().shutdown(tcp::socket::shutdown_send);
                    co_return;
                }
            }
        }
    } catch (boost::system::system_error &e) {
        if (e.code() == asio::error::operation_aborted)
            fmt::println(stderr, "[{}:{}] session aborted.", remote.address().to_string(), remote.port());
        else if (e.code() == http::error::end_of_stream)
            fmt::println(stderr, "[{}:{}] end of stream.", remote.address().to_string(), remote.port());
        else
            fmt::println(stderr, "session error: {}", e.what());
    } catch (std::exception const &e) {
        fmt::println(stderr, "session error: {}", e.what());
    }
}
