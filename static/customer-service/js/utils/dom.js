export const elements = {
  // Inputs
  wsUrlInput: document.getElementById('ws-url'),
  branchInput: document.getElementById('branch-id'),
  counterInput: document.getElementById('counter-id'),
  clientInput: document.getElementById('client-id'),

  // Buttons
  btnConnect: document.getElementById('btn-connect'),
  btnPause: document.getElementById('btn-pause'),
  btnPauseText: document.getElementById('btn-pause-text'),
  btnSubmit: document.getElementById('btn-submit'),

  // Elements & Indicators
  transcriptElem: document.getElementById('live-transcript'),
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  canvas: document.getElementById('canvas-element'),
  logsContainer: document.getElementById('logs-container'),
  btnClearLogs: document.getElementById('btn-clear-logs'),

  // Visualizer Controls
  viewBars: document.getElementById('view-bars'),
  viewWave: document.getElementById('view-wave'),
  viewRadar: document.getElementById('view-radar'),
  statLatency: document.getElementById('stat-latency'),
  statPeaks: document.getElementById('stat-peaks'),

  // Modal References
  resultModal: document.getElementById('result-modal'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  modalTargetEndpoint: document.getElementById('modal-target-endpoint'),
  btnMockDemo: document.getElementById('btn-mock-demo'),

  // Modal Dynamic States
  stateProcessing: document.getElementById('state-processing'),
  stateError: document.getElementById('state-error'),
  stateSuccess: document.getElementById('state-success'),
  errorMessageText: document.getElementById('error-message-text'),
  resSummary: document.getElementById('res-summary'),
  resScore: document.getElementById('res-score'),
  resSpeech: document.getElementById('res-speech'),
  resSopTbody: document.getElementById('res-sop-tbody'),
  resStrengths: document.getElementById('res-strengths'),
  resImprovements: document.getElementById('res-improvements'),
};

export function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
