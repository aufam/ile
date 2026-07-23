module;

#include <array>
#include <fstream>
#include "../fs.h"

module ile;
import cpx;

inline void write_u16(std::ostream &os, unsigned short v) {
    std::array<char, 2> b{
        static_cast<char>(v),
        static_cast<char>(v >> 8),
    };
    os.write(b.data(), b.size());
}

inline void write_u32(std::ostream &os, unsigned int v) {
    std::array<char, 4> b{
        static_cast<char>(v),
        static_cast<char>(v >> 8),
        static_cast<char>(v >> 16),
        static_cast<char>(v >> 24),
    };
    os.write(b.data(), b.size());
}

auto ile::AudioChunk::write_wav() const -> cpx::Result<void> {
    constexpr unsigned short channels        = 1;
    constexpr unsigned short bits_per_sample = 16;
    constexpr unsigned short block_align     = channels * bits_per_sample / 8;
    const unsigned int       byte_rate       = sample_rate * block_align;

    const auto path = std::string(branch) + "-" + std::string(counter) + ".wav";

    if (!fs::exists(path)) {
        std::ofstream os(path, std::ios::binary);
        if (!os)
            return std::runtime_error("failed to create wav file");

        // RIFF header
        os.write("RIFF", 4);
        write_u32(os, 36 + static_cast<unsigned int>(pcm.size()));
        os.write("WAVE", 4);

        // fmt chunk
        os.write("fmt ", 4);
        write_u32(os, 16);
        write_u16(os, 1); // PCM
        write_u16(os, channels);
        write_u32(os, sample_rate);
        write_u32(os, byte_rate);
        write_u16(os, block_align);
        write_u16(os, bits_per_sample);

        // data chunk
        os.write("data", 4);
        write_u32(os, static_cast<unsigned int>(pcm.size()));
        os.write(pcm.data(), static_cast<std::streamsize>(pcm.size()));

        if (!os)
            return std::runtime_error("failed to write wav file");

        return {};
    }

    auto file_size = fs::file_size(path);

    std::fstream fs(path, std::ios::binary | std::ios::in | std::ios::out);
    if (!fs)
        return std::runtime_error("failed to open wav file");

    // Update RIFF chunk size.
    auto riff_size = static_cast<unsigned int>(file_size - 8 + pcm.size());
    fs.seekp(4);
    write_u32(fs, riff_size);

    // Update data chunk size.
    auto data_size = static_cast<unsigned int>(file_size - 44 + pcm.size());
    fs.seekp(40);
    write_u32(fs, data_size);

    // Append PCM data.
    fs.seekp(0, std::ios::end);
    fs.write(pcm.data(), static_cast<std::streamsize>(pcm.size()));

    if (!fs)
        return std::runtime_error("failed to append wav data");
    return {};
}
