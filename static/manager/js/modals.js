// ==================== MANAGER STATUS & ACTIONS MODALS ====================
let selectedModalTicketId = null;

function openManageStatusModal(ticketId) {
  selectedModalTicketId = ticketId;
  const ticket = managerTicketsData.find(t => t.id === ticketId);
  if (!ticket) return;

  const titleEl = document.getElementById('modalTicketTitle');
  const infoEl = document.getElementById('modalCustomerInfo');
  const statusEl = document.getElementById('modalTicketStatusSelect');
  const notesEl = document.getElementById('modalManagerNotes');

  if (titleEl) titleEl.textContent = `Manage Queue Ticket ${ticket.customer_queue_number}`;
  if (infoEl) infoEl.textContent = `Customer: ${ticket.customer_name} • ${ticket.branch} (${ticket.counter})`;
  if (statusEl) statusEl.value = ticket.status;
  if (notesEl) notesEl.value = ticket.manager_notes || '';

  const modalEl = document.getElementById('manageStatusModal');
  if (modalEl) modalEl.classList.remove('hidden');
}

function closeManageStatusModal() {
  const modalEl = document.getElementById('manageStatusModal');
  if (modalEl) modalEl.classList.add('hidden');
  selectedModalTicketId = null;
}

function handleSaveStatusUpdate(e) {
  if (e) e.preventDefault();
  if (!selectedModalTicketId) return;

  const newStatus = document.getElementById('modalTicketStatusSelect').value;
  const newNotes = document.getElementById('modalManagerNotes').value;

  const ticket = managerTicketsData.find(t => t.id === selectedModalTicketId);
  if (ticket) {
    ticket.status = newStatus;
    ticket.manager_notes = newNotes;
    ticket.items.forEach(item => item.status = newStatus);
    showToast(`Updated status for ${ticket.customer_queue_number} to "${newStatus}"`);
  }

  renderDatabaseTable();
  if (document.getElementById('managerItemsGrid')) {
    renderItemsInventory();
  }
  closeManageStatusModal();
}
