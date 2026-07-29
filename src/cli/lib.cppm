module;

#include <string>
#include <optional>
#include <cstdint>

export module ile:cli;
import cpx;

export namespace ile {
    struct Cli;
} // namespace ile

struct ile::Cli {
    struct Serve {
        std::string host            = "0.0.0.0";
        uint16_t    port            = 5000;
        uint8_t     parallel        = 8;
        std::string whisper_model   = "models/ggml-base.bin";
        std::string language        = "auto";
        bool        detect_language = false;
        bool        translate       = false;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Serve::port>            = "port,skipmissing,env=ILE_PORT",
            cpx::field<&Serve::parallel>        = "parallel,short=j,skipmissing",
            cpx::field<&Serve::whisper_model>   = "whisper-model,skipmissing,env=ILE_WHISPER_MODEL",
            cpx::field<&Serve::language>        = "language,skipmissing,env=ILE_LANGUAGE",
            cpx::field<&Serve::detect_language> = "detect-language",
            cpx::field<&Serve::translate>       = "translate",
        };
    };
    std::optional<Serve> serve;

    struct Transcribe {
        std::string file;
        std::string whisper_model   = "models/ggml-base.bin";
        std::string language        = "auto";
        bool        detect_language = false;
        bool        translate       = false;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Transcribe::file>            = "file,positional",
            cpx::field<&Transcribe::whisper_model>   = "whisper-model,skipmissing,env=ILE_WHISPER_MODEL",
            cpx::field<&Transcribe::language>        = "language,skipmissing,env=ILE_LANGUAGE",
            cpx::field<&Transcribe::detect_language> = "detect-language",
            cpx::field<&Transcribe::translate>       = "translate",
        };
    };
    std::optional<Transcribe> transcribe;

    struct Record {
        std::string output_path;

        static constexpr std::tuple __field_tags__ = {
            cpx::field<&Record::output_path> = "output,positional",
        };
    };
    std::optional<Record> record;

    static constexpr std::tuple __field_tags__ = {
        cpx::field<&Cli::serve>      = "serve,help=Launch http server",
        cpx::field<&Cli::transcribe> = "transcribe,help=Transcribe an audio file",
        cpx::field<&Cli::record>     = "record,help=Record your voice",
    };
};
