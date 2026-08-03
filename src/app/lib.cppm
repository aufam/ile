module;

#include "../boost.h"

export module ile:app;
import :cli;
import :whisper;
import :router;

export namespace ile {
    class App;
};

class ile::App {
public:
    explicit App(const Cli::Serve &args);

    asio::awaitable<void> async_main();
    asio::awaitable<void> async_cancel();

    asio::io_context io;

private:
    const Cli::Serve &args;
    tcp::acceptor     acceptor;
    Whisper           whisper;
    Router            router;

    asio::awaitable<void>
    handle_audio_chunk(std::shared_ptr<ws_stream> stream, beast::flat_buffer buffer, std::vector<float> &pcm_data, int &cnt);
};
