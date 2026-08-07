// ==================== MANAGER DATABASE TABLE & PAYLOAD INSPECTOR ====================
let currentDbStatusFilter = 'ALL';
let currentDbSearchQuery = '';

function renderDatabaseTable() {
  const tbody = document.getElementById('databaseTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const activeBranch = currentManagerSession ? currentManagerSession.branch : 'Jakarta Barat';

  // Filter tickets by branch (or all), status, and search query
  let filtered = managerTicketsData.filter(ticket => {
    const matchesBranch = activeBranch === 'ALL' || ticket.branch === activeBranch;
    const matchesStatus = currentDbStatusFilter === 'ALL' || ticket.status === currentDbStatusFilter;
    const matchesSearch = !currentDbSearchQuery || 
      ticket.customer_name.toLowerCase().includes(currentDbSearchQuery.toLowerCase()) ||
      ticket.customer_queue_number.toLowerCase().includes(currentDbSearchQuery.toLowerCase()) ||
      ticket.staff_name.toLowerCase().includes(currentDbSearchQuery.toLowerCase());
    return matchesBranch && matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-4 text-slate-400">
          <i class="fa-solid fa-folder-open mb-1" style="font-size: 1.5rem; display:block;"></i>
          No appraisal records found for branch "${activeBranch}" matching criteria.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(ticket => {
    const totalValue = ticket.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const statusBadgeClass = getStatusChipClass(ticket.status);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="queue-no font-bold">${ticket.customer_queue_number}</td>
      <td class="customer font-semibold">${ticket.customer_name}</td>
      <td class="branch-counter">${ticket.branch} <span class="text-xs text-amber-400">(${ticket.counter})</span></td>
      <td class="staff">${ticket.staff_name}</td>
      <td>${ticket.date}</td>
      <td>${ticket.items.length} pcs</td>
      <td class="total-value font-mono text-amber-300 font-bold">${formatRupiah(totalValue)}</td>
      <td>
        <span class="status-chip ${statusBadgeClass}">${ticket.status}</span>
      </td>
      <td class="actions">
        <div class="db-action-btn-group">
          <button onclick="openManageStatusModal('${ticket.id}')" class="db-btn btn-slate" title="Manage Status & Notes">
            <i class="fa-solid fa-list-check"></i> Status
          </button>
          <button onclick="viewCertificateFromDb('${ticket.id}')" class="db-btn btn-amber" title="View & Print Certificate">
            <i class="fa-solid fa-file-certificate"></i> Certificate
          </button>
          <button onclick="inspectTicketJson('${ticket.id}')" class="db-btn btn-emerald" title="Inspect C++ Payload">
            <i class="fa-solid fa-code"></i> Struct
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateJsonInspector();
}

function getStatusChipClass(status) {
  switch (status) {
    case 'Approved': return 'chip-emerald';
    case 'Completed': return 'chip-cyan';
    case 'In Measurement': return 'chip-amber';
    case 'Rejected': return 'chip-rose';
    default: return 'chip-slate';
  }
}

function filterDatabaseByStatus(status) {
  currentDbStatusFilter = status;
  renderDatabaseTable();
}

function handleDatabaseSearch(query) {
  currentDbSearchQuery = query;
  renderDatabaseTable();
}

function viewCertificateFromDb(ticketId) {
  activeTicketId = ticketId;
  switchTab('customerReportTab');
  renderCustomerPresentation();
}

function inspectTicketJson(ticketId) {
  activeTicketId = ticketId;
  updateJsonInspector();
  showToast(`Inspecting ticket ${ticketId} payload`);
}

function updateJsonInspector() {
  const ticket = getActiveTicket();
  if (!ticket) return;

  const payload = {
    branch: ticket.branch,
    counter: ticket.counter,
    staff_name: ticket.staff_name,
    customer_name: ticket.customer_name,
    customer_queue_number: ticket.customer_queue_number,
    date: ticket.date,
    status: ticket.status,
    manager_notes: ticket.manager_notes || "",
    items: ticket.items.map(item => ({
      item_id: item.id,
      title: item.title,
      weight: parseFloat(item.weight),
      carat: parseFloat(item.carat),
      price_per_gram: parseFloat(item.price_per_gram),
      total_price: parseFloat(item.total_price),
      item_status: item.status || ticket.status
    }))
  };

  const jsonEl = document.getElementById('jsonInspector');
  if (jsonEl) {
    jsonEl.textContent = JSON.stringify(payload, null, 2);
  }
}

function simulatePostRequest() {
  updateJsonInspector();
  showToast("POST /api/manager/appraisals request simulated successfully!");
}

function copyJsonPayload() {
  const text = document.getElementById('jsonInspector').textContent;
  navigator.clipboard.writeText(text);
  showToast("C++ Struct JSON payload copied to clipboard.");
}
