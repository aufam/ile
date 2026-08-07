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

function updateJsonInspector() {
  const ticket = getActiveTicket();
  if (!ticket) return;

  // Construct structure matching std::vector<Measurement> and C++ Data struct
  const payload = {
    branch: ticket.branch,
    counter: ticket.counter,
    staff_name: ticket.staff_name,
    customer_name: ticket.customer_name,
    customer_queue_number: ticket.customer_queue_number,
    date: ticket.date,
    items: ticket.items.map(item => ({
      photo: item.photo ? item.photo.substring(0, 45) + "...[base64]" : "",
      weighing_photo: item.weighing_photo ? item.weighing_photo.substring(0, 45) + "...[base64]" : "",
      xrf_photo: item.xrf_photo ? item.xrf_photo.substring(0, 45) + "...[base64]" : "",
      weight: parseFloat(item.weight),
      carat: parseFloat(item.carat),
      price_per_gram: parseFloat(item.price_per_gram),
      total_price: parseFloat(item.total_price)
    }))
  };

  document.getElementById('jsonInspector').textContent = JSON.stringify(payload, null, 2);
}

function simulatePostRequest() {
  updateJsonInspector();
  showToast("POST /api/appraisals request simulated successfully!");
}

function copyJsonPayload() {
  const text = document.getElementById('jsonInspector').textContent;
  navigator.clipboard.writeText(text);
  showToast("JSON payload copied to clipboard.");
}
