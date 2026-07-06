export module ile:cli;
import :std;
import cpx;

export namespace ile {
    struct Cli;
} // namespace ile

struct ile::Cli {
    int         port            = 5000;
    std::string model           = "/home/aufa/whisper.cpp/models/ggml-base.bin";
    std::string language        = "auto";
    bool        detect_language = false;
    bool        translate       = false;

    struct Transcribe {
        std::string file;
    };
    std::optional<Transcribe> transcribe;

    struct Evaluate {
        std::string ollama_host = "localhost";
        int         ollama_port = 11434;
    };
    std::optional<Evaluate> evalueate;
};

template <>
struct cpx::Reflect<ile::Cli> : cpx::Fields<
                                    cpx::Reflect<ile::Cli>,
                                    &ile::Cli::port,
                                    &ile::Cli::model,
                                    &ile::Cli::language,
                                    &ile::Cli::detect_language,
                                    &ile::Cli::translate,
                                    &ile::Cli::transcribe> {
    static constexpr TagInfo port            = "port,skipmissing";
    static constexpr TagInfo model           = "model,skipmissing";
    static constexpr TagInfo language        = "language,skipmissing";
    static constexpr TagInfo detect_language = "detect-language";
    static constexpr TagInfo translate       = "translate";
    static constexpr TagInfo transcribe      = "transcribe";

    static constexpr tags_type tags() {
        return std::tie(port, model, language, detect_language, translate, transcribe);
    }
};

template <>
struct cpx::Reflect<ile::Cli::Transcribe> : cpx::Fields<cpx::Reflect<ile::Cli::Transcribe>, &ile::Cli::Transcribe::file> {
    static constexpr TagInfo file = "file,positional";

    static constexpr tags_type tags() {
        return std::tie(file);
    }
};

template <>
struct cpx::Reflect<ile::Cli::Evaluate>
    : cpx::Fields<cpx::Reflect<ile::Cli::Evaluate>, &ile::Cli::Evaluate::ollama_host, &ile::Cli::Evaluate::ollama_port> {
    static constexpr TagInfo host = "host,skipmissing";
    static constexpr TagInfo port = "port,skipmissing";

    static constexpr tags_type tags() {
        return std::tie(host, port);
    }
};
