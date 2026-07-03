export module ile:wav;
import :std;

export void write_wav(const std::string &path, unsigned sample_rate, std::string_view audio);
