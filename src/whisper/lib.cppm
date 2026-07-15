export module ile:whisper;
import :audio_chunk;
import :std;
import :fs;

export namespace ile {
    class Whisper;
}

class ile::Whisper {
public:
    Whisper(const std::string &model);
    ~Whisper();

    std::string transcribe_file(
        const std::string &path, const std::string &language = "auto", bool detect_language = false, bool translate = false
    );

    std::string transcrib_chunk(
        const AudioChunk &chunk, const std::string &language = "auto", bool detect_language = false, bool translate = false
    );

    std::string transcrib_pcm(
        const float *data, int size, const std::string &language = "auto", bool detect_language = false, bool translate = false
    );

private:
    void *ctx;
};
