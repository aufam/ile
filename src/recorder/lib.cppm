module;

#include <string>

export module ile:recorder;

export namespace ile {
    struct Recorder;
} // namespace ile

struct ile::Recorder {
    std::string output_path;

    void record() const;
};
