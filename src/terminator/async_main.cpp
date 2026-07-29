module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::Terminator::async_main() {
    asio::signal_set signals(co_await asio::this_coro::executor, SIGINT, SIGTERM);

    auto signal = co_await signals.async_wait();
    fmt::println(stderr, "Got signal={}", signal);

    try {
        acceptor.close();
    } catch (boost::system::system_error &e) {
        fmt::println(stderr, "Failed to close acceptor: {}", e.what());
    }
}
