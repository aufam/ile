module;

#include <unordered_map>
#include <tuple>
#include <mutex>
#include <filesystem>
#include <string>
#include <algorithm>
#include "../boost.h"

module ile;
import fmt;
import cpx;
import cpx.serde;
import cpx.protobuf;
import cpx.toruniina_toml;
import cpx.yy_json;

ile::App::App(const ile::Cli::Serve &args)
    : args(args)
    , acceptor(io)
    , whisper(args.whisper_model)
    , db(args.db) {
    try {
        const auto address  = asio::ip::make_address(args.host);
        const auto endpoint = tcp::endpoint(address, args.port);

        acceptor.open(endpoint.protocol());
        acceptor.set_option(tcp::acceptor::reuse_address(true));
        acceptor.bind(endpoint);
        acceptor.listen(asio::socket_base::max_listen_connections);
    } catch (boost::system::system_error &e) {
        if (e.code() == asio::error::address_in_use)
            fmt::println(stderr, "Error: Port {} is already in use.", args.port);
        else
            fmt::println(stderr, "Failed to start acceptor on port {}: {}", args.port, e.what());
        exit(1);
    }

    {
        using ile::database::items;
        db(cpx::sql::create_table_if_not_exists<items>(
            items.id,
            items.ticket_id,
            items.title,
            items.photo,
            items.weighing_photo,
            items.xrf_photo,
            items.weight,
            items.carat,
            items.price_per_gram,
            items.total_price
        ));

        using ile::database::tickets;
        db(cpx::sql::create_table_if_not_exists<tickets>(
            tickets.id,
            tickets.office,
            tickets.counter,
            tickets.staff_name,
            tickets.customer_name,
            tickets.customer_queue_number,
            tickets.queue_number,
            tickets.date,
            tickets.status,
            tickets.signature
        ));
    }

    if (std::filesystem::exists(args.offices))
        cpx::toruniina_toml::parse_from_file(args.offices, this->offices);

    router.mounts["/"] = "static";

    router.http_handlers["GET /api/offices"] = [this](const http_request &, http_response &res) -> asio::awaitable<void> {
        std::unique_lock<std::mutex> lock(this->mtx);
        res.body() = cpx::yy_json::dump(this->offices);
        res.set(http::field::content_type, "application/json");
        co_return;
    };

    router.http_handlers["PATCH /api/prices"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        std::string office, price_type;
        size_t      new_price;
        std::tuple  fields = {
            cpx::field_ref(office)     = "office",
            cpx::field_ref(price_type) = "priceType",
            cpx::field_ref(new_price)  = "newPrice",
        };

        try {
            cpx::yy_json::parse(req.body(), fields);
        } catch (cpx::serde::error &e) {
            res.result(http::status::bad_request);
            co_return;
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto it = this->offices.find(office);
        if (it == this->offices.end()) {
            res.result(http::status::not_found);
            co_return;
        }

        auto &pricelist = it->second.pricelist;

        auto p = std::find_if(pricelist.begin(), pricelist.end(), [&price_type](Price &p) { return p.type == price_type; });
        if (p == pricelist.end()) {
            res.result(http::status::not_found);
            co_return;
        }

        p->price = new_price;
        std::ofstream ofs(this->args.offices);
        ofs << cpx::toruniina_toml::io << this->offices;
        res.result(http::status::no_content);
        co_return;
    };

    router.http_handlers["POST /api/tickets"] = [this](const http_request &req, http_response &res) -> asio::awaitable<void> {
        std::string office, counter, staff_name, customer_name, customer_queue_number, date;
        std::tuple  fields = {
            cpx::field_ref(office)                = "office",
            cpx::field_ref(counter)               = "counter",
            cpx::field_ref(staff_name)            = "staff_name",
            cpx::field_ref(customer_name)         = "customer_name",
            cpx::field_ref(customer_queue_number) = "customer_queue_number",
            cpx::field_ref(date)                  = "date",
        };

        try {
            cpx::yy_json::parse(req.body(), fields);
        } catch (cpx::serde::error &e) {
            res.result(http::status::bad_request);
            co_return;
        }
    };

    router.ws_handlers["/ws/state"] =
        [this](const http_request &req, std::shared_ptr<ws_stream> stream) -> asio::awaitable<void> {
        auto url = boost::urls::parse_uri_reference(req.target());
        if (!url)
            co_return;

        auto params = url->params();

        std::string office, counter;
        for (auto param : params) {
            if (param.key == "office")
                office = std::string(param.value);
            if (param.key == "counter")
                counter = std::string(param.value);
        }

        std::unique_lock<std::mutex> lock(this->mtx);

        auto it = this->offices.find(office);
        if (it == this->offices.end()) {
            co_return;
        }

        auto &counters = it->second.counters;

        auto p = std::find_if(counters.begin(), counters.end(), [&counter](std::string &c) { return c == counter; });
        if (p == counters.end()) {
            co_return;
        }

        auto key = office + "@" + counter;
        this->states[key].push_back(stream);
    };

    router.ws_handlers["/audio"] = [this](const http_request &, std::shared_ptr<ws_stream> stream) -> asio::awaitable<void> {
        while (is_running) {
            beast::flat_buffer buffer;

            try {
                co_await stream->async_read(buffer);
            } catch (boost::system::system_error &e) {
                if (e.code() == ws::error::closed) {
                    fmt::println(stderr, "ws closed");
                    break;
                }
                throw;
            }

            std::string_view sv(static_cast<const char *>(buffer.data().data()), buffer.size());
            if (sv == "done") {
                // TODO
                co_return;
            }

            ile::AudioChunk chunk = {};
            try {
                cpx::protobuf::parse(sv, chunk);
            } catch (std::exception &e) {
                fmt::println(stderr, "{}:{}: parse error: {}", chunk.branch, chunk.counter, e.what());
                co_return;
            }

            auto res = chunk.write_wav();
            if (res.is_err()) {
                fmt::println(stderr, "{}:{}: write wav error: {}", chunk.branch, chunk.counter, res.error().what());
                co_return;
            }
        }
    };
}
