// ==================== MEASUREMENT TAB: FORM, ITEMS LIST, CALCULATIONS ====================
function loadActiveTicket(ticketId) {
  const ticket = getActiveTicket();
  if (!ticket) return;

  document.getElementById('activeQueueDisplayNumber').textContent = ticket.customer_queue_number;
  document.getElementById('activeCustomerDisplayName').textContent = `Customer: ${ticket.customer_name}`;
  document.getElementById('activeTicketIdDisplay').textContent = `#${ticket.id}`;
  document.getElementById('activeTicketStatusBadge').textContent = ticket.status;

  // Sync header controls if different
  const setStationDisplay = (id, val) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = val || '';
      el.value = val || '';
    }
  };
  setStationDisplay('stationBranch', ticket.branch);
  setStationDisplay('stationCounter', ticket.counter);
  setStationDisplay('stationStaff', ticket.staff_name);

  renderActiveTicketItems();
  resetMeasurementForm();
}

// Render Active Items List in Measurement Tab
function renderActiveTicketItems() {
  const ticket = getActiveTicket();
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  if (!ticket || ticket.items.length === 0) {
    container.innerHTML = `
                    <div class="items-empty-state">
                        <i class="fa-solid fa-gem"></i>
                        <p class="primary">No items added to this customer queue ticket yet.</p>
                        <p class="secondary">Use the measurement form on the left to add items.</p>
                    </div>
                `;
    document.getElementById('summaryTotalWeight').textContent = '0.00 g';
    document.getElementById('summaryGrandTotal').textContent = formatRupiah(0);
    document.getElementById('itemsCountBadge').textContent = '0 items';
    return;
  }

  let totalWeight = 0;
  let grandTotal = 0;

  ticket.items.forEach((item, index) => {
    totalWeight += parseFloat(item.weight || 0);
    grandTotal += parseFloat(item.total_price || 0);

    const itemCard = document.createElement('div');
    itemCard.className = "item-row-card";

    itemCard.innerHTML = `
                    <div class="item-row-top">
                        <div class="item-row-id-group">
                            <span class="item-row-index">
                                #${index + 1}
                            </span>
                            <div>
                                <h4 class="item-row-title">${item.title}</h4>
                                <span class="item-row-purity">${item.carat}K Purity</span>
                            </div>
                        </div>
                        <div class="item-row-actions">
                            <button onclick="editItem('${item.id}')" class="icon-btn edit" title="Edit Item">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteItem('${item.id}')" class="icon-btn remove" title="Remove Item">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 3 Photo Thumbnails -->
                    <div class="item-row-thumbs">
                        <img src="${item.photo || SAMPLE_IMAGES.jewelry}" title="Item Photo">
                        <img src="${item.weighing_photo || SAMPLE_IMAGES.scale}" title="Scale Photo">
                        <img src="${item.xrf_photo || SAMPLE_IMAGES.xrf}" title="XRF Spectrum Photo">
                    </div>

                    <div class="item-row-metrics">
                        <div>
                            <span class="metric-label">Weight</span>
                            <span class="metric-value">${item.weight} g</span>
                        </div>
                        <div>
                            <span class="metric-label">Rate</span>
                            <span class="metric-value">${formatRupiah(item)}/g</span>
                        </div>
                        <div>
                            <span class="metric-label">Total</span>
                            <span class="metric-value amount">${formatRupiah(item.total_price)}</span>
                        </div>
                    </div>
                `;
    container.appendChild(itemCard);
  });

  document.getElementById('summaryTotalWeight').textContent = `${totalWeight.toFixed(2)} g`;
  document.getElementById('summaryGrandTotal').textContent = `${formatRupiah(grandTotal)}`;
  document.getElementById('itemsCountBadge').textContent = `${ticket.items.length} items`;
}

// Live Calculation
function calculateItemTotal() {
  const weight =
    parseFloat(document.getElementById("itemWeight").value) || 0;

  const priceInput = document.getElementById("itemPricePerGram");
  const totalInput = document.getElementById("itemTotalPrice");

  // Parse numeric value
  const pricePerGram = parseRupiah(priceInput.value);

  // Reformat as user types
  priceInput.value = formatRupiah(pricePerGram);

  // Calculate
  const total = Math.round(weight * pricePerGram);

  // Display formatted result
  totalInput.value = formatRupiah(total);
}

