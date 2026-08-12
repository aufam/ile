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
    http_request       req;

    try {
        while (is_running) {
            buffer.clear();
            req = {};
            co_await http::async_read(stream, buffer, req);

            fmt::println(stderr, "[{}] {} {}", remote_name, req.method_string(), req.target());

            if (ws::is_upgrade(req)) {
                {
                    std::unique_lock<std::mutex> lock(this->mtx);
                    this->tcp_streams.erase(remote_name);
                }
                fmt::println(stderr, "[{}] ws update.", remote_name);
                co_await handle_ws(remote_name, std::move(stream), req);
                co_return;
            } else {
                bool keep_alive = co_await handle_http(remote_name, stream, req);
                if (!keep_alive)
                    co_return;
            }
        }
    } catch (boost::system::system_error &e) {
        if (e.code() == asio::error::operation_aborted)
            fmt::println(stderr, "[{}] session aborted.", remote_name);
        else if (e.code() == http::error::end_of_stream)
            fmt::println(stderr, "[{}] end of stream.", remote_name);
        else if (e.code() == asio::error::connection_reset)
            fmt::println(stderr, "[{}] reset by peer.", remote_name);
        else if (e.code() == asio::error::eof)
            fmt::println(stderr, "[{}] eof.", remote_name);
        else if (e.code() == asio::error::broken_pipe)
            fmt::println(stderr, "[{}] broken pipe.", remote_name);
        else if (e.code() == asio::error::connection_aborted)
            fmt::println(stderr, "[{}] connection aborted.", remote_name);
        else
            fmt::println(stderr, "[{}] unknown error: {}", remote_name, e.what());
    } catch (std::exception const &e) {
        fmt::println(stderr, "[{}] uncaught error: {}", remote_name, e.what());
    }
}

void ile::Router::close_all_streams() const {
    std::vector<beast::tcp_stream *>        tcp_streams_to_close;
    std::vector<std::shared_ptr<ws_stream>> ws_streams_to_close;

    {
        std::scoped_lock lock(mtx);
        for (auto &[_, stream] : tcp_streams)
            tcp_streams_to_close.push_back(stream);
        for (auto &[_, stream] : ws_streams)
            ws_streams_to_close.push_back(stream);
    }

    for (auto *stream : tcp_streams_to_close)
        stream->close();

    for (auto stream : ws_streams_to_close)
        stream->next_layer().close();
}
