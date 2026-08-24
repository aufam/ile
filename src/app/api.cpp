module;

#include "../boost.h"

module ile;
import fmt;

void ile::App::api() {
    router.use("/", [](Context &c) -> awaitable<void> {
        const auto  ep  = c.stream->socket().remote_endpoint();
        const auto &req = c.req();
        fmt::println("[{}:{}] {} {}", ep.address().to_string(), ep.port(), req.method_string(), req.target());

        co_await c.next();

        const auto &res = c.res();
        fmt::println("[{}:{}] {} {}", ep.address().to_string(), ep.port(), (int)res.result(), res.reason());
    });

    router.use("/api/", [](Context &c) -> awaitable<void> {
        http::request_parser<http::string_body> &parser = c.parser_string();
        http::request<http::string_body>        &req    = parser.get();
        http::response<http::string_body>       &res    = c.response_string();

        if (req.has_content_length())
            co_await http::async_read(*c.stream, c.buffer, parser);

        co_await c.next();

        res.prepare_payload();
        co_await http::async_write(*c.stream, res);
    });
}
