// ==================== TAB SWITCHING ====================
function switchTab(tabId) {
  // Hide all tab content panels
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

  // Deactivate all desktop nav tabs
  document.querySelectorAll('.ile-nav-tab').forEach(el => el.classList.remove('active'));

  // Deactivate all mobile bottom nav items
  document.querySelectorAll('.ile-bottom-nav-item').forEach(el => el.classList.remove('active'));

  // Show the target tab
  document.getElementById(tabId).classList.remove('hidden');

  // Activate desktop nav tab button
  const activeBtn = document.getElementById(`tabBtn-${tabId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Activate mobile bottom nav button
  const activeBottomBtn = document.getElementById(`bottomTabBtn-${tabId}`);
  if (activeBottomBtn) activeBottomBtn.classList.add('active');

  if (tabId === 'customerReportTab') {
    renderCustomerPresentation();
  }
}

// ==================== LEGACY MOBILE MENU (DESKTOP FALLBACK) ====================
function toggleMobileNav() {
  const nav = document.getElementById('navTabs');
  if (nav) nav.classList.toggle('hidden');
}

// ==================== MOBILE SIDEBAR ====================
function openMobileSidebar() {
  const header = document.getElementById('mainHeader');
  const overlay = document.getElementById('sidebarOverlay');
  if (header) header.classList.add('sidebar-open');
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden'; // prevent background scroll
}

function closeMobileSidebar() {
  const header = document.getElementById('mainHeader');
  const overlay = document.getElementById('sidebarOverlay');
  if (header) header.classList.remove('sidebar-open');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';
}
