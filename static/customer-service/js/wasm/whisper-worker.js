import Module from "./ile-wasm.js";

let whisper = null;

(async () => {
  postMessage({
    type: "status",
    text: "Loading WebAssembly..."
  });

  const wasm = await Module({
    monitorRunDependencies(left) {
      postMessage({
        type: "status",
        text: `Loading assets (${left} remaining)...`
      });
    }
  });

  postMessage({
    type: "status",
    text: "Loading Whisper model..."
  });

  whisper = wasm.Whisper.Load("models/ggml-base.bin");

  postMessage({
    type: "ready"
  });
})();

onmessage = ({ data }) => {
  switch (data.type) {
    case "transcribe": {
      const text = whisper.transcribe(data.pcm);

      postMessage({
        type: "result",
        text
      });

      break;
    }

    case "unload":
      if (whisper) {
        whisper.unload();
        whisper = null;
      }

      close(); // terminate the worker
      break;
  }
};
