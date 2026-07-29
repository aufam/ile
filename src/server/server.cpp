module;

#include "../boost.h"

module ile;
import fmt;

ile::Server::Server(const ile::Cli::Serve &args, tcp::acceptor &acceptor)
    : args(args)
    , acceptor(acceptor)
    , whisper(args.whisper_model) {

    router.mounted_dir = "static/";

    router.handlers["GET /"] = [](const http_request &, http_response &res) -> asio::awaitable<void> {
        res.result(http::status::moved_permanently);
        res.set(http::field::location, "/index.html");
        co_return;
    };

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
}
