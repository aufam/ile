export module ile:audio_chunk;
import :std;
import cpx;

export namespace ile {
    struct AudioChunk;
} // namespace ile

struct ile::AudioChunk {
    std::string_view branch, counter, client_id;
    unsigned         sample_rate, bits_per_sample;
    std::string_view pcm;

    static constexpr std::tuple __field_tags__ = {
        cpx::field<&AudioChunk::branch>          = "branch,field_number=1",
        cpx::field<&AudioChunk::counter>         = "counter,field_number=2",
        cpx::field<&AudioChunk::client_id>       = "client_id,field_number=3",
        cpx::field<&AudioChunk::sample_rate>     = "sample_rate,field_number=4",
        cpx::field<&AudioChunk::bits_per_sample> = "bits_per_sample,field_number=5",
        cpx::field<&AudioChunk::pcm>             = ",field_number=6",
    };

    cpx::Result<void> write_wav() const;

    std::vector<float> to_pcm_f32() const;
};
