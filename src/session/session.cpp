module;

#include "../boost.h"

module ile;
import fmt;
import cpx.fmt;
import cpx.protobuf;
import cpx.yy_json;

ile::Session::Session(tcp::socket socket, const ile::Cli::Serve &args, Whisper &whisper, const Router &router)
    : socket(std::move(socket))
    , args(args)
    , whisper(whisper)
    , router(router) {}

asio::awaitable<void> ile::Session::run() {
    auto _ = shared_from_this();

    const auto remote = socket.remote_endpoint();

    beast::flat_buffer buffer;

    http_request req;

    try {
        co_await http::async_read(socket, buffer, req);

        fmt::println(
            "[{}:{}] {} {} HTTP/{}.{}",
            remote.address().to_string(),
            remote.port(),
            req.method_string(),
            req.target(),
            req.version() / 10,
            req.version() % 10
        );

        if (ws::is_upgrade(req)) {
            co_await handle_websocket(req);
        } else {
            co_await handle_http(req);
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
