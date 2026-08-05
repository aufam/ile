import { elements } from '../utils/dom.js';
import { log, setEngineStatus } from '../utils/logger.js';
import { writeString, writeUInt32, writeVarint } from '../utils/protobuf.js';
import { initVisualizer } from './visualizer.js';

let ws = null;
let stream = null;
let audioContext = null;
let source = null;
let processor = null;
let analyser = null;
let isPaused = false;

const whisperWorker = new Worker("js/wasm/whisper-worker.js", {
  type: "module"
});

const workerReady = new Promise(resolve => {
  whisperWorker.onmessage = ({ data }) => {
    switch (data.type) {
      case "status":
        setEngineStatus("connecting", data.text);
        break;

      case "ready":
        setEngineStatus("connecting", "Whisper ready");
        resolve();
        break;

      case "result":
        workerBusy = false;

        if (data.text.trim()) {
          elements.transcriptElem.innerHTML =
            `<span style="color:#a5b4fc;font-weight:500;">${data.text}</span>`;

          chunks.length = 0;
        }

        break;
    }
  };
});

const WINDOW_SIZE = 5;
const RMS_THRESHOLD = 0.02;
const chunks = [];
let workerBusy = false;

function merge(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);

  const out = new Uint8Array(total);

  let offset = 0;

  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }

  return out;
}

function rms(samples) {
  let sum = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i] / 32768;
    sum += s * s;
  }

  return Math.sqrt(sum / samples.length);
}

export function getIsPaused() { return isPaused; }

export async function connectAudioStream() {
  let wsAddress = elements.wsUrlInput.value.trim();
  if (!wsAddress) {
    wsAddress = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/audio`;
  }

  log(`Opening WebSocket channel to [${wsAddress}]...`, 'net');
  setEngineStatus('connecting', 'Connecting...');

  try {
    await workerReady;

    ws = new WebSocket(wsAddress);
    ws.binaryType = "arraybuffer";

    // ws.onmessage = async (event) => {
    //   let text = typeof event.data === "string" ? event.data : await new Response(event.data).text();
    //   elements.transcriptElem.innerHTML = `<span style="color:#a5b4fc; font-weight:500;">${text}</span>`;
    // };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    log('WebSocket connected successfully.', 'success');
    setEngineStatus('connected', 'Live Streaming');

    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
    });

    audioContext = new AudioContext({ sampleRate: 44100 });
    await audioContext.audioWorklet.addModule("js/audio/pcm-worklet.js");

    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    // Initialize Canvas Visualizer with Analyser
    initVisualizer(analyser, getIsPaused);

    processor = new AudioWorkletNode(audioContext, "pcm-capture");
    processor.port.postMessage({ sampleRate: audioContext.sampleRate, chunkMs: 500 });

    processor.port.onmessage = ({ data }) => {
      if (isPaused || ws?.readyState !== WebSocket.OPEN) return;

      // protobuf
      const header = [];
      writeString(1, elements.branchInput.value.trim(), header);
      writeString(2, elements.counterInput.value.trim(), header);
      writeString(3, elements.clientInput.value.trim(), header);
      writeUInt32(4, audioContext.sampleRate, header);
      writeUInt32(5, 32, header);

      const pcm = new Uint8Array(data);
      header.push((6 << 3) | 2);
      writeVarint(pcm.byteLength, header);

      const packet = new Uint8Array(header.length + pcm.length);
      packet.set(header, 0);
      packet.set(pcm, header.length);

      ws.send(packet);
      elements.statLatency.innerText = `Outbound: ${pcm.byteLength} bytes`;

      // transcription
      chunks.push(pcm);

      if (chunks.length > WINDOW_SIZE)
        chunks.shift();

      if (chunks.length < WINDOW_SIZE)
        return;

      if (workerBusy)
        return;

      const merged = merge(chunks);

      const samples = new Int16Array(
        merged.buffer,
        merged.byteOffset,
        merged.byteLength / 2
      );

      if (rms(samples) < RMS_THRESHOLD)
        return;

      workerBusy = true;

      whisperWorker.postMessage(
        {
          type: "transcribe",
          pcm: merged
        },
        [merged.buffer]
      );
    };

    source.connect(processor);
    const gain = audioContext.createGain();
    gain.gain.value = 0;
    processor.connect(gain);
    gain.connect(audioContext.destination);

    isPaused = false;
    elements.btnPauseText.innerText = "Pause";
    elements.btnConnect.disabled = true;
    elements.btnPause.disabled = false;
    elements.btnSubmit.disabled = false;
    log('Microphone capture running.', 'success');

  } catch (err) {
    log(`Streaming failed: ${err.message}`, 'error');
    setEngineStatus('stopped', 'Engine Stopped');
    elements.btnConnect.disabled = false;
    elements.btnPause.disabled = true;
    elements.btnSubmit.disabled = true;
  }
}

export function togglePauseStream() {
  isPaused = !isPaused;
  if (isPaused) {
    elements.btnPauseText.innerText = "Resume";
    setEngineStatus('paused', 'Stream Paused');
    log('Audio transmission paused.', 'net');
  } else {
    elements.btnPauseText.innerText = "Pause";
    setEngineStatus('connected', 'Live Streaming');
    log('Audio transmission resumed.', 'success');
  }
}

export async function stopAudioStream() {
  if (processor) processor.disconnect();
  if (source) source.disconnect();
  if (stream) stream.getTracks().forEach(track => track.stop());
  if (audioContext) { await audioContext.close(); audioContext = null; }
  if (ws && ws.readyState === WebSocket.OPEN) { ws.close(); }

  setEngineStatus('stopped', 'Engine Stopped');
  elements.btnConnect.disabled = false;
  elements.btnPause.disabled = true;
  elements.btnSubmit.disabled = true;
  isPaused = false;
  elements.btnPauseText.innerText = "Pause";
}
