module;

#include <atomic>
#include <unordered_map>
#include <tuple>
#include <mutex>
#include <vector>
#include "../boost.h"

export module ile:app;
import :cli;
import :whisper;
import :router;
import cpx.sqlite;

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
    const Cli::Serve        &args;
    tcp::acceptor            acceptor;
    Whisper                  whisper;
    Router                   router;
    std::atomic_bool        &is_running = router.is_running;
    cpx::sqlite3::Connection db;
    mutable std::mutex       mtx;

    struct Price {
        std::string type;
        size_t      price;
        std::string description;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Price::type>        = "type",
            cpx::field<&Price::price>       = "price",
            cpx::field<&Price::description> = "description,skipmissing,omitempty",
        };
    };

    struct Office {
        std::string              name;
        std::string              manager;
        std::vector<std::string> counters;
        std::vector<Price>       pricelist;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Office::name>      = "name",
            cpx::field<&Office::manager>   = "manager",
            cpx::field<&Office::counters>  = "counters",
            cpx::field<&Office::pricelist> = "pricelist",
        };
    };

    std::unordered_map<std::string, Office> offices;

    std::unordered_map<std::string, std::vector<std::shared_ptr<ws_stream>>> states;
};
