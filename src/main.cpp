module;

#include "boost.h"
#include <laserpants/dotenv/dotenv.h>

module ile;
import fmt;
import cpx.cli11;

extern "C++" int main(int argc, char **argv) {
    dotenv::init();

    const auto cli = cpx::cli11::parse<ile::Cli>("ile", argc, argv);

    if (const auto &c = cli.record; c.has_value()) {
        ile::Recorder r = {c->output_path};
        r.record();
        return 0;
    }

    if (const auto &c = cli.transcribe; c.has_value()) {
        ile::Whisper whisper(c->whisper_model);

        auto res = whisper.transcribe_file(c->file, c->language, c->detect_language, c->translate);
        fmt::println("{}", res);
        return 0;
    }

    const auto args  = cli.serve.value_or(ile::Cli::Serve{});
    const auto nproc = args.parallel;
    ile::App   app(args);

    asio::co_spawn(app.io, app.async_main(), asio::detached);
    asio::co_spawn(app.io, app.async_cancel(), asio::detached);

    std::vector<std::thread> ts;
    ts.reserve(nproc);
    for (uint8_t i = 0; i < nproc; ++i)
        ts.emplace_back([&]() { app.io.run(); });

    for (uint8_t i = 0; i < nproc; ++i)
        ts[i].join();

    return 0;
}
