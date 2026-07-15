module;

#include <miniaudio.h>

module ile;

auto ile::AudioChunk::to_pcm_f32() const -> std::vector<float> {
    const auto count = pcm.size() / 2;

    std::vector<float> output(count);

    ma_pcm_s16_to_f32(output.data(), pcm.data(), count, ma_dither_mode_none);

    return output;
}
