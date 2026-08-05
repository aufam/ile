module;

#include "../boost.h"

module ile;
import fmt;

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
        auto ss       = std::make_shared<ws_stream>(std::move(stream));
        auto pcm_data = std::vector<float>();
        int  cnt      = 0;
        while (true) {
            beast::flat_buffer buffer;

            try {
                co_await ss->async_read(buffer);
            } catch (boost::system::system_error &e) {
                if (e.code() == ws::error::closed) {
                    fmt::println(stderr, "ws closed");
                    break;
                }
                throw;
            }

            auto ctx = co_await asio::this_coro::executor;
            asio::co_spawn(ctx, handle_audio_chunk(ss, std::move(buffer), pcm_data, cnt), asio::detached);
        }
    };
}
