// ==================== APPRAISER AUTHENTICATION & SESSION MANAGEMENT ====================

const APPRAISER_SESSION_KEY = 'ile_appraiser_session';

let currentAppraiser = {
  branch: 'Jakarta Barat',
  counter: 'Counter #01',
  name: 'Jane Doe (Appraiser)',
  date: new Date().toISOString().split('T')[0]
};

function initAuthSession() {
  const savedSession = localStorage.getItem(APPRAISER_SESSION_KEY);
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      if (parsed && parsed.name) {
        currentAppraiser = {
          ...parsed,
          date: new Date().toISOString().split('T')[0] // Always force date to today
        };
        applyAppraiserSession(false);
        showMainApp();
        return;
      }
    } catch (e) {
      console.warn('Failed to parse appraiser session:', e);
    }
  }

  // If no saved session, show login screen initially
  showLoginPage();
}

function handleAppraiserLogin(event) {
  if (event) event.preventDefault();

  const branch = document.getElementById('loginBranch').value;
  const counter = document.getElementById('loginCounter').value;
  const name = document.getElementById('loginAppraiserName').value.trim();
  const date = new Date().toISOString().split('T')[0]; // Date is automatically today
  const remember = document.getElementById('loginRemember') ? document.getElementById('loginRemember').checked : true;

  if (!name) {
    if (typeof showToast === 'function') {
      showToast('Please enter an appraiser name', 'error');
    }
    return;
  }

  currentAppraiser = {
    branch,
    counter,
    name,
    date
  };

  if (remember) {
    localStorage.setItem(APPRAISER_SESSION_KEY, JSON.stringify(currentAppraiser));
  } else {
    localStorage.removeItem(APPRAISER_SESSION_KEY);
  }

  applyAppraiserSession(true);
  showMainApp();
}

function applyAppraiserSession(notify = true) {
  // Sync station controls in header
  const setStationDisplay = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = val || '';
      el.value = val || '';
    }
  };

  setStationDisplay('stationBranch', currentAppraiser.branch);
  setStationDisplay('stationCounter', currentAppraiser.counter);
  setStationDisplay('stationStaff', currentAppraiser.name);
  setStationDisplay('stationDate', currentAppraiser.date);

  // Sync back to login form as well
  const lB = document.getElementById('loginBranch');
  const lC = document.getElementById('loginCounter');
  const lN = document.getElementById('loginAppraiserName');

  if (lB) lB.value = currentAppraiser.branch;
  if (lC) lC.value = currentAppraiser.counter;
  if (lN) lN.value = currentAppraiser.name;

  // Update active ticket station context if appropriate
  if (typeof updateStationContext === 'function') {
    updateStationContext();
  }

  if (notify && typeof showToast === 'function') {
    showToast(`Session active: ${currentAppraiser.name} (${currentAppraiser.counter} - ${currentAppraiser.branch})`);
  }
}

function showLoginPage() {
  const loginPage = document.getElementById('appraiserLoginPage');
  const mainHeader = document.getElementById('mainHeader');
  const mainContent = document.getElementById('mainContent');

  if (loginPage) loginPage.classList.remove('hidden');
  if (mainHeader) mainHeader.classList.add('hidden');
  if (mainContent) mainContent.classList.add('hidden');
}

function showMainApp() {
  const loginPage = document.getElementById('appraiserLoginPage');
  const mainHeader = document.getElementById('mainHeader');
  const mainContent = document.getElementById('mainContent');

  if (loginPage) loginPage.classList.add('hidden');
  if (mainHeader) mainHeader.classList.remove('hidden');
  if (mainContent) mainContent.classList.remove('hidden');
}

function handleAppraiserLogout() {
  localStorage.removeItem(APPRAISER_SESSION_KEY);
  showLoginPage();
  if (typeof showToast === 'function') {
    showToast('Appraiser logged out');
  }
}
