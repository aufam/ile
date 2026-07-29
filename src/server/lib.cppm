module;

#include <functional>
#include <unordered_map>
#include "../boost.h"

export module ile:server;
import :cli;
import :whisper;
import :router;

export namespace ile {
    class Server;
}

class ile::Server {
public:
    Server(const Cli::Serve &, tcp::acceptor &);

    asio::awaitable<void> async_main();

private:
    const Cli::Serve &args;
    tcp::acceptor    &acceptor;
    Whisper           whisper;
    Router            router;
};
