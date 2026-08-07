// ==================== TAB SWITCHING ====================
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.ile-nav-tab').forEach(el => {
    el.classList.remove('active');
  });

  document.getElementById(tabId).classList.remove('hidden');
  const activeBtn = document.getElementById(`tabBtn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  if (tabId === 'customerReportTab') {
    renderCustomerPresentation();
  }
}

function toggleMobileNav() {
  const nav = document.getElementById('navTabs');
  if (nav) nav.classList.toggle('hidden');
}
