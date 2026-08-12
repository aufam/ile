// ==================== DIGITAL SIGNATURE CANVAS ====================
let sigCanvas, sigCtx, isSigning = false;

function initSignatureCanvas() {
  sigCanvas = document.getElementById('signatureCanvas');
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext('2d');

  sigCtx.strokeStyle = "#fbbf24";
  sigCtx.lineWidth = 3;
  sigCtx.lineCap = "round";

  sigCanvas.addEventListener('mousedown', startSig);
  sigCanvas.addEventListener('mousemove', drawSig);
  sigCanvas.addEventListener('mouseup', stopSig);

  sigCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startSig(e.touches[0]); });
  sigCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); drawSig(e.touches[0]); });
  sigCanvas.addEventListener('touchend', stopSig);
}

function startSig(e) {
  isSigning = true;
  const rect = sigCanvas.getBoundingClientRect();
  sigCtx.beginPath();
  sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function drawSig(e) {
  if (!isSigning) return;
  const rect = sigCanvas.getBoundingClientRect();
  sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  sigCtx.stroke();
}

function stopSig() {
  isSigning = false;
}

function clearSignatureCanvas() {
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
}

function openSignatureModal() {
  document.getElementById('signatureModal').classList.remove('hidden');
  clearSignatureCanvas();
}

function closeSignatureModal() {
  document.getElementById('signatureModal').classList.add('hidden');
}

function saveSignature() {
  const ticket = getActiveTicket();
  if (ticket) {
    ticket.signature = sigCanvas.toDataURL();
    ticket.status = "Completed";
    renderCustomerPresentation();
    renderQueueGrid();
    showToast("Customer signature saved! Valuation trade completed.");
  }
  closeSignatureModal();
}
