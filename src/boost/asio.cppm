module;

#include <boost/asio/io_context.hpp>
#include <boost/asio/buffer.hpp>
#include <boost/asio/awaitable.hpp>
#include <boost/asio/use_awaitable.hpp>
#include <boost/asio/detached.hpp>
#include <boost/asio/co_spawn.hpp>
#include <boost/asio/steady_timer.hpp>
#include <boost/asio/signal_set.hpp>

export module ile:asio;

export namespace asio {
    using ::boost::asio::any_io_executor;
    using ::boost::asio::awaitable;
    using ::boost::asio::buffer;
    using ::boost::asio::co_spawn;
    using ::boost::asio::detached;
    using ::boost::asio::io_context;
    using ::boost::asio::post;
    using ::boost::asio::signal_set;
    using ::boost::asio::steady_timer;
    using ::boost::asio::use_awaitable;
} // namespace asio

export namespace asio::signals {
    constexpr auto sigint  = SIGINT;
    constexpr auto sigterm = SIGTERM;
} // namespace asio::signals

export namespace asio::this_coro {
    using ::boost::asio::this_coro::executor;
} // namespace asio::this_coro

export namespace asio::detail {
    using ::boost::asio::detail::awaitable_frame;
} // namespace asio::detail

export namespace std {
    using ::std::coroutine_handle;
    using ::std::coroutine_traits;
    using ::std::noop_coroutine;
    using ::std::suspend_always;
    using ::std::suspend_never;
} // namespace std
