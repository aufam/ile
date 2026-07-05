module;

#include <whisper.h>

module ile;

struct WavHeader {
    char     riff[4];
    uint32_t chunk_size;
    char     wave[4];

    char     fmt[4];
    uint32_t fmt_size;
    uint16_t audio_format;
    uint16_t channels;
    uint32_t sample_rate;
    uint32_t byte_rate;
    uint16_t block_align;
    uint16_t bits_per_sample;

    char     data[4];
    uint32_t data_size;
};

std::vector<float> load_wav(const fs::path &path) {
    std::ifstream file(path, std::ios::binary);
    if (!file)
        throw std::runtime_error("Cannot open WAV file");

    WavHeader header{};
    file.read(reinterpret_cast<char *>(&header), sizeof(header));

    if (std::memcmp(header.riff, "RIFF", 4) != 0 || std::memcmp(header.wave, "WAVE", 4) != 0)
        throw std::runtime_error("Not a WAV file");

    if (header.audio_format != 1)
        throw std::runtime_error("Only PCM WAV is supported");

    if (header.channels != 1)
        throw std::runtime_error("Only mono WAV is supported");

    if (header.sample_rate != 16000)
        throw std::runtime_error("Sample rate must be 16000 Hz");

    if (header.bits_per_sample != 16)
        throw std::runtime_error("Only 16-bit PCM is supported");

    size_t samples = header.data_size / sizeof(int16_t);

    std::vector<int16_t> pcm16(samples);
    file.read(reinterpret_cast<char *>(pcm16.data()), header.data_size);

    std::vector<float> pcm(samples);

    for (size_t i = 0; i < samples; ++i)
        pcm[i] = pcm16[i] / 32768.0f;

    return pcm;
}

ile::Whisper::Whisper(const std::string &model) {
    whisper_context_params cparams = whisper_context_default_params();

    whisper_context *ctx = whisper_init_from_file_with_params(model.c_str(), cparams);

    this->ctx = ctx;
}

ile::Whisper::~Whisper() {
    auto ctx = static_cast<whisper_context *>(this->ctx);
    whisper_free(ctx);
}

std::string ile::Whisper::transcribe_file(const fs::path &path) {
    auto ctx = static_cast<whisper_context *>(this->ctx);

    auto pcm = load_wav(path);

    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);

    if (whisper_full(ctx, params, pcm.data(), pcm.size()) != 0)
        throw std::runtime_error("Transcription failed");

    std::string result;

    int n = whisper_full_n_segments(ctx);
    for (int i = 0; i < n; ++i)
        result += whisper_full_get_segment_text(ctx, i);

    return result;
}
