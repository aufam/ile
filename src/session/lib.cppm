export module ile:session;
import :std;
import :asio;
import :beast;
import :tcp;

export namespace ile {
    class Session;
} // namespace ile


class ile::Session : public std::enable_shared_from_this<Session> {
public:
    Session(tcp::socket socket);

    asio::awaitable<void> run();

private:
    tcp::socket socket;

    asio::awaitable<void> handle_websocket(const beast::http::request &req);

    asio::awaitable<void> handle_http(const beast::http::request &req);
};
