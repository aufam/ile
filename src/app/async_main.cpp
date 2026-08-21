module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::App::async_main() {
    fmt::println("Server is running on http://{}:{}", args.host, args.port);

    while (is_running) {
        std::shared_ptr<tcp_stream> stream;
        try {
            stream = std::make_shared<tcp_stream>(co_await acceptor.async_accept());
            asio::co_spawn(io, router.handle(std::move(stream)), asio::detached);
        } catch (boost::system::system_error &e) {
            fmt::println("Acceptor stopped: {}", e.code().message());
            break;
        }
    }
}
