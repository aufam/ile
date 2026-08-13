module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::App::async_main() {
    fmt::println("Server is running on http://{}:{}", args.host, args.port);

    while (is_running) {
        try {
            beast::tcp_stream stream(co_await acceptor.async_accept());
            asio::co_spawn(io, router.handle(std::move(stream)), asio::detached);
        } catch (boost::system::system_error &e) {
            fmt::println("Acceptor stopped: {}", e.code().message());
            break;
        }
    }
}
