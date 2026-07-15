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

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Transcribe::file> = "file,positional",
        };
    };
    std::optional<Transcribe> transcribe;

    struct Evaluate {
        std::string ollama_host = "localhost";
        int         ollama_port = 11434;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Evaluate::ollama_host> = "host,skipmissing",
            cpx::field<&Evaluate::ollama_port> = "port,skipmissing",
        };
    };
    std::optional<Evaluate> evalueate;

    struct Record {
        std::string output_path;
        void        record() const;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Record::output_path> = "output,positional",
        };
    };
    std::optional<Record> record;

    static constexpr std::tuple __field_tags__ = {
        cpx::field<&Cli::port>            = "port,skipmissing",
        cpx::field<&Cli::model>           = "model,skipmissing",
        cpx::field<&Cli::language>        = "language,skipmissing",
        cpx::field<&Cli::detect_language> = "detect-language",
        cpx::field<&Cli::translate>       = "translate",
        cpx::field<&Cli::transcribe>      = "transcribe",
        cpx::field<&Cli::record>          = "record",
    };
};
