// ==================== CUSTOMER LIVE PRESENTATION / CERTIFICATE ====================
function renderCustomerPresentation() {
  const ticket = getActiveTicket();
  if (!ticket) return;

  document.getElementById('reportBranchAddress').textContent = `${ticket.office} • ${ticket.counter}`;
  document.getElementById('reportQueueNo').textContent = ticket.customer_queue_number;
  document.getElementById('reportDate').textContent = ticket.date;
  document.getElementById('reportStaff').textContent = ticket.staff_name;
  document.getElementById('reportCustomer').textContent = ticket.customer_name;

  const listContainer = document.getElementById('reportItemsList');
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

                    <!-- 3 Side-by-side device verification photos -->
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

                    <!-- Metrics Table Row -->
                    <div class="certificate-metrics-row">
                        <div>
                            <span class="metric-label">Measured Weight</span>
                            <span class="metric-value">${item.weight} grams</span>
                        </div>
                        <div>
                            <span class="metric-label">Assayed Carat</span>
                            <span class="metric-value amber">${item.price_type}${item.purity > 0 ? ' ' + item.purity + '%' : ''}</span>
                        </div>
                        <div>
                            <span class="metric-label">Assigned Rate</span>
                            <span class="metric-value">Rp${formatRupiah(item.price_per_gram)} / g</span>
                        </div>
                    </div>
                `;
    listContainer.appendChild(itemEl);
  });

  document.getElementById('reportGrandTotal').textContent = `${formatRupiah(grandTotal)}`;
  document.getElementById('reportItemCountSummary').textContent = `(${ticket.items.length} items assessed)`;

  const sigDisplay = document.getElementById('signatureDisplay');
  if (ticket.signature) {
    sigDisplay.innerHTML = `<img src="${ticket.signature}">`;
  } else {
    sigDisplay.innerHTML = `<span class="placeholder-text">Pending Signature</span>`;
  }
}
