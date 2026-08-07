import { elements } from './utils/dom.js';
import { log } from './utils/logger.js';
import { startVisualizerLoop, setViewMode } from './modules/visualizer.js';
import { connectAudioStream, togglePauseStream, stopAudioStream } from './modules/audio-streamer.js';
import { openResultModal, closeResultModal, renderMockDemo } from './modules/result-modal.js';

// Initialize Visualizer Rendering Loop
startVisualizerLoop();

// Visualizer View Switching Controls
elements.viewBars.onclick = () => setViewMode('bars');
elements.viewWave.onclick = () => setViewMode('wave');
elements.viewRadar.onclick = () => setViewMode('radar');

// Audio Action Buttons
elements.btnConnect.onclick = connectAudioStream;
elements.btnPause.onclick = togglePauseStream;

elements.btnSubmit.onclick = async () => {
  log('Terminating audio stream and opening SOP evaluation modal...', 'system');
  await stopAudioStream();
  openResultModal();
};

// Modal Trigger Controls
elements.btnCloseModal.onclick = closeResultModal;
elements.btnMockDemo.onclick = renderMockDemo;
elements.resultModal.onclick = (e) => {
  if (e.target === elements.resultModal) closeResultModal();
};
