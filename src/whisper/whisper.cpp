module;

#include <whisper.h>
#include <miniaudio.h>

module ile;

std::vector<float> load_audio(const char *filename) {
    ma_decoder_config config = ma_decoder_config_init(
        ma_format_f32, // output format
        1,             // mono
        16000          // sample rate
    );

    ma_decoder decoder;
    if (ma_decoder_init_file(filename, &config, &decoder) != MA_SUCCESS) {
        throw std::runtime_error("Failed to open audio file");
    }

    ma_uint64 frameCount;
    if (ma_decoder_get_length_in_pcm_frames(&decoder, &frameCount) != MA_SUCCESS) {
        ma_decoder_uninit(&decoder);
        throw std::runtime_error("Failed to determine audio length");
    }

    std::vector<float> pcm(frameCount);

    ma_uint64 framesRead;
    ma_decoder_read_pcm_frames(&decoder, pcm.data(), frameCount, &framesRead);

    pcm.resize(framesRead);

    ma_decoder_uninit(&decoder);

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

std::string
ile::Whisper::transcribe_file(const std::string &path, const std::string &language, bool detect_language, bool translate) {
    auto ctx = static_cast<whisper_context *>(this->ctx);
    auto pcm = load_audio(path.c_str());

    whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    params.language            = language.c_str();
    params.detect_language     = detect_language;
    params.translate           = translate;

    if (whisper_full(ctx, params, pcm.data(), (int)pcm.size()) != 0)
        throw std::runtime_error("Transcription failed");

    std::string result;

    int n = whisper_full_n_segments(ctx);
    for (int i = 0; i < n; ++i)
        result += whisper_full_get_segment_text(ctx, i);

    return result;
}
