module;

#include "../boost.h"

module ile;
import fmt;

asio::awaitable<void> ile::App::async_cancel() {
    asio::signal_set signals(co_await asio::this_coro::executor, SIGINT, SIGTERM);

    auto signal = co_await signals.async_wait();
    fmt::println(stderr, "Got signal={}", signal);

    is_running = false;
    try {
        acceptor.close();
    } catch (boost::system::system_error &e) {
        fmt::println(stderr, "Failed to close acceptor: {}", e.what());
    }

    try {
        router.close_all_streams();
    } catch (boost::system::system_error &e) {
        fmt::println(stderr, "Failed to close acceptor: {}", e.what());
    }

    try {
        std::scoped_lock lock(mtx);
        for (auto &[_, streams] : rooms) {
            for (auto &[stream, _] : streams) {
                stream->close(ws::close_code::normal);
            }
        }
    } catch (boost::system::system_error &e) {
        fmt::println(stderr, "Failed to close acceptor: {}", e.what());
    }
}
