// ==================== BRANCH MANAGER AUTHENTICATION ====================
function initManagerAuthSession() {
  const savedSession = localStorage.getItem(MANAGER_SESSION_KEY);
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      if (parsed && parsed.branch) {
        currentManagerSession = {
          ...parsed,
          date: new Date().toISOString().split('T')[0]
        };
        applyManagerSession(false);
        showMainApp();
        return;
      }
    } catch (e) {
      console.warn('Failed to parse manager session:', e);
    }
  }

  showLoginPage();
}

function handleManagerLogin(event) {
  if (event) event.preventDefault();

  const branchSelect = document.getElementById('loginBranch');
  const customBranchInput = document.getElementById('loginCustomBranch');
  
  let branch = branchSelect ? branchSelect.value : 'Jakarta Barat';
  if (branch === 'OTHER' && customBranchInput && customBranchInput.value.trim()) {
    branch = customBranchInput.value.trim();
  }

  const remember = document.getElementById('loginRemember') ? document.getElementById('loginRemember').checked : true;

  currentManagerSession = {
    branch: branch,
    date: new Date().toISOString().split('T')[0]
  };

  if (remember) {
    localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify(currentManagerSession));
  } else {
    localStorage.removeItem(MANAGER_SESSION_KEY);
  }

  applyManagerSession(true);
  showMainApp();
}

function applyManagerSession(notify = true) {
  const branchDisplay = document.getElementById('managerBranch');
  const dateDisplay = document.getElementById('managerDate');

  if (branchDisplay) {
    branchDisplay.textContent = currentManagerSession.branch;
    branchDisplay.value = currentManagerSession.branch;
  }
  if (dateDisplay) {
    dateDisplay.value = currentManagerSession.date;
  }

  const loginBranch = document.getElementById('loginBranch');
  if (loginBranch) loginBranch.value = currentManagerSession.branch;

  if (typeof renderDatabaseTable === 'function') {
    renderDatabaseTable();
  }

  if (notify && typeof showToast === 'function') {
    showToast(`Branch Manager Session Active: ${currentManagerSession.branch}`);
  }
}

function handleDateChange(newDate) {
  if (!newDate) return;
  currentManagerSession.date = newDate;

  // Persist date in saved session if one exists
  const savedSession = localStorage.getItem(MANAGER_SESSION_KEY);
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      if (parsed && parsed.branch) {
        localStorage.setItem(MANAGER_SESSION_KEY, JSON.stringify({ ...parsed, date: newDate }));
      }
    } catch (e) { /* ignore */ }
  }

  if (typeof renderDatabaseTable === 'function') {
    renderDatabaseTable();
  }
  if (typeof showToast === 'function') {
    showToast(`Session date switched to ${newDate}`);
  }
}

function showLoginPage() {
  const loginPage = document.getElementById('managerLoginPage');
  const mainHeader = document.getElementById('mainHeader');
  const mainContent = document.getElementById('mainContent');

  if (loginPage) loginPage.classList.remove('hidden');
  if (mainHeader) mainHeader.classList.add('hidden');
  if (mainContent) mainContent.classList.add('hidden');
}

function showMainApp() {
  const loginPage = document.getElementById('managerLoginPage');
  const mainHeader = document.getElementById('mainHeader');
  const mainContent = document.getElementById('mainContent');

  if (loginPage) loginPage.classList.add('hidden');
  if (mainHeader) mainHeader.classList.remove('hidden');
  if (mainContent) mainContent.classList.remove('hidden');
}

function handleManagerLogout() {
  localStorage.removeItem(MANAGER_SESSION_KEY);
  showLoginPage();
  if (typeof showToast === 'function') {
    showToast('Branch Manager logged out');
  }
}
