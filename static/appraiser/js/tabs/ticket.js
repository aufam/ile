function getStationVal(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  return el.value !== undefined && el.value !== '' ? el.value : (el.textContent || '');
}

function openNewTicketModal() {
  document.getElementById('newQueueNo').value = `Q-00${ticketsData.length + 1}`;
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newCustomerModal').classList.remove('hidden');
}

function closeNewTicketModal() {
  document.getElementById('newCustomerModal').classList.add('hidden');
}

async function handleCreateNewTicket(e) {
  e.preventDefault();
  const qNo = document.getElementById('newQueueNo').value;
  const cName = document.getElementById('newCustomerName').value;

  const response = await fetch(
    `/api/tickets` +
    `?office=${encodeURIComponent(currentAppraiser.branch)}` +
    `&counter=${encodeURIComponent(currentAppraiser.counter)}` +
    `&date=${encodeURIComponent(currentAppraiser.date)}`
    ,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_name: getStationVal('stationStaff'),
        customer_name: cName,
        customer_queue_number: qNo,
        status: "In Measurement",
      })
    },
  );

  closeNewTicketModal();
  if (!response.ok) {
    showToast(`Failed to add a new ticket: ${response.status}`);
  } else {
    showToast(`Posted Ticket ${qNo} for ${cName}`);
  }
}

// ==================== QUEUE GRID & STATION CONTEXT ====================
function updateStationContext() {
  const ticket = getActiveTicket();
  if (ticket) {
    ticket.branch = getStationVal('stationBranch');
    ticket.counter = getStationVal('stationCounter');
    ticket.staff_name = getStationVal('stationStaff');
    ticket.date = getStationVal('stationDate');
    // updateJsonInspector();
  }
}

// Render Queue Cards Grid
function renderQueueGrid() {
  const grid = document.getElementById('queueGrid');
  grid.innerHTML = '';

  document.getElementById('queueBadge').textContent = ticketsData.length;

  ticketsData.forEach(ticket => {
    const totalItems = ticket.items.length;
    const grandTotal = ticket.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const isActive = ticket.id === activeTicketId;

    const card = document.createElement('div');
    card.className = `ticket-card ${isActive ? 'active' : ''}`;

    card.innerHTML = `
                    <div class="ticket-card-top">
                        <div class="ticket-card-id-row">
                            <span class="ticket-queue-chip">
                                ${ticket.customer_queue_number}
                            </span>
                            <div>
                                <h3 class="ticket-customer-name">${ticket.customer_name}</h3>
                                <p class="ticket-staff-line"><i class="fa-solid fa-user-tie"></i>${ticket.staff_name}</p>
                            </div>
                        </div>
                        <span class="status-chip ${getTicketStatusStyle(ticket.status)}">
                            ${ticket.status}
                        </span>
                    </div>

                    <div class="ticket-stats-row">
                        <div>
                            <span class="ticket-stat-label">Items Count</span>
                            <span class="ticket-stat-value">${totalItems} jewelry pcs</span>
                        </div>
                        <div>
                            <span class="ticket-stat-label">Total Valuation</span>
                            <span class="ticket-stat-value amount">${formatRupiah(grandTotal)}</span>
                        </div>
                    </div>

                    <div class="ticket-card-actions">
                        <button onclick="selectAndWorkOnTicket(${ticket.id})" class="ticket-work-btn ${isActive ? 'is-active' : ''}">
                            <i class="fa-solid fa-scale-balanced"></i> ${isActive ? 'Currently Active' : 'Work on Ticket'}
                        </button>
                        <button onclick="deleteTicket(${ticket.id})" class="ticket-delete-btn" title="Delete Ticket">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
    grid.appendChild(card);
  });
}

function getTicketStatusStyle(status) {
  switch (status) {
    case "In Measurement": return "status-measurement";
    case "Ready for Customer": return "status-ready";
    case "Completed": return "status-completed";
    default: return "status-default";
  }
}

function selectAndWorkOnTicket(ticketId) {
  activeTicketId = ticketId;
  renderQueueGrid();
  loadActiveTicket();
  switchTab('measurementTab');
  showToast("Queue ticket selected for station processing.");
}

async function deleteTicket(ticketId) {
  if (ticketsData.length <= 1) {
    showToast("Cannot delete the only remaining queue ticket.");
    return;
  }

  const response = await fetch(
    `/api/tickets?id=${ticketId}` +
    `&office=${encodeURIComponent(currentAppraiser.branch)}` +
    `&counter=${encodeURIComponent(currentAppraiser.counter)}` +
    `&date=${encodeURIComponent(currentAppraiser.date)}`
    ,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    showToast(`Delete failed: ${response.status}`);
  } else {
    showToast("Queue ticket removed.");
  }
}
