// ==================== APPRAISER AUTHENTICATION & SESSION MANAGEMENT ====================
function updateCounters() {
  const branchSelect = document.getElementById("loginBranch");
  const counterSelect = document.getElementById("loginCounter");
  const selectedOffice = branchSelect.value; counterSelect.innerHTML = "";
  if (!selectedOffice) {
    counterSelect.innerHTML = '<option value="" disabled selected>Select an office first</option>';
    return;
  }
  // The office data returned by /api/offices contains `counters`. 
  // // Example: ["Counter #1", "Counter #2", "Counter #3"] 
  const office = window.offices[selectedOffice];
  if (!office || !office.counters) {
    counterSelect.innerHTML = '<option value="" disabled selected>No counters available</option>';
    return;
  }

  for (const counter of office.counters) {
    const option = document.createElement("option");
    option.value = counter;
    option.textContent = counter;
    counterSelect.appendChild(option);
  }
}

document.getElementById("loginBranch").addEventListener("change", updateCounters);

async function initializeLoginForm() {
  try {
    const response = await fetch("/api/offices");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    window.offices = await response.json();
    const branchSelect = document.getElementById("loginBranch");
    branchSelect.innerHTML = "";
    for (const [id, office] of Object.entries(window.offices)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = office.name; branchSelect.appendChild(option);
    }
    updateCounters();
  } catch (error) {
    console.error("Failed to load offices:", error);
    document.getElementById("loginBranch").innerHTML = '<option value="" disabled selected>Failed to load offices</option>';
    document.getElementById("loginCounter").innerHTML = '<option value="" disabled selected>Unable to load counters</option>';
  }
}
initializeLoginForm();

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

  const select = document.querySelector('.preset-select');
  const pricelist = window.offices[branch].pricelist;

  select.innerHTML = '<option value="">Preset</option>';

  for (const item of pricelist) {
    const option = document.createElement('option');

    // `value` is the pricelist type.
    option.value = item.type;

    // Display the type and price.
    option.textContent =
      `${item.type} - Rp ${item.price.toLocaleString('id-ID')}`;

    select.appendChild(option);
  }

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

  connectStateWebSocket();
}

function handleAppraiserLogout() {
  localStorage.removeItem(APPRAISER_SESSION_KEY);
  disconnectStateWebSocket();
  showLoginPage();
  if (typeof showToast === 'function') {
    showToast('Appraiser logged out');
  }
}
