// ==================== INVENTORY & ITEMS MANAGER ====================
function renderItemsInventory() {
  const container = document.getElementById('managerItemsGrid');
  if (!container) return;
  container.innerHTML = '';

  const activeBranch = currentManagerSession ? currentManagerSession.branch : 'Jakarta Barat';

  let allItems = [];
  managerTicketsData.forEach(ticket => {
    if (activeBranch === 'ALL' || ticket.branch === activeBranch) {
      ticket.items.forEach(item => {
        allItems.push({
          ...item,
          ticket_id: ticket.id,
          queue_number: ticket.customer_queue_number,
          customer_name: ticket.customer_name,
          branch: ticket.branch,
          counter: ticket.counter,
          staff_name: ticket.staff_name,
          date: ticket.date
        });
      });
    }
  });

  if (allItems.length === 0) {
    container.innerHTML = `
      <div class="items-empty-state">
        <i class="fa-solid fa-gem"></i>
        <p class="primary">No jewelry items found in database for branch "${activeBranch}".</p>
      </div>
    `;
    return;
  }

  allItems.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'manager-item-card';

    itemCard.innerHTML = `
      <div class="manager-item-header">
        <div>
          <span class="manager-item-badge">${item.queue_number}</span>
          <h3 class="manager-item-title">${item.title}</h3>
          <p class="manager-item-sub"><i class="fa-solid fa-user"></i> ${item.customer_name} • ${item.staff_name}</p>
        </div>
        <span class="status-chip ${getStatusChipClass(item.status || 'Approved')}">${item.status || 'Approved'}</span>
      </div>

      <div class="manager-item-photos">
        <div>
          <span>Jewelry</span>
          <img src="${item.photo}" alt="${item.title}">
        </div>
        <div>
          <span>Scale</span>
          <img src="${item.weighing_photo}" alt="Scale">
        </div>
        <div>
          <span>XRF</span>
          <img src="${item.xrf_photo}" alt="XRF">
        </div>
      </div>

      <div class="manager-item-metrics">
        <div>
          <span class="lbl">Weight</span>
          <span class="val">${item.weight} g</span>
        </div>
        <div>
          <span class="lbl">Karat</span>
          <span class="val amber">${item.carat}K</span>
        </div>
        <div>
          <span class="lbl">Valuation</span>
          <span class="val font-mono">${formatRupiah(item.total_price)}</span>
        </div>
      </div>

      <div class="manager-item-actions">
        <button onclick="viewCertificateFromDb('${item.ticket_id}')" class="btn-form-secondary btn-sm">
          <i class="fa-solid fa-file-certificate"></i> Certificate
        </button>
        <button onclick="openManageStatusModal('${item.ticket_id}')" class="btn-form-primary btn-sm btn-amber">
          <i class="fa-solid fa-pen"></i> Update Status
        </button>
      </div>
    `;

    container.appendChild(itemCard);
  });
}
