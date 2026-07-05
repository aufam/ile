export module ile:whisper;
import :std;
import :fs;

export namespace ile {
    class Whisper;
}

class ile::Whisper {
public:
    Whisper(const std::string &model);
    ~Whisper();

    std::string transcribe_file(const fs::path &);

private:
    void *ctx;
};
