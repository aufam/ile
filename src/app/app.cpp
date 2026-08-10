module;

#include <filesystem>
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

    namespace sql = cpx::sql;
    using ile::database::items;
    using ile::database::tickets;

    {
        db(sql::create_table_if_not_exists<items>(
            items.id,
            items.ticket_id,
            items.title,
            items.photo,
            items.weighing_photo,
            items.xrf_photo,
            items.weight,
            items.carat,
            items.price_type,
            items.price_per_gram,
            items.total_price
        ));

        db(sql::create_table_if_not_exists<tickets>(
            tickets.id,
            tickets.office,
            tickets.counter,
            tickets.staff_name,
            tickets.customer_name,
            tickets.customer_queue_number,
            tickets.date,
            tickets.status,
            tickets.signature
        ));
    }

    if (std::filesystem::exists(args.offices))
        cpx::toruniina_toml::parse_from_file(args.offices, this->offices);

    router.mounts["/"] = "static";
    api_offices();
    api_tickets();
    api_items();
    api_states();

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
