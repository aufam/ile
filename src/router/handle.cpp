module;

#include <mutex>
#include "../boost.h"

module ile;
import fmt;
import cpx;

asio::awaitable<void> ile::Router::handle(beast::tcp_stream stream) const {
    auto      &socket      = stream.socket();
    const auto remote      = socket.remote_endpoint();
    const auto remote_name = fmt::format("{}:{}", remote.address().to_string(), remote.port());

    {
        std::unique_lock<std::mutex> lock(this->mtx);
        this->tcp_streams[remote_name] = &stream;
    }
    cpx::defer _ = [&]() {
        std::unique_lock<std::mutex> lock(this->mtx);
        this->tcp_streams.erase(remote_name);
    };

    beast::flat_buffer buffer;

    try {
        while (is_running) {
            buffer.clear();
            http_request req;

            http::request_parser<http::string_body> parser;
            parser.body_limit(20 * 1024 * 1024); // 20 MiB

            co_await http::async_read(stream, buffer, parser);

            req = parser.release();

            fmt::println(stderr, "[{}] {} {}", remote_name, req.method_string(), req.target());

            if (ws::is_upgrade(req)) {
                {
                    std::unique_lock<std::mutex> lock(this->mtx);
                    this->tcp_streams.erase(remote_name);
                }
                fmt::println(stderr, "[{}] ws upgraded", remote_name);
                co_await handle_ws(remote_name, std::move(stream), req);
                co_return;
            } else {
                bool keep_alive = co_await handle_http(remote_name, stream, req);
                if (!keep_alive)
                    co_return;
            }
        }
    } catch (boost::system::system_error &e) {
        fmt::println(stderr, "[{}] {}", remote_name, e.code().message());
    } catch (std::exception const &e) {
        fmt::println(stderr, "[{}] uncaught error: {}", remote_name, e.what());
    }
}

asio::awaitable<void> ile::Router::close_all_streams() const {
    std::vector<std::shared_ptr<ws_stream>> ws_streams_to_close;
    {
        std::scoped_lock lock(mtx);
        for (auto &[_, stream] : tcp_streams)
            stream->close();
        for (auto &[_, stream] : ws_streams)
            ws_streams_to_close.push_back(stream);
    }

    for (auto stream : ws_streams_to_close)
        try {
            co_await stream->async_close(ws::close_code::normal);
        } catch (const boost::system::system_error &e) {
            std::ignore = e;
        }
}
