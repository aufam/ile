export module ile:cli;
import :std;
import cpx;

export namespace ile {
    struct Cli;
} // namespace ile

struct ile::Cli {
    int port = 5000;
};

template <>
struct cpx::Reflect<ile::Cli> : cpx::Fields<cpx::Reflect<ile::Cli>, &ile::Cli::port> {
    static constexpr TagInfo port = "port,skipmissing";

    static constexpr tags_type tags() {
        return std::tie(port);
    }
};
