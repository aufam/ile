module;

#include <fstream>
#include <filesystem>
#include <array>

module ile;

inline void write_u16(std::ostream &os, uint16_t v) {
    std::array<char, 2> b{
        static_cast<char>(v),
        static_cast<char>(v >> 8),
    };
    os.write(b.data(), b.size());
}

inline void write_u32(std::ostream &os, uint32_t v) {
    std::array<char, 4> b{
        static_cast<char>(v),
        static_cast<char>(v >> 8),
        static_cast<char>(v >> 16),
        static_cast<char>(v >> 24),
    };
    os.write(b.data(), b.size());
}


void write_wav(const std::string &path, unsigned sample_rate, std::string_view audio) {
    constexpr std::uint16_t channels        = 1;
    constexpr std::uint16_t bits_per_sample = 16;
    constexpr std::uint16_t block_align     = channels * bits_per_sample / 8;
    const std::uint32_t     byte_rate       = sample_rate * block_align;

    if (!std::filesystem::exists(path)) {
        std::ofstream os(path, std::ios::binary);
        if (!os)
            throw std::runtime_error("failed to create wav file");

        // RIFF header
        os.write("RIFF", 4);
        write_u32(os, 36 + static_cast<std::uint32_t>(audio.size()));
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
        write_u32(os, static_cast<std::uint32_t>(audio.size()));
        os.write(audio.data(), static_cast<std::streamsize>(audio.size()));

        if (!os)
            throw std::runtime_error("failed to write wav file");

        return;
    }

    auto file_size = std::filesystem::file_size(path);

    std::fstream fs(path, std::ios::binary | std::ios::in | std::ios::out);
    if (!fs)
        throw std::runtime_error("failed to open wav file");

    // Update RIFF chunk size.
    auto riff_size = static_cast<std::uint32_t>(file_size - 8 + audio.size());
    fs.seekp(4);
    write_u32(fs, riff_size);

    // Update data chunk size.
    auto data_size = static_cast<std::uint32_t>(file_size - 44 + audio.size());
    fs.seekp(40);
    write_u32(fs, data_size);

    // Append PCM data.
    fs.seekp(0, std::ios::end);
    fs.write(audio.data(), static_cast<std::streamsize>(audio.size()));

    if (!fs)
        throw std::runtime_error("failed to append wav data");
}
