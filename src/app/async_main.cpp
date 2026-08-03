module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::App::async_main() {
    auto io = co_await asio::this_coro::executor;

    fmt::println("Server is running on http://{}:{}", args.host, args.port);

    while (true) {
        try {
            beast::tcp_stream stream(co_await acceptor.async_accept());
            asio::co_spawn(io, router.handle(std::move(stream)), asio::detached);
        } catch (boost::system::system_error &e) {
            if (e.code() == asio::error::basic_errors::operation_aborted)
                fmt::println("Acceptor stopped.");
            else
                fmt::println("Accept error: {}", e.what());
            break;
        }
    }
}
