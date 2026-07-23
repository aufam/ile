module;

#include "../boost.h"

module ile;
import fmt;
import cpx.fmt;
import cpx.protobuf;
import cpx.yy_json;

ile::Session::Session(tcp::socket socket, const ile::Cli &cli, Whisper &whisper)
    : socket(std::move(socket))
    , cli(cli)
    , whisper(whisper) {}

asio::awaitable<void> ile::Session::run() {
    auto _ = shared_from_this();

    beast::flat_buffer buffer;
    http_request       req;
    try {
        co_await http::async_read(socket, buffer, req);

        const auto remote = socket.remote_endpoint();
        fmt::println(
            "[{}:{}] {} {} HTTP/{}.{}",
            remote.address().to_string(),
            remote.port(),
            req.method_string(),
            req.target(),
            req.version() / 10,
            req.version() % 10
        );

        if (ws::is_upgrade(req)) {
            co_await handle_websocket(req);
        } else {
            co_await handle_http(req);
        }
    } catch (boost::system::system_error &e) {
        if (e.code() == asio::error::basic_errors::operation_aborted)
            fmt::println("Handler stopped.");
        else
            fmt::println("Handler error: {}", e.what());
    } catch (std::exception const &e) {
        fmt::println(stderr, "session error: {}", e.what());
    }
}

asio::awaitable<void> handle_chunk(
    const ile::Cli                          &cli,
    std::shared_ptr<ws::stream<tcp::socket>> ws,
    beast::flat_buffer                       buffer,
    ile::Whisper                            &whisper,
    std::vector<float>                      &pcm_data,
    int                                     &cnt
) {
    std::string_view sv(static_cast<const char *>(buffer.data().data()), buffer.size());

    ile::AudioChunk chunk = {};
    try {
        cpx::protobuf::parse(sv, chunk);
    } catch (std::exception &e) {
        fmt::println("{}", e.what());
        co_return;
    }

    auto res = chunk.write_wav();
    if (res.is_err()) {
        fmt::println("write wav error: {}", res.error().what());
        co_return;
    }

    auto chunk_f32 = chunk.to_pcm_f32();

    pcm_data.resize(chunk_f32.size() * 5, 0);

    std::memcpy(&pcm_data[cnt * chunk_f32.size()], chunk_f32.data(), chunk_f32.size() * sizeof(float));
    cnt++;

    if (cnt == 5) {
        std::string res =
            whisper.transcrib_pcm(pcm_data.data(), (int)pcm_data.size(), cli.language, cli.detect_language, cli.translate);
        fmt::println("{}:{} {}", chunk.branch, chunk.counter, res);
        co_await ws->async_write(asio::buffer(res));
        cnt = 0;
    }
}

asio::awaitable<void> ile::Session::handle_websocket(const http_request &req) {
    auto ws = std::make_shared<ws::stream<tcp::socket>>(std::move(socket));

    co_await ws->async_accept(req);

    std::vector<float> pcm_data;
    int                cnt = 0;

    while (true) {
        beast::flat_buffer buffer;

        try {
            co_await ws->async_read(buffer);
        } catch (boost::system::system_error &e) {
            if (e.code() == ws::error::closed) {
                fmt::println("closed");
                break;
            }
            throw;
        }

        auto ctx = co_await asio::this_coro::executor;
        asio::co_spawn(ctx, handle_chunk(cli, ws, std::move(buffer), whisper, pcm_data, cnt), asio::detached);
    }
}

asio::awaitable<void> ile::Session::handle_http(const http_request &req) {
    http_response res;
    res.version(req.version());
    res.set(http::field::server, "ile");

    const std::string path = req.target() == "/" || req.target().empty() //
                                 ? "static/index.html"
                                 : "static" + std::string(req.target());

    std::ifstream file(path, std::ios::binary);
    if (!file) {
        res.result(http::status::not_found);
        res.set(http::field::content_type, "text/plain");
        res.body() = "404 Not Found";
    } else {
        std::string body((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

        if (path.ends_with(".html")) {
            res.set(http::field::content_type, "text/html");
        } else if (path.ends_with(".js")) {
            res.set(http::field::content_type, "application/javascript");
        } else if (path.ends_with(".css")) {
            res.set(http::field::content_type, "text/css");
        }

        res.body() = std::move(body);
        res.result(http::status::ok);
    }

    res.prepare_payload();
    co_await http::async_write(socket, res);
}
