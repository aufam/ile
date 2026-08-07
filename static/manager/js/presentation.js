// ==================== CERTIFICATE VIEW & PRINT ====================
function renderCustomerPresentation() {
  const ticket = getActiveTicket();
  if (!ticket) return;

  const branchAddr = document.getElementById('reportBranchAddress');
  const queueNo = document.getElementById('reportQueueNo');
  const dateEl = document.getElementById('reportDate');
  const staffEl = document.getElementById('reportStaff');
  const customerEl = document.getElementById('reportCustomer');
  const statusBadge = document.getElementById('reportStatusBadge');

  if (branchAddr) branchAddr.textContent = `${ticket.branch} • ${ticket.counter}`;
  if (queueNo) queueNo.textContent = ticket.customer_queue_number;
  if (dateEl) dateEl.textContent = ticket.date;
  if (staffEl) staffEl.textContent = ticket.staff_name;
  if (customerEl) customerEl.textContent = ticket.customer_name;
  if (statusBadge) {
    statusBadge.textContent = ticket.status;
    statusBadge.className = `status-chip ${getStatusChipClass(ticket.status)}`;
  }

  const listContainer = document.getElementById('reportItemsList');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  let grandTotal = 0;

  ticket.items.forEach((item, index) => {
    grandTotal += item.total_price;

    const itemEl = document.createElement('div');
    itemEl.className = "certificate-item-card";

    itemEl.innerHTML = `
      <div class="certificate-item-head">
        <div>
          <span class="certificate-item-eyebrow">Item #${index + 1}</span>
          <h4 class="certificate-item-title">${item.title}</h4>
        </div>
        <div class="certificate-item-sub-right">
          <span class="certificate-item-sub-label">Subtotal Valuation</span>
          <span class="certificate-item-sub-value">${formatRupiah(item.total_price)}</span>
        </div>
      </div>

      <div class="certificate-photos-grid">
        <div>
          <span class="certificate-photo-label"><i class="fa-solid fa-camera"></i> Jewelry Photo</span>
          <img src="${item.photo}">
        </div>
        <div>
          <span class="certificate-photo-label"><i class="fa-solid fa-weight-scale"></i> Scale Reading</span>
          <img src="${item.weighing_photo}">
        </div>
        <div>
          <span class="certificate-photo-label"><i class="fa-solid fa-atom"></i> XRF Spectrometry</span>
          <img src="${item.xrf_photo}">
        </div>
      </div>

      <div class="certificate-metrics-row">
        <div>
          <span class="metric-label">Measured Weight</span>
          <span class="metric-value">${item.weight} grams</span>
        </div>
        <div>
          <span class="metric-label">Assayed Carat</span>
          <span class="metric-value amber">${item.carat}K</span>
        </div>
        <div>
          <span class="metric-label">Assigned Rate</span>
          <span class="metric-value">${formatRupiah(item.price_per_gram)} / g</span>
        </div>
      </div>
    `;
    listContainer.appendChild(itemEl);
  });

  const grandTotalEl = document.getElementById('reportGrandTotal');
  const countEl = document.getElementById('reportItemCountSummary');
  if (grandTotalEl) grandTotalEl.textContent = formatRupiah(grandTotal);
  if (countEl) countEl.textContent = `(${ticket.items.length} items assessed)`;

  const sigDisplay = document.getElementById('signatureDisplay');
  if (sigDisplay) {
    if (ticket.signature) {
      sigDisplay.innerHTML = `<img src="${ticket.signature}">`;
    } else {
      sigDisplay.innerHTML = `<span class="placeholder-text">Pending Customer Signature</span>`;
    }
  }

  const managerNotesEl = document.getElementById('reportManagerNotes');
  if (managerNotesEl) {
    managerNotesEl.textContent = ticket.manager_notes || "Verified by Branch Manager.";
  }
}
