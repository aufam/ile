module ile;
import fmt;
import cpx.cli11;

asio::awaitable<void> async_main(const ile::Cli &cli, bool &is_running) {
    auto io = co_await asio::this_coro::executor;

    auto acceptor = tcp::acceptor(io, {tcp::v4(), (unsigned short)cli.port});

    fmt::println("Server is running on http://localhost:{}", cli.port);

    while (is_running) {
        tcp::socket socket = co_await acceptor.async_accept();

        auto session = std::make_shared<ile::Session>(std::move(socket), cli);

        asio::co_spawn(io, session->run(), asio::detached);
    }
}

asio::awaitable<void> async_terminate(asio::io_context &io, bool &is_running) {
    asio::signal_set signals(io, asio::signals::sigint, asio::signals::sigterm);

    auto signal = co_await signals.async_wait();

    fmt::println("Got signal={}", signal);

    is_running = false;
}

extern "C++" int main(int argc, char **argv) {
    bool is_running = true;

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

    try {
        asio::io_context io(8);
        asio::co_spawn(io, async_main(cli, is_running), asio::detached);
        asio::co_spawn(io, async_terminate(io, is_running), asio::detached);

        io.run();
    } catch (std::exception &e) {
        fmt::println("{}", e.what());
        return 1;
    }

    return 0;
}
