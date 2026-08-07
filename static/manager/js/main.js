// ==================== MAIN INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', () => {
  if (typeof initManagerAuthSession === 'function') {
    initManagerAuthSession();
  }

  if (document.getElementById('managerDate')) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('managerDate').value = today;
  }

  renderDatabaseTable();
});
