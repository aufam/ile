import { elements } from './dom.js';

export function log(message, type = 'system') {
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('p');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
  elements.logsContainer.appendChild(entry);
  elements.logsContainer.scrollTop = elements.logsContainer.scrollHeight;
}

export function setEngineStatus(state, msg) {
  elements.statusText.innerText = msg;
  elements.statusDot.className = 'status-dot ' + state;
}

elements.btnClearLogs.onclick = () => {
  elements.logsContainer.innerHTML = '';
  log('Logs cleared.');
};
