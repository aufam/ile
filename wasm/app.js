import Module from "./ile-wasm.js"

const m = await Module();

const whisper = m.Whisper.Load("models/ggml-base.bin");
whisper.unload();
