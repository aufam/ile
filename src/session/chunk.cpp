module;

#include "../boost.h"

module ile;
import fmt;
import cpx.protobuf;

asio::awaitable<void>
ile::Session::handle_chunk(std::shared_ptr<ws_stream> stream, beast::flat_buffer buffer, std::vector<float> &pcm_data) {
    auto _ = shared_from_this();

    std::string_view sv(static_cast<const char *>(buffer.data().data()), buffer.size());

    ile::AudioChunk chunk = {};
    try {
        cpx::protobuf::parse(sv, chunk);
    } catch (std::exception &e) {
        fmt::println(stderr, "{}:{}: parse error: {}", chunk.branch, chunk.counter, e.what());
        co_return;
    }

    auto res = chunk.write_wav();
    if (res.is_err()) {
        fmt::println(stderr, "{}:{}: write wav error: {}", chunk.branch, chunk.counter, res.error().what());
        co_return;
    }

    auto chunk_f32 = chunk.to_pcm_f32();

    pcm_data.resize(chunk_f32.size() * 5, 0);
    const size_t chunk_size = chunk_f32.size();

    // Move old samples to the front.
    std::memmove(pcm_data.data(), pcm_data.data() + chunk_size, (pcm_data.size() - chunk_size) * sizeof(float));

    // Append new samples at the end.
    std::memcpy(pcm_data.data() + pcm_data.size() - chunk_size, chunk_f32.data(), chunk_size * sizeof(float));

    std::string text = whisper.transcribe_pcm( //
        pcm_data.data(),
        (int)pcm_data.size(),
        args.language,
        args.detect_language,
        args.translate
    );

    if (!text.empty()) {
        fmt::println(stderr, "{}:{} {}", chunk.branch, chunk.counter, text);
        co_await stream->async_write(asio::buffer(text));
    }
}
