~/emscripten/em++ \
	-Wl,--whole-archive \
	~/.carton/build/release-wasm/ile-wasm-v0.1.0/-/libile-wasm.a \
	~/.carton/build/release-wasm/whisper-v1.9.1/ggml/wasm/libwhisper.a \
	~/.carton/build/release-wasm/ggml-v0.15.3/wasm/libggml.a \
	~/.carton/build/release-wasm/miniaudio-0.11.25/-/libminiaudio.a \
	-Wl,--no-whole-archive \
	--bind -Wno-version-check \
	--preload-file models \
	-sMODULARIZE -sALLOW_MEMORY_GROWTH -sEXPORT_ES6 \
	-o ile-wasm.js
