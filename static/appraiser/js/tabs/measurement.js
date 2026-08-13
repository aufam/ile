// ==================== MEASUREMENT TAB: FORM, ITEMS LIST, CALCULATIONS ====================
function loadActiveTicket() {
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
  setStationDisplay('stationBranch', ticket.office);
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
                                <span class="item-row-purity">${item.price_type}</span>
                            </div>
                        </div>
                        <div class="item-row-actions">
                            <button onclick="editItem(${item.id})" class="icon-btn edit" title="Edit Item">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteItem(${item.id})" class="icon-btn remove" title="Remove Item">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 3 Photo Thumbnails -->
                    <div class="item-row-thumbs">
                        <img src="${item.photo || '/images/no-image.jpg'}" title="Item Photo">
                        <img src="${item.weighing_photo || '/images/no-image.jpg'}" title="Scale Photo">
                        <img src="${item.xrf_photo || '/images/no-image.jpg'}" title="XRF Spectrum Photo">
                    </div>

                    <div class="item-row-metrics">
                        <div>
                            <span class="metric-label">Weight</span>
                            <span class="metric-value">${item.weight} g</span>
                        </div>
                        <div>
                            <span class="metric-label">Rate</span>
                            <span class="metric-value">Rp${formatRupiah(item.price_per_gram)}/g</span>
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
  document.getElementById('summaryGrandTotal').textContent = `Rp${formatRupiah(grandTotal)}`;
  document.getElementById('itemsCountBadge').textContent = `${ticket.items.length} items`;
}

// Live Calculation
function calculateItemTotal() {
  const weightInput = document.getElementById("itemWeight");
  const priceInput = document.getElementById("itemPricePerGram");
  const totalInput = document.getElementById("itemTotalPrice");

  const weight = parseFloat(weightInput.value.replace(',', '.')) || 0;
  const pricePerGram = parseRupiah(priceInput.value);
  const total = Math.round(weight * pricePerGram);

  priceInput.value = formatRupiah(pricePerGram);
  totalInput.value = formatRupiah(total);
}

function applyPriceTypePreset(priceType) {
  if (!priceType) return;

  const priceTypeInput = document.getElementById('itemPriceType');
  const priceInput = document.getElementById('itemPricePerGram');
  const pricelist = offices[currentAppraiser.branch].pricelist;

  const price = pricelist.find(
    price => price.type === priceType
  );

  if (!price) {
    return;
  }

  priceTypeInput.value = price.type;
  priceInput.value = formatRupiah(price.price);

  calculateItemTotal();
}

// Image Preset Sampler / File Reader
function presetSampleImage(photoKey, sampleType) {
  const dataUri = SAMPLE_IMAGES[sampleType];
  setPhotoPreview(photoKey, dataUri);
  showToast(`Loaded sample ${sampleType} device image.`);
}

async function resizeImage(file, maxSize = 1920, quality = 0.85) {
  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;

  // Scale down while preserving aspect ratio
  if (width > maxSize || height > maxSize) {
    const scale = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);

  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("JPEG conversion failed")),
      "image/jpeg",
      quality
    );
  });
}

async function handleImageUpload(event, photoKey) {
  const file = event.target.files[0];
  if (!file) return;

  const toast = showToast('Uploading image...', 'loading');
  try {
    const jpeg = await resizeImage(file, 1920, 0.85);

    const response = await fetch(
      `/api/images?key=${photoKey}` +
      `&office=${encodeURIComponent(currentAppraiser.branch)}` +
      `&counter=${encodeURIComponent(currentAppraiser.counter)}` +
      `&date=${encodeURIComponent(currentAppraiser.date)}`,
      {
        method: 'POST',
        headers: { "Content-Type": jpeg.type },
        body: jpeg
      }
    );

    if (!response.ok)
      throw new Error(`${response.status}`);

    const result = await response.json();

    // Replace local preview/reference with server URL
    setPhotoPreview(photoKey, result.uri);

    toast.querySelector('span').textContent = 'Upload complete';
    toast.className = 'ile-toast success';
    toast.querySelector('i').className = 'fa-solid fa-circle-check';
  } catch (err) {
    toast.className = 'ile-toast error';
    toast.querySelector('i').className = 'fa-solid fa-circle-xmark';
    toast.querySelector('span').textContent = `Upload failed: ${err}`;
  } finally {
    setTimeout(() => toast.remove(), 3000);
  }
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
async function handleSaveItem(e) {
  e.preventDefault();
  const ticket = getActiveTicket();
  if (!ticket) return;

  const weightInput = document.getElementById('itemWeight');
  const purityInput = document.getElementById('itemPurity');
  const titleInput = document.getElementById('itemTitle');
  const priceTypeInput = document.getElementById('itemPriceType');
  const pricePerGramInput = document.getElementById('itemPricePerGram');
  const totalPriceInput = document.getElementById('itemTotalPrice');

  const itemId = parseInt(document.getElementById('editingItemId').value || 0);
  const title = titleInput.value;
  const weight = parseFloat(weightInput.value.replace(',', '.')) || 0;
  const purity = parseInt(purityInput.value || 0);
  const priceType = priceTypeInput.value;
  const pricePerGram = parseRupiah(pricePerGramInput.value) || 0;
  const totalPrice = parseRupiah(totalPriceInput.value) || 0;

  const newItemData = {
    id: itemId,
    title: title,
    photo: currentPhoto1,
    weighing_photo: currentPhoto2,
    xrf_photo: currentPhoto3,
    weight: weight,
    purity: purity,
    price_type: priceType,
    price_per_gram: pricePerGram,
    total_price: totalPrice
  };

  const response = await fetch(
    `/api/items?ticketId=${ticket.id}` +
    `&office=${encodeURIComponent(currentAppraiser.branch)}` +
    `&counter=${encodeURIComponent(currentAppraiser.counter)}` +
    `&date=${encodeURIComponent(currentAppraiser.date)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemData)
    }
  );
  if (!response.ok) {
    showToast(`Failed: ${response.status}`);
  } else {
    showToast("Item submitted.");
    resetMeasurementForm();
  }
}

function editItem(itemId) {
  const ticket = getActiveTicket();
  if (!ticket) return;

  const item = ticket.items.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('editingItemId').value = item.id;
  document.getElementById('itemTitle').value = item.title;
  document.getElementById('itemWeight').value = item.weight;
  document.getElementById('itemPriceType').value = item.price_type;
  document.getElementById('itemPricePerGram').value = item.price_per_gram;
  document.getElementById('itemTotalPrice').value = item.total_price;

  document.getElementById('formModeLabel').textContent = 'Editing Item';
  document.getElementById('saveItemBtnText').textContent = 'Update Item Details';

  setPhotoPreview('photo1', item.photo);
  setPhotoPreview('photo2', item.weighing_photo);
  setPhotoPreview('photo3', item.xrf_photo);
}

async function deleteItem(itemId) {
  const ticket = getActiveTicket();
  if (!ticket) return;

  const response = await fetch(
    `/api/items?id=${itemId}` +
    `&office=${encodeURIComponent(currentAppraiser.branch)}` +
    `&counter=${encodeURIComponent(currentAppraiser.counter)}` +
    `&date=${encodeURIComponent(currentAppraiser.date)}`
    ,
    { method: 'DELETE' }
  );
  if (!response.ok) {
    showToast(`Delete failed: ${response.status}`);
  } else {
    showToast("Item removed.");
  }
}
