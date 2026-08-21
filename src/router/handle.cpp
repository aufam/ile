module;

#include <functional>
#include "../boost.h"

module ile;
import cpx;

auto ile::Router::handle(std::shared_ptr<tcp_stream> stream) const -> awaitable<bool> {
    Context ctx;
    ctx.stream = stream;

    auto &parser = std::get<0>(ctx.parser);
    co_await http::async_read_header(*stream, ctx.buffer, parser);

    const auto url = urls::parse_origin_form(ctx.req().target());
    if (!url) {
        auto &res = ctx.response_empty();
        res.result(http::status::bad_request);
        co_await http::async_write(*stream, res);
        co_return res.keep_alive();
    }
    ctx.url = *url;

    if (boost::beast::websocket::is_upgrade(parser.get())) {
        co_await handle_ws(ctx);
        co_return false;
    }

    {
        std::unique_lock<std::mutex> lock(_mtx);
        _tcp_streams.push_back(stream);
    };
    cpx::defer _ = [&]() {
        std::unique_lock<std::mutex> lock(_mtx);
        std::remove_if(_tcp_streams.begin(), _tcp_streams.end(), [&](auto &s) { return s.get() == stream.get(); });
    };

    match(ctx);
    co_await ctx.next();
    co_return std::visit([](auto &res) { return res.keep_alive(); }, ctx.response);
}

auto ile::Router::handle_ws(Context &c) const -> awaitable<bool> {
    const auto &url_path = c.url.path();

    {
        std::scoped_lock<std::mutex> lock(_mtx);
        c.handlers.reserve(middlewares.size() + 1);
        for (const auto &[path, fn] : middlewares) {
            if (url_path.starts_with(path))
                c.handlers.push_back(fn);
        }
    }

    c.handlers.push_back([this](Context &c) -> awaitable<void> {
        std::function<awaitable<void>(Context &)> handler;
        {
            std::scoped_lock<std::mutex> lock(_mtx);

            auto it = ws_handlers.find(c.url.path());
            if (it == ws_handlers.end())
                co_return;

            handler     = it->second;
            c.ws_stream = std::make_shared<ws_stream>(std::move(*c.stream));

            _ws_streams.push_back(c.ws_stream);
        }

        auto &stream = *c.ws_stream;

        cpx::defer _ = [&]() {
            std::unique_lock<std::mutex> lock(_mtx);
            std::remove_if(_ws_streams.begin(), _ws_streams.end(), [&](auto &s) { return s.get() == &stream; });
        };

        co_await stream.async_accept(std::get<0>(c.parser).get());

        co_await handler(c);

        if (stream.is_open())
            co_await stream.async_close(ws::close_code::normal);
    });

    co_await c.next();
    co_return false;
}

auto ile::Router::close_all_streams() const -> awaitable<void> {
    std::vector<std::shared_ptr<ws_stream>> streams;
    {
        std::unique_lock<std::mutex> lock(_mtx);
        for (auto &s : _ws_streams)
            streams.push_back(s);
    }

    for (auto &s : streams)
        co_await s->async_close(ws::close_code::normal);

    {
        std::unique_lock<std::mutex> lock(_mtx);
        for (auto &s : _tcp_streams)
            s->close();
    }
}
