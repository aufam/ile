// --- DOM REFERENCES ---
const wsUrlInput = document.getElementById('ws-url');
const branchInput = document.getElementById('branch-id');
const counterInput = document.getElementById('counter-id');
const clientInput = document.getElementById('client-id');

// Action Buttons
const btnConnect = document.getElementById('btn-connect');
const btnPause = document.getElementById('btn-pause');
const btnPauseText = document.getElementById('btn-pause-text');
const btnSubmit = document.getElementById('btn-submit');

// Elements
const transcriptElem = document.getElementById('live-transcript');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const canvas = document.getElementById('canvas-element');
const logsContainer = document.getElementById('logs-container');
const btnClearLogs = document.getElementById('btn-clear-logs');

// Visualizer Controls
const viewBars = document.getElementById('view-bars');
const viewWave = document.getElementById('view-wave');
const viewRadar = document.getElementById('view-radar');
const statLatency = document.getElementById('stat-latency');
const statPeaks = document.getElementById('stat-peaks');

// Modal References
const resultModal = document.getElementById('result-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalTargetEndpoint = document.getElementById('modal-target-endpoint');
const btnMockDemo = document.getElementById('btn-mock-demo');

// --- PIPELINE & APP STATE ---
let ws = null;
let stream = null;
let audioContext = null;
let source = null;
let processor = null;
let analyser = null;
let activeViewMode = 'bars';
let isPaused = false;
let pollTimer = null;

// Canvas Graphics Initialization
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Logger Helper
function log(message, type = 'system') {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('p');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
  logsContainer.appendChild(entry);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

btnClearLogs.onclick = () => { logsContainer.innerHTML = ''; log('Logs cleared.'); };

// Update Status Indicator Label
function setEngineStatus(state, msg) {
  statusText.innerText = msg;
  statusDot.className = 'status-dot ' + state;
}

// Audio Visualizer Loop
function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const timeDomainArray = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(dataArray);
  analyser.getByteTimeDomainData(timeDomainArray);

  let rmsSum = 0;
  for (let i = 0; i < bufferLength; i++) {
    const normVal = (timeDomainArray[i] - 128) / 128;
    rmsSum += normVal * normVal;
  }
  const rms = Math.sqrt(rmsSum / bufferLength);
  const db = rms > 0 ? (20 * Math.log10(rms)).toFixed(2) : '-inf';
  statPeaks.innerText = `RMS Peak: ${db} dB`;

  ctx.fillStyle = 'rgba(8, 12, 20, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (activeViewMode === 'bars') {
    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
      const hue = (i / bufferLength) * 160 + 190;
      ctx.fillStyle = isPaused ? '#f59e0b' : `hsla(${hue}, 85%, 60%, 0.8)`;
      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
      ctx.fill();
      x += barWidth;
    }
  } else if (activeViewMode === 'wave') {
    ctx.lineWidth = 3;
    ctx.strokeStyle = isPaused ? '#f59e0b' : '#6366f1';
    ctx.beginPath();
    const sliceWidth = canvas.width / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = timeDomainArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  } else if (activeViewMode === 'radar') {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.22;

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
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
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = isPaused ? '#f59e0b' : '#a855f7';
    ctx.stroke();
  }
}
drawVisualizer();

// Mode View Switchers
viewBars.onclick = () => { activeViewMode = 'bars'; viewBars.classList.add('active'); viewWave.classList.remove('active'); viewRadar.classList.remove('active'); };
viewWave.onclick = () => { activeViewMode = 'wave'; viewWave.classList.add('active'); viewBars.classList.remove('active'); viewRadar.classList.remove('active'); };
viewRadar.onclick = () => { activeViewMode = 'radar'; viewRadar.classList.add('active'); viewBars.classList.remove('active'); viewWave.classList.remove('active'); };

