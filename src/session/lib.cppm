module;

#include "../boost.h"

export module ile:session;
import :cli;
import :whisper;

export namespace ile {
    class Session;
} // namespace ile


class ile::Session : public std::enable_shared_from_this<Session> {
public:
    Session(tcp::socket socket, const ile::Cli &cli, Whisper &whisper);

    asio::awaitable<void> run();

private:
    tcp::socket socket;
    const Cli  &cli;
    Whisper    &whisper;

    asio::awaitable<void> handle_websocket(const http_request &req);

    asio::awaitable<void> handle_http(const http_request &req);
};
