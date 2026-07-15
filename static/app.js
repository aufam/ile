// --- DOM HANDLES ---
const wsUrlInput = document.getElementById('ws-url');
const branchInput = document.getElementById('branch-id');
const counterInput = document.getElementById('counter-id');
const clientInput = document.getElementById('client-id');
const sampleRateSelect = document.getElementById('sample-rate');
const fftSizeSelect = document.getElementById('fft-size');
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const transcriptElem = document.getElementById('live-transcript');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const canvas = document.getElementById('canvas-element');
const logsContainer = document.getElementById('logs-container');
const btnClearLogs = document.getElementById('btn-clear-logs');
const viewBars = document.getElementById('view-bars');
const viewWave = document.getElementById('view-wave');
const viewRadar = document.getElementById('view-radar');
const statLatency = document.getElementById('stat-latency');
const statPeaks = document.getElementById('stat-peaks');

// --- PIPELINE STATE VARIABLES ---
let ws = null;
let stream = null;
let audioContext = null;
let source = null;
let processor = null;
let analyser = null;
let activeViewMode = 'bars'; // 'bars' | 'wave' | 'radar'

// Set up Canvas Graphics Context
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- TELEMETRY LOGGER ---
function log(message, type = 'system') {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('p');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
  logsContainer.appendChild(entry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

btnClearLogs.addEventListener('click', () => {
  logsContainer.innerHTML = '';
  log('Logs cleared.', 'system');
});

// --- TELEMETRY DIAGNOSTICS VIEW SWITCHERS ---
function setViewMode(mode) {
  activeViewMode = mode;
  [viewBars, viewWave, viewRadar].forEach(btn => {
    btn.classList.remove('active');
  });

  if (mode === 'bars') {
    viewBars.classList.add('active');
  } else if (mode === 'wave') {
    viewWave.classList.add('active');
  } else if (mode === 'radar') {
    viewRadar.classList.add('active');
  }
  log(`Switched view to ${mode.toUpperCase()} graph`, 'system');
}

viewBars.addEventListener('click', () => setViewMode('bars'));
viewWave.addEventListener('click', () => setViewMode('wave'));
viewRadar.addEventListener('click', () => setViewMode('radar'));

// --- ENGINE STATUS LABELS ---
function setEngineStatus(state, msg) {
  statusText.innerText = msg;
  statusDot.className = 'status-dot'; // Reset classes

  if (state === 'stopped') {
    statusDot.classList.add('stopped');
  } else if (state === 'connecting') {
    statusDot.classList.add('connecting');
  } else if (state === 'connected') {
    statusDot.classList.add('connected');
  }
}

// --- RENDERING ANIMATION LOOP (Captures Outgoing Microphone Stream) ---
function draw() {
  requestAnimationFrame(draw);
  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const timeDomainArray = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(dataArray);
  analyser.getByteTimeDomainData(timeDomainArray);

  // Dynamic RMS calculation of outgoing vocal audio
  let rmsSum = 0;
  for (let i = 0; i < bufferLength; i++) {
    const normVal = (timeDomainArray[i] - 128) / 128;
    rmsSum += normVal * normVal;
  }
  const rms = Math.sqrt(rmsSum / bufferLength);
  const db = rms > 0 ? (20 * Math.log10(rms)).toFixed(2) : '-inf';
  statPeaks.innerText = `RMS Peak: ${db} dB`;

  // Visual trails and refresh style
  ctx.fillStyle = 'rgba(8, 12, 20, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (activeViewMode === 'bars') {
    const barWidth = (canvas.width / bufferLength) * 1.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      const hue = (i / bufferLength) * 160 + 190; // deep blue to pink spectrum transition
      ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.8)`;

      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      x += barWidth;
    }
  } else if (activeViewMode === 'wave') {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6366f1';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = timeDomainArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Decorative horizontal baseline
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  } else if (activeViewMode === 'radar') {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.2;

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * Math.PI * 2;
      const val = dataArray[i] / 255;
      const r = baseRadius + (val * baseRadius * 1.5);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      const hue = (i / bufferLength) * 360;
      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.8)`;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
}

// Start continuous render framework
draw();

// --- START CAPTURE & STREAM TRANSMISSION TRIGGER ---
btnConnect.onclick = async () => {
  // const wsAddress = wsUrlInput.value.trim();
  const wsAddress = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/audio`;
  const branch = branchInput.value.trim();
  const counter = counterInput.value.trim();
  const clientId = clientInput.value.trim();

  log(`Opening outbound WebSocket channel to [${wsAddress}]...`, 'net');
  setEngineStatus('connecting', 'Connecting...');

  try {
    ws = new WebSocket(wsAddress);
    ws.binaryType = "arraybuffer";

    // Listen for returned transcript strings/blobs from server
    ws.onmessage = async (event) => {
      if (!transcriptElem) return;

      let text = "";
      if (typeof event.data === "string") {
        text = event.data;
      } else if (event.data instanceof ArrayBuffer) {
        text = new TextDecoder().decode(event.data);
      } else if (event.data instanceof Blob) {
        text = await event.data.text();
      }

      transcriptElem.innerHTML = `<span class="text-indigo-300 font-medium">${text}</span>`;
      transcriptElem.scrollTop = transcriptElem.scrollHeight;
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    log('WebSocket connection successfully opened.', 'success');
    setEngineStatus('connected', 'Live Outgoing Stream');

    // Request user microphone
    log('Requesting local microphone user permission...', 'system');
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
      },
    });
    log('Microphone access approved.', 'success');

    const targetSampleRate = parseInt(sampleRateSelect.value);
    audioContext = new AudioContext({
      sampleRate: targetSampleRate,
      latencyHint: "interactive",
    });

    // Initialize Worklet Audio Process
    log('Registering audio capture worklet pipeline...', 'system');
    await audioContext.audioWorklet.addModule("pcm-worklet.js");

    source = audioContext.createMediaStreamSource(stream);

    // Mount the standard visualizer analyzer to voice node
    analyser = audioContext.createAnalyser();
    analyser.fftSize = parseInt(fftSizeSelect.value);
    source.connect(analyser);

    processor = new AudioWorkletNode(audioContext, "pcm-capture");

    // Send parameters setup to capture worklet
    processor.port.postMessage({
      sampleRate: audioContext.sampleRate,
      chunkMs: 500,
    });

    // Receive chunked raw mono PCM bytes from capture worklet
    processor.port.onmessage = ({ data }) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const header = [];

      // Serialize header payload variables following specified varint format exactly
      writeString(1, branch, header);
      writeString(2, counter, header);
      writeString(3, clientId, header);
      writeUInt32(4, audioContext.sampleRate, header);
      writeUInt32(5, 32, header);

      const pcm = new Uint8Array(data);

      header.push((6 << 3) | 2);
      writeVarint(pcm.byteLength, header);

      // Merge header and body payload arrays
      const packet = new Uint8Array(header.length + pcm.length);
      packet.set(header, 0);
      packet.set(pcm, header.length);

      // Send packet via WS
      ws.send(packet);

      statLatency.innerText = `Outbound: ${pcm.byteLength} bytes`;
    };

    source.connect(processor);

    // Routing to standard output with volume muted (0 gain) to avoid audio feedback
    const gain = audioContext.createGain();
    gain.gain.value = 0;

    processor.connect(gain);
    gain.connect(audioContext.destination);

    btnConnect.disabled = true;
    btnDisconnect.disabled = false;
    log('Stream session fully active and sending.', 'success');

  } catch (err) {
    log(`Streaming setup failed: ${err.message}`, 'error');
    setEngineStatus('stopped', 'Engine Stopped');
    btnConnect.disabled = false;
    btnDisconnect.disabled = true;
  }
};

// --- STOP RECORDING PIPELINE TRIGGER ---
btnDisconnect.onclick = async () => {
  log('Terminating microphone stream and pipeline...', 'system');

  processor?.disconnect();
  source?.disconnect();

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  if (audioContext) {
    await audioContext.close();
    audioContext = null;
  }

  if (ws?.readyState === WebSocket.OPEN) {
    ws.close();
  }

  analyser = null;
  btnConnect.disabled = false;
  btnDisconnect.disabled = true;
  setEngineStatus('stopped', 'Engine Stopped');
  statLatency.innerText = `Captured: 0 ms`;
  log('Stream cleanly completed.', 'system');
};

// --- MULTI-FORMAT VARINT SERIALIZATION HELPERS ---
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

// FFT select listener
fftSizeSelect.addEventListener('change', () => {
  const nextFFT = parseInt(fftSizeSelect.value);
  log(`Adjusting FFT window width resolution size to: ${nextFFT}`, 'system');
  if (analyser) {
    analyser.fftSize = nextFFT;
  }
});
