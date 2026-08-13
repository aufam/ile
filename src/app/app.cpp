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

    db(ile::database::create_table_items());
    db(ile::database::create_table_tickets());

    if (std::filesystem::exists(args.offices))
        cpx::toruniina_toml::parse_from_file(args.offices, this->offices);

    router.mounts["/"] = "static";
    api_offices();
    api_tickets();
    api_items();
    api_states();
    api_images();

    router.http_handlers["GET /api/rooms"] = [this](const http_request &, http_response &res) -> asio::awaitable<void> {
        std::unique_lock<std::mutex> lock(this->mtx);

        std::vector<Room>   rooms;
        std::vector<size_t> lengths;
        for (auto &[room, streams] : this->rooms) {
            rooms.push_back(room);
            lengths.push_back(streams.size());
        }

        std::tuple fields = {
            cpx::field_ref(rooms)   = "rooms",
            cpx::field_ref(lengths) = "lengths",
        };

        res.body() = cpx::yy_json::dump(fields);
        res.set(http::field::content_type, "application/json");
        res.result(http::status::ok);
        co_return;
    };

    router.ws_handlers["/audio"] = [this](const http_request &, std::shared_ptr<ws_stream> stream) -> asio::awaitable<void> {
        while (is_running) {
            beast::flat_buffer buffer;
            co_await stream->async_read(buffer);

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
