// ==================== NEW CUSTOMER TICKET MODAL ====================
function openNewCustomerModal() {
  document.getElementById('newQueueNo').value = `Q-00${ticketsData.length + 1}`;
  document.getElementById('newCustomerName').value = '';
  document.getElementById('newCustomerModal').classList.remove('hidden');
}

function closeNewCustomerModal() {
  document.getElementById('newCustomerModal').classList.add('hidden');
}

async function handleCreateNewTicket(e) {
  e.preventDefault();
  const qNo = document.getElementById('newQueueNo').value;
  const cName = document.getElementById('newCustomerName').value;

  const getStationVal = (id) => {
    const el = document.getElementById(id);
    if (!el) return '';
    return el.value !== undefined && el.value !== '' ? el.value : (el.textContent || '');
  };

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

  closeNewCustomerModal();
  if (!response.ok) {
    showToast(`Failed to add a new ticket: ${response.status}`);
  } else {
    showToast(`Posted Ticket ${qNo} for ${cName}`);
  }

  // while (stateWebSocket && ticketsData.length <= len) {
  //   await new Promise(resolve => setTimeout(resolve, 100));
  // }

  // activeTicketId = ticketsData[0].id;
  //
  // loadActiveTicket();
  // switchTab('measurementTab');
}
