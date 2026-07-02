const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");

let ws;
let stream;
let audioContext;
let source;
let processor;

const branch = "Jakarta";
const counter = "A1";
const clientId = "1234";

startBtn.onclick = async () => {
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/audio`);
  ws.binaryType = "arraybuffer";

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false,
    },
  });

  audioContext = new AudioContext({
    latencyHint: "interactive",
  });

  await audioContext.audioWorklet.addModule("pcm-worklet.js");

  source = audioContext.createMediaStreamSource(stream);

  processor = new AudioWorkletNode(audioContext, "pcm-capture");

  // Configure the worklet
  processor.port.postMessage({
    sampleRate: audioContext.sampleRate,
    chunkMs: 500,
  });

  // Receive 500 ms PCM16 chunks
  processor.port.onmessage = ({ data }) => {
    if (ws.readyState !== WebSocket.OPEN)
      return;

    const header = [];

    writeString(1, branch, header);
    writeString(2, counter, header);
    writeString(3, clientId, header);
    writeUInt32(4, audioContext.sampleRate, header);
    writeUInt32(5, 32, header);

    const pcm = new Uint8Array(data);

    header.push((6 << 3) | 2);
    writeVarint(pcm.byteLength, header);

    const packet = new Uint8Array(header.length + pcm.length);
    packet.set(header, 0);
    packet.set(pcm, header.length);

    ws.send(packet);
  };

  source.connect(processor);

  // Keep the processor alive (don't connect to destination if you don't
  // want to hear yourself)
  const gain = audioContext.createGain();
  gain.gain.value = 0;

  processor.connect(gain);
  gain.connect(audioContext.destination);

  startBtn.disabled = true;
  stopBtn.disabled = false;
};

stopBtn.onclick = async () => {
  processor?.disconnect();
  source?.disconnect();

  stream?.getTracks().forEach(track => track.stop());

  await audioContext?.close();

  if (ws?.readyState === WebSocket.OPEN)
    ws.close();

  startBtn.disabled = false;
  stopBtn.disabled = true;
};

function writeVarint(v, out) {
  while (v > 127) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

function writeString(field, str, out) {
  const bytes = new TextEncoder().encode(str);
  out.push((field << 3) | 2);
  writeVarint(bytes.length, out);
  out.push(...bytes);
}

function writeBytes(field, bytes, out) {
  out.push((field << 3) | 2);
  writeVarint(bytes.length, out);
  out.push(...bytes);
}

function writeUInt32(field, value, out) {
  out.push((field << 3) | 0);
  writeVarint(value, out);
}
