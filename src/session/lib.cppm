module;

#include <vector>
#include "../boost.h"

export module ile:session;
import :cli;
import :whisper;
import :router;

export namespace ile {
    class Session;
} // namespace ile


class ile::Session : public std::enable_shared_from_this<Session> {
public:
    Session(tcp::socket socket, const ile::Cli::Serve &args, Whisper &whisper, const Router &);

    asio::awaitable<void> run();

private:
    tcp::socket       socket;
    const Cli::Serve &args;
    Whisper          &whisper;
    const Router     &router;

    asio::awaitable<void> handle_websocket(const http_request &req);

    asio::awaitable<void> handle_http(const http_request &req);

    asio::awaitable<void>
    handle_chunk(std::shared_ptr<ws_stream> stream, beast::flat_buffer buffer, std::vector<float> &pcm_data);
};
