#include <emscripten/bind.h>
#include <whisper.h>
#include <miniaudio.h>

class Whisper {
    Whisper() = default;

    whisper_context    *ctx    = nullptr;
    whisper_full_params params = {};

public:
    static Whisper Load(std::string model);

    std::string transcribe(emscripten::val pcm);

    void unload();
};

EMSCRIPTEN_BINDINGS(whisper) {
    emscripten::class_<Whisper>("Whisper") //
        .class_function("Load", &Whisper::Load)
        .function("transcribe", &Whisper::transcribe)
        .function("unload", &Whisper::unload);
}

Whisper Whisper::Load(std::string model) {
    whisper_context_params cparams = whisper_context_default_params();

    Whisper w;

    w.ctx = whisper_init_from_file_with_params(model.c_str(), cparams);
    if (!w.ctx)
        throw std::runtime_error("Failed to load model");

    w.params                 = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    w.params.language        = "id";
    w.params.detect_language = false;
    w.params.translate       = false;

    return w;
}

std::string Whisper::transcribe(emscripten::val pcm) {
    const size_t size         = pcm["length"].as<size_t>();
    const size_t sample_count = size / sizeof(int16_t);

    std::vector<int16_t> pcm16(sample_count);

    emscripten::val view = emscripten::val(emscripten::typed_memory_view(size, pcm16.data()));
    view.call<void>("set", pcm);

    std::vector<float> pcm32(sample_count);
    ma_pcm_s16_to_f32(pcm32.data(), pcm16.data(), sample_count, ma_dither_mode_none);

    if (whisper_full(ctx, params, pcm32.data(), (int)pcm32.size()) != 0)
        throw std::runtime_error("Transcription failed");

    std::string result;

    int n = whisper_full_n_segments(ctx);
    for (int i = 0; i < n; ++i)
        result += whisper_full_get_segment_text(ctx, i);

    return result;
}

void Whisper::unload() {
    if (ctx)
        whisper_free(ctx);
}
