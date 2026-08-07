class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.chunkSize = 4800;
    this.buffer = null;
    this.offset = 0;

    this.port.onmessage = (e) => {
      const { sampleRate, chunkMs } = e.data;

      this.chunkSize = Math.round(sampleRate * chunkMs / 1000);
      this.buffer = new Int16Array(this.chunkSize);
      this.offset = 0;
    };
  }

  process(inputs) {
    if (!this.buffer)
      return true;

    const input = inputs[0];
    if (!input.length)
      return true;

    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      const s = Math.max(-1, Math.min(1, channel[i]));

      this.buffer[this.offset++] =
        s < 0 ? s * 32768 : s * 32767;

      if (this.offset === this.chunkSize) {
        const out = this.buffer.slice();

        this.port.postMessage(out.buffer, [out.buffer]);
        this.buffer = new Int16Array(this.chunkSize);
        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor("pcm-capture", PCMCaptureProcessor)
