module;

#include <atomic>
#include <unordered_map>
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
    std::atomic_bool &is_running = router.is_running;

    std::unordered_map<std::string, std::vector<std::string>> branches;
};