// --- AUDIO STREAMING CONTROLS ---
btnConnect.onclick = async () => {
  let wsAddress = wsUrlInput.value.trim();
  if (!wsAddress) {
    wsAddress = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/audio`;
  }

  log(`Opening WebSocket channel to [${wsAddress}]...`, 'net');
  setEngineStatus('connecting', 'Connecting...');

  try {
    ws = new WebSocket(wsAddress);
    ws.binaryType = "arraybuffer";

    ws.onmessage = async (event) => {
      let text = typeof event.data === "string" ? event.data : await new Response(event.data).text();
      transcriptElem.innerHTML = `<span style="color:#a5b4fc; font-weight:500;">${text}</span>`;
    };

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

    // Load external AudioWorklet module
    await audioContext.audioWorklet.addModule("pcm-worklet.js");

    source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    processor = new AudioWorkletNode(audioContext, "pcm-capture");
    processor.port.postMessage({ sampleRate: audioContext.sampleRate, chunkMs: 500 });

    // Handle chunked raw mono PCM bytes from worklet
    processor.port.onmessage = ({ data }) => {
      // Simply skip sending packet over WebSocket when paused
      if (isPaused) return;
      if (ws?.readyState !== WebSocket.OPEN) return;

      const branch = branchInput.value.trim();
      const counter = counterInput.value.trim();
      const clientId = clientInput.value.trim();

      const header = [];

      // Serialize Protobuf header payload variables
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

      // Send Protobuf serialized binary packet over WebSocket
      ws.send(packet);
      statLatency.innerText = `Outbound: ${pcm.byteLength} bytes`;
    };

    source.connect(processor);
    const gain = audioContext.createGain();
    gain.gain.value = 0;
    processor.connect(gain);
    gain.connect(audioContext.destination);

    isPaused = false;
    btnPauseText.innerText = "Pause";
    btnConnect.disabled = true;
    btnPause.disabled = false;
    btnSubmit.disabled = false;
    log('Microphone capture running.', 'success');

  } catch (err) {
    log(`Streaming failed: ${err.message}`, 'error');
    setEngineStatus('stopped', 'Engine Stopped');
    btnConnect.disabled = false;
    btnPause.disabled = true;
    btnSubmit.disabled = true;
  }
};

// Pause / Resume Toggle Logic
btnPause.onclick = () => {
  isPaused = !isPaused;
  if (isPaused) {
    btnPauseText.innerText = "Resume";
    setEngineStatus('paused', 'Stream Paused');
    log('Audio transmission paused.', 'net');
  } else {
    btnPauseText.innerText = "Pause";
    setEngineStatus('connected', 'Live Streaming');
    log('Audio transmission resumed.', 'success');
  }
};

// Submit Action Logic (Terminates audio and opens Popup Modal)
btnSubmit.onclick = async () => {
  log('Terminating audio stream and opening SOP evaluation modal...', 'system');

  // Stop media tracks and cleanup audio context
  if (processor) processor.disconnect();
  if (source) source.disconnect();
  if (stream) stream.getTracks().forEach(track => track.stop());
  if (audioContext) { await audioContext.close(); audioContext = null; }
  if (ws && ws.readyState === WebSocket.OPEN) { ws.close(); }

  setEngineStatus('stopped', 'Engine Stopped');
  btnConnect.disabled = false;
  btnPause.disabled = true;
  btnSubmit.disabled = true;
  isPaused = false;
  btnPauseText.innerText = "Pause";

  // Open Modal & Query Results
  openResultModal();
};

// --- POPUP MODAL HANDLERS & API POLLING ---
function openResultModal() {
  resultModal.hidden = false;
  fetchResultsData();
}

function closeResultModal() {
  resultModal.hidden = true;
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

btnCloseModal.onclick = closeResultModal;

// Close on backdrop overlay click
resultModal.onclick = (e) => {
  if (e.target === resultModal) closeResultModal();
};

// Fetch API Data from `GET /results?branch=...&counter=...&clientId=...`
async function fetchResultsData() {
  const branch = branchInput.value.trim() || 'Jakarta';
  const counter = counterInput.value.trim() || 'A1';
  const clientId = clientInput.value.trim() || '1234';

  const targetPath = `/results?branch=${encodeURIComponent(branch)}&counter=${encodeURIComponent(counter)}&clientId=${encodeURIComponent(clientId)}`;
  modalTargetEndpoint.innerText = `GET ${targetPath}`;

  document.getElementById('state-processing').hidden = true;
  document.getElementById('state-error').hidden = true;
  document.getElementById('state-success').hidden = true;

  try {
    const response = await fetch(targetPath);

    if (response.status === 202 || response.status === 102) {
      showProcessingState();
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === 'processing' || data.status === 'pending') {
      showProcessingState();
    } else {
      renderResultJSON(data);
    }

  } catch (err) {
    showErrorState(err.message + " (Backend endpoint unreachable). Click below to view demo evaluation format.");
  }
}

function showProcessingState() {
  document.getElementById('state-processing').hidden = false;
  if (!pollTimer) {
    pollTimer = setInterval(fetchResultsData, 3000);
  }
}

function showErrorState(msg) {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  document.getElementById('state-error').hidden = false;
  document.getElementById('error-message-text').innerText = msg;
}

function renderResultJSON(data) {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

  document.getElementById('state-processing').hidden = true;
  document.getElementById('state-error').hidden = true;
  document.getElementById('state-success').hidden = false;

  // Render Summary & Score
  document.getElementById('res-summary').innerText = data.summary || "No evaluation summary provided.";
  document.getElementById('res-score').innerText = (data.score !== undefined) ? Number(data.score).toFixed(1) : "0.0";

  // Render Speech Transcript
  document.getElementById('res-speech').innerText = data.refinedSpeech || "No refined transcript available.";

  // Render SOP Checklist Table
  const tbody = document.getElementById('res-sop-tbody');
  tbody.innerHTML = '';
  if (Array.isArray(data.sopEvaluation)) {
    data.sopEvaluation.forEach(item => {
      const tr = document.createElement('tr');

      let statusBadgeClass = 'unknown';
      let statusText = item.status || 'unknown';
      if (statusText.toLowerCase() === 'pass') statusBadgeClass = 'pass';
      else if (statusText.toLowerCase() === 'fail') statusBadgeClass = 'fail';

      tr.innerHTML = `
        <td style="font-weight:600; color:#f1f5f9; min-width:170px;">${escapeHtml(item.sop)}</td>
        <td><span class="status-tag ${statusBadgeClass}">${escapeHtml(statusText)}</span></td>
        <td style="color:#cbd5e1; line-height:1.4;">${escapeHtml(item.reason)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Strengths
  const strengthsContainer = document.getElementById('res-strengths');
  strengthsContainer.innerHTML = '';
  if (Array.isArray(data.strengths)) {
    data.strengths.forEach(str => {
      const div = document.createElement('div');
      div.className = 'list-item-card';
      div.innerHTML = `<span style="color:#34d399; font-weight:bold;">✓</span> <span>${escapeHtml(str)}</span>`;
      strengthsContainer.appendChild(div);
    });
  }

  // Render Improvements
  const improvementsContainer = document.getElementById('res-improvements');
  improvementsContainer.innerHTML = '';
  if (Array.isArray(data.improvements)) {
    data.improvements.forEach(imp => {
      const div = document.createElement('div');
      div.className = 'list-item-card';
      div.innerHTML = `<span style="color:#fbbf24; font-weight:bold;">⚡</span> <span>${escapeHtml(imp)}</span>`;
      improvementsContainer.appendChild(div);
    });
  }
}

// HTML Escaper Helper
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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

// Demo Mock Data Button Trigger
btnMockDemo.onclick = () => {
  const mockResult = {
    "refinedSpeech": "Selamat pagi, terima kasih telah menghubungi Customer Service ILE Jakarta. Nama saya Budi, ada yang bisa saya bantu terkait transaksi Bapak hari ini?",
    "score": 8.8,
    "summary": "Customer Service menyampaikan salam pembuka standar dan mengonfirmasi nomor antrian dengan sopan. Verifikasi data identitas telah terpenuhi dengan baik.",
    "sopEvaluation": [
      {
        "sop": "Salam Pembuka & Identity Greeting",
        "status": "pass",
        "reason": "Petugas menyebutkan salam sesuai waktu, nama cabang, dan nama diri secara jelas."
      },
      {
        "sop": "Konfirmasi Nomor Antrian Client",
        "status": "pass",
        "reason": "Nomor antrian 1234 terverifikasi sesuai dengan sistem."
      },
      {
        "sop": "Penawaran Program Promo Cabang",
        "status": "fail",
        "reason": "Petugas belum menginformasikan program promo e-wallet yang berlaku bulan ini."
      },
      {
        "sop": "Penutup & Ucapan Terima Kasih",
        "status": "pass",
        "reason": "Mengucapkan salam penutup standar dan mendoakan kesehatan nasabah."
      }
    ],
    "strengths": [
      "Intonasi suara sangat ramah dan profesional.",
      "Mendengarkan keluhan pelanggan tanpa memotong pembicaraan."
    ],
    "improvements": [
      "Perlu meningkatkan inisiatif untuk menyampaikan penawaran promo terbaru.",
      "Memastikan jeda waktu konfirmasi data sistem tidak terlalu lama."
    ]
  };

  renderResultJSON(mockResult);
}
