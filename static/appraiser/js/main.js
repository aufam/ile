// ==================== APP INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
  // Initialize appraiser authentication session
  if (typeof initAuthSession === 'function') {
    initAuthSession();
  }

  // Set default date display to today
  if (document.getElementById('stationDate')) {
    const today = new Date().toISOString().split('T')[0];
    const dEl = document.getElementById('stationDate');
    dEl.textContent = today;
    dEl.value = today;
  }

  // Render initial queue grid
  // renderQueueGrid();

  // Load initial active ticket into measurement station
  loadActiveTicket();

  // Initialize canvas for digital signature
  initSignatureCanvas();
});

window.addEventListener("beforeunload", disconnectStateWebSocket)
