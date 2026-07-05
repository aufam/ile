module ile;
import fmt;
import cpx.fmt;
import cpx.protobuf;

namespace http = beast::http;
namespace ws   = beast::websocket;

ile::Session::Session(tcp::socket socket)
    : socket(std::move(socket)) {}

asio::awaitable<void> ile::Session::run() {
    auto _ = shared_from_this();

    beast::flat_buffer buffer;
    http::request      req;
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
    } catch (std::exception const &e) {
        std::cerr << "session error: " << e.what() << '\n';
    }
}

asio::awaitable<void> ile::Session::handle_websocket(const beast::http::request &req) {
    ws::stream<tcp::socket> ws(std::move(socket));
    co_await ws.async_accept(req);

    beast::flat_buffer buffer;
    try {
        while (true) {
            co_await ws.async_read(buffer);

            const auto buffer_size = buffer.size();

            std::string_view sv(static_cast<const char *>(buffer.data().data()), buffer.size());

            AudioChunk chunk = {};
            try {
                cpx::protobuf::parse(sv, chunk);
            } catch (std::exception &e) {
                fmt::println("{}", e.what());
                std::ignore = e;
            }

            const auto size = chunk.pcm.size();
            const auto pcm  = chunk.pcm;
            chunk.pcm       = "";
            if (chunk.bits_per_sample)
                try {
                    fmt::println("chunk={}, size={}, buffer_size={}", chunk, size, buffer_size);
                } catch (std::exception &e) {
                    fmt::println("{}", e.what());
                }

            chunk.pcm = pcm;
            auto res  = chunk.write_wav();
            if (res.is_err()) {
                fmt::println("write wav error: {}", res.error().what());
            }
            buffer.consume(buffer.size());
        }
    } catch (std::exception &e) {
        fmt::println("hard fault: {}", e.what());
    }
}

asio::awaitable<void> ile::Session::handle_http(const beast::http::request &req) {
    http::response res;
    res.version(req.version());
    res.set(http::field::server, "ile");

    const std::string path = req.target() == "/" ? "static/index.html" : "static" + std::string(req.target());
    std::ifstream     file(path, std::ios::binary);
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
