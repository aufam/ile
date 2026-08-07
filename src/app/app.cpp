module;

#include "../boost.h"

module ile;
import fmt;
import cpx.protobuf;

ile::App::App(const ile::Cli::Serve &args)
    : args(args)
    , acceptor(io)
    , whisper(args.whisper_model) {
    try {
        const auto address  = asio::ip::make_address(args.host);
        const auto endpoint = tcp::endpoint(address, args.port);

        acceptor.open(endpoint.protocol());
        acceptor.set_option(tcp::acceptor::reuse_address(true));
        acceptor.bind(endpoint);
        acceptor.listen(asio::socket_base::max_listen_connections);
    } catch (boost::system::system_error &e) {
        if (e.code() == asio::error::address_in_use)
            fmt::println(stderr, "Error: Port {} is already in use.", args.port);
        else
            fmt::println(stderr, "Failed to start acceptor on port {}: {}", args.port, e.what());
        exit(1);
    }

    router.mounts["/"] = "static";

    router.ws_handlers["/audio"] = [this](const http_request &, ws_stream stream) -> asio::awaitable<void> {
        while (is_running) {
            beast::flat_buffer buffer;

            try {
                co_await stream.async_read(buffer);
            } catch (boost::system::system_error &e) {
                if (e.code() == ws::error::closed) {
                    fmt::println(stderr, "ws closed");
                    break;
                }
                throw;
            }

            std::string_view sv(static_cast<const char *>(buffer.data().data()), buffer.size());
            if (sv == "done") {
                // TODO
                co_return;
            }

            ile::AudioChunk chunk = {};
            try {
                cpx::protobuf::parse(sv, chunk);
            } catch (std::exception &e) {
                fmt::println(stderr, "{}:{}: parse error: {}", chunk.branch, chunk.counter, e.what());
                co_return;
            }

            auto res = chunk.write_wav();
            if (res.is_err()) {
                fmt::println(stderr, "{}:{}: write wav error: {}", chunk.branch, chunk.counter, res.error().what());
                co_return;
            }
        }
    };
}
