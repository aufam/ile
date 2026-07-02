export module ile;
export import :boost;
export import :std;
import cpx;
import cpx.cli11;

export namespace ile {
    class Session;

    struct Cli;

    struct AudioChunk;
} // namespace ile


namespace http = beast::http;
namespace ws   = beast::websocket;


class ile::Session : public std::enable_shared_from_this<Session> {
public:
    Session(tcp::socket socket);

    asio::awaitable<void> run();

private:
    tcp::socket socket;

    asio::awaitable<void> handle_websocket(const http::request &req);

    asio::awaitable<void> handle_http(const http::request &req);
};

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

struct ile::AudioChunk {
    std::string_view branch, counter, client_id;
    unsigned         sample_rate, bits_per_sample;
    std::string_view pcm;
};

template <>
struct cpx::Reflect<ile::AudioChunk> : cpx::Fields<
                                           cpx::Reflect<ile::AudioChunk>,
                                           &ile::AudioChunk::branch,
                                           &ile::AudioChunk::counter,
                                           &ile::AudioChunk::client_id,
                                           &ile::AudioChunk::sample_rate,
                                           &ile::AudioChunk::bits_per_sample,
                                           &ile::AudioChunk::pcm> {
    static constexpr TagInfo branch          = "branch,field_number=1";
    static constexpr TagInfo counter         = "counter,field_number=2";
    static constexpr TagInfo client_id       = "client_id,field_number=3";
    static constexpr TagInfo sample_rate     = "sample_rate,field_number=4";
    static constexpr TagInfo bits_per_sample = "bits_per_sample,field_number=5";
    static constexpr TagInfo pcm             = ",field_number=6";

    static constexpr tags_type tags() {
        return std::tie(branch, counter, client_id, sample_rate, bits_per_sample, pcm);
    }
};
