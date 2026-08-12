// ==================== DATABASE TABLE & C++ STRUCT INSPECTOR ====================
function renderDatabaseTable() {
  const tbody = document.getElementById('databaseTableBody');
  tbody.innerHTML = '';

  ticketsData.forEach(ticket => {
    const totalValue = ticket.items.reduce((sum, item) => sum + item.total_price, 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
                    <td class="queue-no">${ticket.customer_queue_number}</td>
                    <td class="customer">${ticket.customer_name}</td>
                    <td class="branch-counter">${ticket.branch} (${ticket.counter})</td>
                    <td class="staff">${ticket.staff_name}</td>
                    <td>${ticket.date}</td>
                    <td>${ticket.items.length} pcs</td>
                    <td class="total-value">${formatRupiah(totalValue)}</td>
                    <td class="actions">
                        <button onclick="selectAndWorkOnTicket('${ticket.id}')" class="db-load-btn">
                            Load
                        </button>
                    </td>
                `;
    tbody.appendChild(tr);
  });
}


function copyJsonPayload() {
  const text = document.getElementById('jsonInspector').textContent;
  navigator.clipboard.writeText(text);
  showToast("JSON payload copied to clipboard.");
}
