module;

#include <miniaudio.h>
#include <vector>
#include <stdexcept>
#include <iostream>

module ile;

void record_wav(const char *outputFile) {
    struct CaptureData {
        std::vector<short> samples;
    } capture;

    ma_context context;
    if (ma_context_init(nullptr, 0, nullptr, &context) != MA_SUCCESS) {
        throw std::runtime_error("ma_context_init failed");
    }

    ma_device_config config = ma_device_config_init(ma_device_type_capture);

    config.capture.format   = ma_format_s16;
    config.capture.channels = 1;
    config.sampleRate       = 16000;

    config.pUserData    = &capture;
    config.dataCallback = [](ma_device *device, void *, const void *input, ma_uint32 frameCount) {
        if (input == nullptr)
            return;

        auto *data = static_cast<CaptureData *>(device->pUserData);
        auto *pcm  = static_cast<const short *>(input);

        data->samples.insert(data->samples.end(), pcm, pcm + frameCount);
    };

    ma_device device;
    if (ma_device_init(&context, &config, &device) != MA_SUCCESS) {
        ma_context_uninit(&context);
        throw std::runtime_error("ma_device_init failed");
    }

    if (ma_device_start(&device) != MA_SUCCESS) {
        ma_device_uninit(&device);
        ma_context_uninit(&context);
        throw std::runtime_error("ma_device_start failed");
    }

    std::cout << "Recording... Press Enter to stop.\n";
    std::cin.get();

    ma_device_stop(&device);

    ma_encoder_config encoderConfig = ma_encoder_config_init(ma_encoding_format_wav, ma_format_s16, 1, 16000);

    ma_encoder encoder;
    if (ma_encoder_init_file(outputFile, &encoderConfig, &encoder) != MA_SUCCESS) {
        ma_device_uninit(&device);
        ma_context_uninit(&context);
        throw std::runtime_error("ma_encoder_init_file failed");
    }

    ma_uint64 written;
    ma_encoder_write_pcm_frames(&encoder, capture.samples.data(), capture.samples.size(), &written);

    ma_encoder_uninit(&encoder);
    ma_device_uninit(&device);
    ma_context_uninit(&context);
}

void ile::Cli::Record::record() const {
    record_wav(output_path.c_str());
}
