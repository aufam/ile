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
        } catch (boost::system::system_error &e) {
            fmt::println("Acceptor stopped: {}", e.code().message());
            break;
        }

        auto work = [&](std::shared_ptr<tcp_stream> stream) -> awaitable<void> {
            while (is_running)
                try {
                    bool keep_alive = co_await router.handle(stream);
                    if (!keep_alive)
                        break;
                } catch (boost::system::system_error &e) {
                    const auto ep = stream->socket().remote_endpoint();
                    fmt::println("[{}:{}] {}", ep.address().to_string(), ep.port(), e.code().message());
                    break;
                }
        };
        asio::co_spawn(io, work(stream), asio::detached);
    }
}
