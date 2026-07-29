module;

#include <functional>
#include <unordered_map>
#include "../boost.h"

export module ile:router;

export namespace ile {
    struct Router;
} // namespace ile

struct ile::Router {
    using Handler  = std::function<asio::awaitable<void>(const http_request &, http_response &)>;
    using Handlers = std::unordered_map<std::string, Handler>;

    Handlers    handlers;
    std::string mounted_dir;

    asio::awaitable<void> handle(tcp::socket &, const http_request &) const;

    Handler match(const http_request &) const;
};