function applyCaratPreset(caratVal) {
  if (!caratVal) return;
  document.getElementById('itemCarat').value = caratVal;

  // Auto suggest price multiplier based on standard spot gold (Rp2.000.000/g 24K base)
  const base24K = 80.00;
  const purityRatio = parseFloat(caratVal) / 24.0;
  const suggestedRate = (base24K * purityRatio).toFixed(2);
  document.getElementById('itemPricePerGram').value = suggestedRate;

  calculateItemTotal();
}

// Image Preset Sampler / File Reader
function presetSampleImage(photoKey, sampleType) {
  const dataUri = SAMPLE_IMAGES[sampleType];
  setPhotoPreview(photoKey, dataUri);
  showToast(`Loaded sample ${sampleType} device image.`);
}

function handleImageUpload(event, photoKey) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    setPhotoPreview(photoKey, e.target.result);
  };
  reader.readAsDataURL(file);
}

function setPhotoPreview(photoKey, dataUri) {
  if (photoKey === 'photo1') currentPhoto1 = dataUri;
  if (photoKey === 'photo2') currentPhoto2 = dataUri;
  if (photoKey === 'photo3') currentPhoto3 = dataUri;

  const imgEl = document.getElementById(`${photoKey}Preview`);
  const placeholderEl = document.getElementById(`${photoKey}Placeholder`);

  imgEl.src = dataUri;
  imgEl.classList.remove('hidden');
  placeholderEl.classList.add('hidden');
}

function resetMeasurementForm() {
  document.getElementById('measurementForm').reset();
  document.getElementById('editingItemId').value = '';
  document.getElementById('formModeLabel').textContent = 'Adding New Item';
  document.getElementById('saveItemBtnText').textContent = 'Save Item to Ticket';

  ['photo1', 'photo2', 'photo3'].forEach(key => {
    document.getElementById(`${key}Preview`).src = '';
    document.getElementById(`${key}Preview`).classList.add('hidden');
    document.getElementById(`${key}Placeholder`).classList.remove('hidden');
  });

  currentPhoto1 = "";
  currentPhoto2 = "";
  currentPhoto3 = "";
}

// Save / Edit Item
function handleSaveItem(e) {
  e.preventDefault();
  const ticket = getActiveTicket();
  if (!ticket) return;

  const itemId = document.getElementById('editingItemId').value;
  const title = document.getElementById('itemTitle').value;
  const weight = parseFloat(document.getElementById('itemWeight').value) || 0;
  const carat = parseFloat(document.getElementById('itemCarat').value) || 0;
  const pricePerGram = parseRupiah(document.getElementById('itemPricePerGram').value) || 0;
  const totalPrice = parseRupiah(document.getElementById('itemTotalPrice').value) || 0;

  const newItemData = {
    id: itemId || `item-${Date.now()}`,
    title: title,
    photo: currentPhoto1 || SAMPLE_IMAGES.jewelry,
    weighing_photo: currentPhoto2 || SAMPLE_IMAGES.scale,
    xrf_photo: currentPhoto3 || SAMPLE_IMAGES.xrf,
    weight: weight,
    carat: carat,
    price_per_gram: pricePerGram,
    total_price: totalPrice
  };

  if (itemId) {
    // Update existing
    const idx = ticket.items.findIndex(i => i.id === itemId);
    if (idx !== -1) ticket.items[idx] = newItemData;
    showToast("Jewelry item updated.");
  } else {
    // Add new
    ticket.items.push(newItemData);
    showToast("New jewelry item attached to queue ticket!");
  }

  renderActiveTicketItems();
  renderQueueGrid();
  resetMeasurementForm();
}

function editItem(itemId) {
  const ticket = getActiveTicket();
  if (!ticket) return;

  const item = ticket.items.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('editingItemId').value = item.id;
  document.getElementById('itemTitle').value = item.title;
  document.getElementById('itemWeight').value = item.weight;
  document.getElementById('itemCarat').value = item.carat;
  document.getElementById('itemPricePerGram').value = item.price_per_gram;
  document.getElementById('itemTotalPrice').value = item.total_price;

  document.getElementById('formModeLabel').textContent = 'Editing Item';
  document.getElementById('saveItemBtnText').textContent = 'Update Item Details';

  setPhotoPreview('photo1', item.photo);
  setPhotoPreview('photo2', item.weighing_photo);
  setPhotoPreview('photo3', item.xrf_photo);
}

function deleteItem(itemId) {
  const ticket = getActiveTicket();
  if (!ticket) return;

  ticket.items = ticket.items.filter(i => i.id !== itemId);
  renderActiveTicketItems();
  renderQueueGrid();
  showToast("Item removed.");
}
