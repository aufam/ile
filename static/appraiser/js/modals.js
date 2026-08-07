// ==================== NEW CUSTOMER TICKET MODAL ====================
function openNewCustomerModal() {
  document.getElementById('newQueueNo').value = `Q-00${ticketsData.length + 1}`;
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newCustomerModal').classList.remove('hidden');
}

function closeNewCustomerModal() {
  document.getElementById('newCustomerModal').classList.add('hidden');
}

function handleCreateNewTicket(e) {
  e.preventDefault();
  const qNo = document.getElementById('newQueueNo').value;
  const cName = document.getElementById('newCustomerName').value;

  const getStationVal = (id) => {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.value !== undefined && el.value !== '' ? el.value : (el.textContent || '');
  };

  const newTicket = {
    id: `ticket-${Date.now()}`,
    branch: getStationVal('stationBranch'),
    counter: getStationVal('stationCounter'),
    staff_name: getStationVal('stationStaff'),
    customer_name: cName,
    customer_queue_number: qNo,
    date: getStationVal('stationDate'),
    status: "In Measurement",
    signature: null,
    items: []
  };

  ticketsData.unshift(newTicket);
  activeTicketId = newTicket.id;

  renderQueueGrid();
  loadActiveTicket(newTicket.id);
  closeNewCustomerModal();
  switchTab('measurementTab');
  showToast(`Created Queue Ticket ${qNo} for ${cName}`);
}
