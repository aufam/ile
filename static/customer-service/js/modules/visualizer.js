import { elements } from '../utils/dom.js';

let activeViewMode = 'bars';
let isPausedRef = false;
let analyserRef = null;

const ctx = elements.canvas.getContext('2d');

function resizeCanvas() {
  elements.canvas.width = elements.canvas.clientWidth * window.devicePixelRatio;
  elements.canvas.height = elements.canvas.clientHeight * window.devicePixelRatio;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

export function initVisualizer(analyser, getIsPaused) {
  analyserRef = analyser;
  isPausedRef = getIsPaused;
}

export function setViewMode(mode) {
  activeViewMode = mode;
  elements.viewBars.classList.toggle('active', mode === 'bars');
  elements.viewWave.classList.toggle('active', mode === 'wave');
  elements.viewRadar.classList.toggle('active', mode === 'radar');
}

export function startVisualizerLoop() {
  function draw() {
    requestAnimationFrame(draw);
    if (!analyserRef) return;

    const isPaused = isPausedRef ? isPausedRef() : false;
    const bufferLength = analyserRef.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDomainArray = new Uint8Array(bufferLength);

    analyserRef.getByteFrequencyData(dataArray);
    analyserRef.getByteTimeDomainData(timeDomainArray);

    // RMS Peak calculation
    let rmsSum = 0;
    for (let i = 0; i < bufferLength; i++) {
      const normVal = (timeDomainArray[i] - 128) / 128;
      rmsSum += normVal * normVal;
    }
    const rms = Math.sqrt(rmsSum / bufferLength);
    const db = rms > 0 ? (20 * Math.log10(rms)).toFixed(2) : '-inf';
    elements.statPeaks.innerText = `RMS Peak: ${db} dB`;

    ctx.fillStyle = 'rgba(8, 12, 20, 0.25)';
    ctx.fillRect(0, 0, elements.canvas.width, elements.canvas.height);

    if (activeViewMode === 'bars') {
      const barWidth = (elements.canvas.width / bufferLength) * 1.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * elements.canvas.height * 0.8;
        const hue = (i / bufferLength) * 160 + 190;
        ctx.fillStyle = isPaused ? '#f59e0b' : `hsla(${hue}, 85%, 60%, 0.8)`;
        ctx.beginPath();
        ctx.roundRect(x, elements.canvas.height - barHeight, barWidth - 2, barHeight, [4, 4, 0, 0]);
        ctx.fill();
        x += barWidth;
      }
    } else if (activeViewMode === 'wave') {
      ctx.lineWidth = 3;
      ctx.strokeStyle = isPaused ? '#f59e0b' : '#6366f1';
      ctx.beginPath();
      const sliceWidth = elements.canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = timeDomainArray[i] / 128.0;
        const y = (v * elements.canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(elements.canvas.width, elements.canvas.height / 2);
      ctx.stroke();
    } else if (activeViewMode === 'radar') {
      const centerX = elements.canvas.width / 2;
      const centerY = elements.canvas.height / 2;
      const baseRadius = Math.min(elements.canvas.width, elements.canvas.height) * 0.22;

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
  draw();
}
