import ile;
import fmt;
import cpx.cli11;

asio::awaitable<void> async_main(const ile::Cli &cli) {
    auto io = co_await asio::this_coro::executor;

    auto acceptor = tcp::acceptor(io, {tcp::v4(), (unsigned short)cli.port});

    fmt::println("Server is running on http://localhost:{}", cli.port);

    while (true) {
        tcp::socket socket = co_await acceptor.async_accept();

        auto session = std::make_shared<ile::Session>(std::move(socket));

        asio::co_spawn(io, session->run(), asio::detached);
    }
}

asio::awaitable<void> async_terminate(asio::io_context &io) {
    asio::signal_set signals(io, asio::signals::sigint, asio::signals::sigterm);

    auto signal = co_await signals.async_wait();

    fmt::println("Got signal={}", signal);

    io.stop();
}

int main(int argc, char **argv) {
    try {
        auto cli = cpx::cli11::parse<ile::Cli>("ile", argc, argv);

        asio::io_context io(8);
        asio::co_spawn(io, async_main(cli), asio::detached);
        asio::co_spawn(io, async_terminate(io), asio::detached);

        io.run();
    } catch (std::exception &e) {
        std::cerr << e.what() << std::endl;
        return 1;
    }

    return 0;
}
