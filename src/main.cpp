module ile;
import fmt;
import cpx.cli11;

asio::awaitable<void> async_main(tcp::acceptor &acceptor, const ile::Cli &cli, ile::Whisper &whisper) {
    auto io = co_await asio::this_coro::executor;

    fmt::println("Server is running on http://localhost:{}", cli.port);

    while (true) {
        try {
            tcp::socket socket = co_await acceptor.async_accept();

            auto session = std::make_shared<ile::Session>(std::move(socket), cli, whisper);

            asio::co_spawn(io, session->run(), asio::detached);
        } catch (boost::system::system_error &e) {
            if (e.code() == asio::error::basic_errors::operation_aborted)
                fmt::println("Acceptor stopped.");
            else
                fmt::println("Accept error: {}", e.what());
            break;
        }
    }
}

asio::awaitable<void> async_terminate(tcp::acceptor &acceptor) {
    asio::signal_set signals(co_await asio::this_coro::executor, asio::signals::sigint, asio::signals::sigterm);

    auto signal = co_await signals.async_wait();
    fmt::println("Got signal={}", signal);

    boost::system::error_code ec;
    std::ignore = acceptor.close(ec);
}

extern "C++" int main(int argc, char **argv) {
    const auto cli = cpx::cli11::parse<ile::Cli>("ile", argc, argv);

    if (const auto &r = cli.record; r.has_value()) {
        r->record();
        return 0;
    }

    ile::Whisper whisper(cli.model);

    if (const auto &t = cli.transcribe; t.has_value()) {
        auto res = whisper.transcribe_file(t->file, cli.language, cli.detect_language, cli.translate);
        fmt::println("{}", res);
        return 0;
    }

    asio::io_context          io;
    boost::system::error_code ec;

    tcp::endpoint endpoint(tcp::v4(), static_cast<unsigned short>(cli.port));
    tcp::acceptor acceptor(io);

    std::ignore = acceptor.open(endpoint.protocol(), ec);
    if (!ec)
        std::ignore = acceptor.set_option(tcp::acceptor::reuse_address(true), ec); // Good practice for fast restarts
    if (!ec)
        std::ignore = acceptor.bind(endpoint, ec);
    if (!ec)
        std::ignore = acceptor.listen(asio::socket_base::max_listen_connections, ec);

    if (ec) {
        if (ec == asio::error::basic_errors::address_in_use)
            fmt::println("Error: Port {} is already in use.", cli.port);
        else
            fmt::println("Failed to start acceptor on port {}: {}", cli.port, ec.message());
        return 1;
    }

    asio::co_spawn(io, async_main(acceptor, cli, whisper), asio::detached);
    asio::co_spawn(io, async_terminate(acceptor), asio::detached);

    std::vector<std::thread> ts;
    ts.reserve(8);
    for (int i = 0; i < 8; ++i)
        ts.emplace_back([&]() { io.run(); });

    for (int i = 0; i < 8; ++i)
        ts[i].join();

    return 0;
}
