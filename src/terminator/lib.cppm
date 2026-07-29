module;

#include "../boost.h"

export module ile:terminator;

export namespace ile {
    struct Terminator;
} // namespace ile

struct ile::Terminator {
    tcp::acceptor &acceptor;

    asio::awaitable<void> async_main();
};
