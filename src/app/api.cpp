module;

#include "../boost.h"

module ile;

void ile::App::api() {
    router.use("/api/", [](Context &c) -> awaitable<void> {
        auto &req = c.parser_string().get();
        auto &res = c.response_string();
        co_await http::async_read(*c.stream, c.buffer, req);

        co_await c.next();

        res.prepare_payload();
        co_await http::async_write(*c.stream, res);
    });
}
