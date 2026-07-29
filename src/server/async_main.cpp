module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::Server::async_main() {
    auto io = co_await asio::this_coro::executor;

    fmt::println("Server is running on http://{}:{}", args.host, args.port);

    while (true) {
        try {
            tcp::socket socket = co_await acceptor.async_accept();

            auto session = std::make_shared<ile::Session>(std::move(socket), args, whisper, router);

            asio::co_spawn(io, session->run(), asio::detached);
        } catch (boost::system::system_error &e) {
            if (e.code() == asio::error::basic_errors::operation_aborted)
                fmt::println("Acceptor stopped.");
            else
                fmt::println("Accept error: {}", e.what());
            break;
        }
    }
}
