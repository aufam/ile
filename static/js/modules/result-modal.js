import { elements, escapeHtml } from '../utils/dom.js';

let pollTimer = null;

export function openResultModal() {
  elements.resultModal.hidden = false;
  fetchResultsData();
}

export function closeResultModal() {
  elements.resultModal.hidden = true;
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

export async function fetchResultsData() {
  const branch = elements.branchInput.value.trim() || 'Jakarta';
  const counter = elements.counterInput.value.trim() || 'A1';
  const clientId = elements.clientInput.value.trim() || '1234';

  const targetPath = `/results?branch=${encodeURIComponent(branch)}&counter=${encodeURIComponent(counter)}&clientId=${encodeURIComponent(clientId)}`;
  elements.modalTargetEndpoint.innerText = `GET ${targetPath}`;

  elements.stateProcessing.hidden = true;
  elements.stateError.hidden = true;
  elements.stateSuccess.hidden = true;

  try {
    const response = await fetch(targetPath);

    if (response.status === 202 || response.status === 102) {
      showProcessingState();
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

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
  elements.stateProcessing.hidden = false;
  if (!pollTimer) pollTimer = setInterval(fetchResultsData, 3000);
}

function showErrorState(msg) {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  elements.stateError.hidden = false;
  elements.errorMessageText.innerText = msg;
}

export function renderResultJSON(data) {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }

  elements.stateProcessing.hidden = true;
  elements.stateError.hidden = true;
  elements.stateSuccess.hidden = false;

  elements.resSummary.innerText = data.summary || "No evaluation summary provided.";
  elements.resScore.innerText = (data.score !== undefined) ? Number(data.score).toFixed(1) : "0.0";
  elements.resSpeech.innerText = data.refinedSpeech || "No refined transcript available.";

  // Render SOP Checklist Table
  elements.resSopTbody.innerHTML = '';
  if (Array.isArray(data.sopEvaluation)) {
    data.sopEvaluation.forEach(item => {
      const tr = document.createElement('tr');
      const statusText = item.status || 'unknown';
      let statusBadgeClass = statusText.toLowerCase() === 'pass' ? 'pass' : (statusText.toLowerCase() === 'fail' ? 'fail' : 'unknown');

      tr.innerHTML = `
        <td style="font-weight:600; color:#f1f5f9; min-width:170px;">${escapeHtml(item.sop)}</td>
        <td><span class="status-tag ${statusBadgeClass}">${escapeHtml(statusText)}</span></td>
        <td style="color:#cbd5e1; line-height:1.4;">${escapeHtml(item.reason)}</td>
      `;
      elements.resSopTbody.appendChild(tr);
    });
  }

  // Render Strengths
  elements.resStrengths.innerHTML = '';
  if (Array.isArray(data.strengths)) {
    data.strengths.forEach(str => {
      const div = document.createElement('div');
      div.className = 'list-item-card';
      div.innerHTML = `<span style="color:#34d399; font-weight:bold;">✓</span> <span>${escapeHtml(str)}</span>`;
      elements.resStrengths.appendChild(div);
    });
  }

  // Render Improvements
  elements.resImprovements.innerHTML = '';
  if (Array.isArray(data.improvements)) {
    data.improvements.forEach(imp => {
      const div = document.createElement('div');
      div.className = 'list-item-card';
      div.innerHTML = `<span style="color:#fbbf24; font-weight:bold;">⚡</span> <span>${escapeHtml(imp)}</span>`;
      elements.resImprovements.appendChild(div);
    });
  }
}

export function renderMockDemo() {
  const mockResult = {
    "refinedSpeech": "Selamat pagi, terima kasih telah menghubungi Customer Service ILE Jakarta...",
    "score": 8.8,
    "summary": "Customer Service menyampaikan salam pembuka standar dan mengonfirmasi nomor antrian dengan sopan.",
    "sopEvaluation": [
      { "sop": "Salam Pembuka & Identity Greeting", "status": "pass", "reason": "Petugas menyebutkan salam sesuai waktu..." },
      { "sop": "Konfirmasi Nomor Antrian Client", "status": "pass", "reason": "Nomor antrian 1234 terverifikasi..." },
      { "sop": "Penawaran Program Promo Cabang", "status": "fail", "reason": "Petugas belum menginformasikan program promo..." }
    ],
    "strengths": ["Intonasi suara sangat ramah dan profesional."],
    "improvements": ["Perlu meningkatkan inisiatif untuk menyampaikan penawaran promo terbaru."]
  };
  renderResultJSON(mockResult);
}
