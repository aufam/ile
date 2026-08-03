
// Sample Placeholder SVG Data URIs for device simulation
const SAMPLE_IMAGES = {
  jewelry: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%231e293b'/><circle cx='200' cy='150' r='70' stroke='%23d4af37' stroke-width='16' fill='none'/><polygon points='200,90 220,130 180,130' fill='%2338bdf8'/><text x='50%' y='85%' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'>Sample Jewelry Item Photo</text></svg>",
  scale: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%230f172a'/><rect x='80' y='60' width='240' height='120' rx='10' fill='%230284c7'/><text x='200' y='130' text-anchor='middle' fill='%23ffffff' font-size='36' font-weight='bold' font-family='monospace'>12.45 g</text><text x='50%' y='85%' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'>Precision Scale Readout</text></svg>",
  xrf: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%2318181b'/><path d='M 50 200 Q 120 40 180 180 T 350 200' stroke='%2310b981' stroke-width='4' fill='none'/><text x='200' y='80' text-anchor='middle' fill='%2334d399' font-size='20' font-family='sans-serif'>Au: 75.2% (18.05K)</text><text x='50%' y='88%' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'>XRF Spectrometry Peak</text></svg>"
};

// Core App Data State
let ticketsData = [
  {
    id: "ticket-101",
    branch: "Central Grand Branch",
    counter: "Counter #01 - High Value",
    staff_name: "Alex Rivera (Appraiser)",
    customer_name: "Eleanor Vance",
    customer_queue_number: "Q-001",
    date: new Date().toISOString().split('T')[0],
    status: "In Measurement",
    signature: null,
    items: [
      {
        id: "item-1",
        title: "18K Gold Diamond Ring",
        photo: SAMPLE_IMAGES.jewelry,
        weighing_photo: SAMPLE_IMAGES.scale,
        xrf_photo: SAMPLE_IMAGES.xrf,
        weight: 12.45,
        carat: 18.0,
        price_per_gram: 62.50,
        total_price: 778.13
      },
      {
        id: "item-2",
        title: "22K Solid Gold Bangle",
        photo: SAMPLE_IMAGES.jewelry,
        weighing_photo: SAMPLE_IMAGES.scale,
        xrf_photo: SAMPLE_IMAGES.xrf,
        weight: 24.10,
        carat: 22.0,
        price_per_gram: 76.20,
        total_price: 1836.42
      }
    ]
  },
  {
    id: "ticket-102",
    branch: "Central Grand Branch",
    counter: "Counter #02 - Rapid Scale",
    staff_name: "Sarah Chen",
    customer_name: "Marcus Brody",
    customer_queue_number: "Q-002",
    date: new Date().toISOString().split('T')[0],
    status: "Ready for Customer",
    signature: null,
    items: [
      {
        id: "item-3",
        title: "14K Gold Chain Necklace",
        photo: SAMPLE_IMAGES.jewelry,
        weighing_photo: SAMPLE_IMAGES.scale,
        xrf_photo: SAMPLE_IMAGES.xrf,
        weight: 18.50,
        carat: 14.0,
        price_per_gram: 48.00,
        total_price: 888.00
      }
    ]
  }
];

let activeTicketId = "ticket-101";

// Current Form Image State (Base64 / Data URIs)
let currentPhoto1 = "";
let currentPhoto2 = "";
let currentPhoto3 = "";

// Initialization on page load
window.addEventListener('DOMContentLoaded', () => {
  // Set default date picker to today
  document.getElementById('stationDate').value = new Date().toISOString().split('T')[0];

  // Render initial queue grid
  renderQueueGrid();

  // Load initial active ticket into measurement station
  loadActiveTicket(activeTicketId);

  // Initialize canvas for digital signature
  initSignatureCanvas();
});

// Tab Switching logic
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.nav-tab').forEach(el => {
    el.classList.remove('bg-amber-500/10', 'text-amber-400', 'border', 'border-amber-500/30');
    el.classList.add('text-slate-400');
  });

  document.getElementById(tabId).classList.remove('hidden');
  const activeBtn = document.getElementById(`tabBtn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-400');
    activeBtn.classList.add('bg-amber-500/10', 'text-amber-400', 'border', 'border-amber-500/30');
  }

  if (tabId === 'customerReportTab') {
    renderCustomerPresentation();
  } else if (tabId === 'databaseTab') {
    renderDatabaseTable();
    updateJsonInspector();
  }
}

function updateStationContext() {
  const ticket = getActiveTicket();
  if (ticket) {
    ticket.branch = document.getElementById('stationBranch').value;
    ticket.counter = document.getElementById('stationCounter').value;
    ticket.staff_name = document.getElementById('stationStaff').value;
    ticket.date = document.getElementById('stationDate').value;
    updateJsonInspector();
  }
}

function getActiveTicket() {
  return ticketsData.find(t => t.id === activeTicketId);
}

// Render Queue Cards Grid
function renderQueueGrid() {
  const grid = document.getElementById('queueGrid');
  grid.innerHTML = '';

  document.getElementById('queueBadge').textContent = ticketsData.length;

  ticketsData.forEach(ticket => {
    const totalItems = ticket.items.length;
    const grandTotal = ticket.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    const isActive = ticket.id === activeTicketId;

    const card = document.createElement('div');
    card.className = `bg-slate-900 rounded-2xl p-5 border ${isActive ? 'border-amber-500 gold-border-glow' : 'border-slate-800'} flex flex-col justify-between space-y-4 hover:border-slate-700 transition`;

    card.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <span class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono text-base flex items-center justify-center">
                                ${ticket.customer_queue_number}
                            </span>
                            <div>
                                <h3 class="font-bold text-slate-100 text-base">${ticket.customer_name}</h3>
                                <p class="text-xs text-slate-400"><i class="fa-solid fa-user-tie text-slate-500 mr-1"></i>${ticket.staff_name}</p>
                            </div>
                        </div>
                        <span class="text-[10px] px-2.5 py-1 rounded-full font-semibold border ${getTicketStatusStyle(ticket.status)}">
                            ${ticket.status}
                        </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/80 font-mono">
                        <div>
                            <span class="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Items Count</span>
                            <span class="text-slate-200 font-bold">${totalItems} jewelry pcs</span>
                        </div>
                        <div>
                            <span class="text-slate-500 block text-[10px] uppercase font-sans font-semibold">Total Valuation</span>
                            <span class="text-amber-400 font-bold">$${grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 pt-1">
                        <button onclick="selectAndWorkOnTicket('${ticket.id}')" class="flex-1 py-2 ${isActive ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'} rounded-xl text-xs transition flex items-center justify-center gap-1.5">
                            <i class="fa-solid fa-scale-balanced"></i> ${isActive ? 'Currently Active' : 'Work on Ticket'}
                        </button>
                        <button onclick="deleteTicket('${ticket.id}')" class="p-2 text-slate-500 hover:text-red-400 bg-slate-950 hover:bg-slate-800 rounded-xl transition" title="Delete Ticket">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
    grid.appendChild(card);
  });
}

function getTicketStatusStyle(status) {
  switch (status) {
    case "In Measurement": return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    case "Ready for Customer": return "bg-sky-500/10 text-sky-300 border-sky-500/30";
    case "Completed": return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    default: return "bg-slate-800 text-slate-400 border-slate-700";
  }
}

function selectAndWorkOnTicket(ticketId) {
  activeTicketId = ticketId;
  renderQueueGrid();
  loadActiveTicket(ticketId);
  switchTab('measurementTab');
  showToast("Queue ticket selected for station processing.");
}

function loadActiveTicket(ticketId) {
  const ticket = getActiveTicket();
  if (!ticket) return;

  document.getElementById('activeQueueDisplayNumber').textContent = ticket.customer_queue_number;
  document.getElementById('activeCustomerDisplayName').textContent = `Customer: ${ticket.customer_name}`;
  document.getElementById('activeTicketIdDisplay').textContent = `#${ticket.id}`;
  document.getElementById('activeTicketStatusBadge').textContent = ticket.status;

  // Sync header controls if different
  document.getElementById('stationBranch').value = ticket.branch;
  document.getElementById('stationCounter').value = ticket.counter;
  document.getElementById('stationStaff').value = ticket.staff_name;

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
                    <div class="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                        <i class="fa-solid fa-gem text-slate-700 text-3xl mb-2"></i>
                        <p class="text-slate-400 text-xs font-medium">No items added to this customer queue ticket yet.</p>
                        <p class="text-slate-600 text-[11px] mt-0.5">Use the measurement form on the left to add items.</p>
                    </div>
                `;
    document.getElementById('summaryTotalWeight').textContent = '0.00 g';
    document.getElementById('summaryGrandTotal').textContent = '$0.00';
    document.getElementById('itemsCountBadge').textContent = '0 items';
    return;
  }

  let totalWeight = 0;
  let grandTotal = 0;

  ticket.items.forEach((item, index) => {
    totalWeight += parseFloat(item.weight || 0);
    grandTotal += parseFloat(item.total_price || 0);

    const itemCard = document.createElement('div');
    itemCard.className = "bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 relative group hover:border-slate-700 transition";

    itemCard.innerHTML = `
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center font-mono">
                                #${index + 1}
                            </span>
                            <div>
                                <h4 class="text-sm font-bold text-slate-200">${item.title}</h4>
                                <span class="text-xs text-amber-400 font-mono font-semibold">${item.carat}K Purity</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="editItem('${item.id}')" class="p-1.5 text-slate-400 hover:text-amber-400 text-xs transition" title="Edit Item">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="deleteItem('${item.id}')" class="p-1.5 text-slate-400 hover:text-red-400 text-xs transition" title="Remove Item">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 3 Photo Thumbnails -->
                    <div class="grid grid-cols-3 gap-2">
                        <img src="${item.photo || SAMPLE_IMAGES.jewelry}" class="w-full h-16 object-cover rounded-lg border border-slate-800 bg-slate-900" title="Item Photo">
                        <img src="${item.weighing_photo || SAMPLE_IMAGES.scale}" class="w-full h-16 object-cover rounded-lg border border-slate-800 bg-slate-900" title="Scale Photo">
                        <img src="${item.xrf_photo || SAMPLE_IMAGES.xrf}" class="w-full h-16 object-cover rounded-lg border border-slate-800 bg-slate-900" title="XRF Spectrum Photo">
                    </div>

                    <div class="grid grid-cols-3 gap-1 text-[11px] font-mono bg-slate-900 p-2 rounded-lg border border-slate-800/80 text-center">
                        <div>
                            <span class="text-slate-500 block text-[9px] font-sans">Weight</span>
                            <span class="text-slate-200">${item.weight} g</span>
                        </div>
                        <div>
                            <span class="text-slate-500 block text-[9px] font-sans">Rate</span>
                            <span class="text-slate-200">$${item.price_per_gram}/g</span>
                        </div>
                        <div>
                            <span class="text-slate-500 block text-[9px] font-sans">Total</span>
                            <span class="text-amber-400 font-bold">$${item.total_price.toFixed(2)}</span>
                        </div>
                    </div>
                `;
    container.appendChild(itemCard);
  });

  document.getElementById('summaryTotalWeight').textContent = `${totalWeight.toFixed(2)} g`;
  document.getElementById('summaryGrandTotal').textContent = `$${grandTotal.toFixed(2)}`;
  document.getElementById('itemsCountBadge').textContent = `${ticket.items.length} items`;
}

// Live Calculation
function calculateItemTotal() {
  const weight = parseFloat(document.getElementById('itemWeight').value) || 0;
  const pricePerGram = parseFloat(document.getElementById('itemPricePerGram').value) || 0;
  const total = weight * pricePerGram;
  document.getElementById('itemTotalPrice').value = total.toFixed(2);
}

function applyCaratPreset(caratVal) {
  if (!caratVal) return;
  document.getElementById('itemCarat').value = caratVal;

  // Auto suggest price multiplier based on standard spot gold ($80/g 24K base)
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
  const pricePerGram = parseFloat(document.getElementById('itemPricePerGram').value) || 0;
  const totalPrice = parseFloat(document.getElementById('itemTotalPrice').value) || 0;

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

// Render Customer Presentation View
function renderCustomerPresentation() {
  const ticket = getActiveTicket();
  if (!ticket) return;

  document.getElementById('reportBranchAddress').textContent = `${ticket.branch} • ${ticket.counter}`;
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
    itemEl.className = "bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4";

    itemEl.innerHTML = `
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                            <span class="text-xs text-amber-400 font-mono font-bold uppercase">Item #${index + 1}</span>
                            <h4 class="text-base font-bold text-slate-100">${item.title}</h4>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-slate-400 block">Subtotal Valuation</span>
                            <span class="text-lg font-mono font-bold text-amber-400">$${item.total_price.toFixed(2)}</span>
                        </div>
                    </div>

                    <!-- 3 Side-by-side device verification photos -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="space-y-1">
                            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block"><i class="fa-solid fa-camera text-amber-400 mr-1"></i> Jewelry Photo</span>
                            <img src="${item.photo}" class="w-full h-32 object-cover rounded-xl border border-slate-800 bg-slate-900">
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block"><i class="fa-solid fa-weight-scale text-amber-400 mr-1"></i> Scale Reading</span>
                            <img src="${item.weighing_photo}" class="w-full h-32 object-cover rounded-xl border border-slate-800 bg-slate-900">
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block"><i class="fa-solid fa-atom text-amber-400 mr-1"></i> XRF Spectrometry</span>
                            <img src="${item.xrf_photo}" class="w-full h-32 object-cover rounded-xl border border-slate-800 bg-slate-900">
                        </div>
                    </div>

                    <!-- Metrics Table Row -->
                    <div class="grid grid-cols-3 gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800/60 font-mono text-center text-xs">
                        <div>
                            <span class="text-slate-500 text-[10px] uppercase font-sans block">Measured Weight</span>
                            <span class="text-slate-200 font-bold">${item.weight} grams</span>
                        </div>
                        <div>
                            <span class="text-slate-500 text-[10px] uppercase font-sans block">Assayed Carat</span>
                            <span class="text-amber-300 font-bold">${item.carat}K</span>
                        </div>
                        <div>
                            <span class="text-slate-500 text-[10px] uppercase font-sans block">Assigned Rate</span>
                            <span class="text-slate-200 font-bold">$${item.price_per_gram} / g</span>
                        </div>
                    </div>
                `;
    listContainer.appendChild(itemEl);
  });

  document.getElementById('reportGrandTotal').textContent = `$${grandTotal.toFixed(2)}`;
  document.getElementById('reportItemCountSummary').textContent = `(${ticket.items.length} items assessed)`;

  const sigDisplay = document.getElementById('signatureDisplay');
  if (ticket.signature) {
    sigDisplay.innerHTML = `<img src="${ticket.signature}" class="h-full object-contain">`;
  } else {
    sigDisplay.innerHTML = `<span class="text-xs text-slate-600 italic">Pending Signature</span>`;
  }
}

// Database Table & C++ Struct Inspector
function renderDatabaseTable() {
  const tbody = document.getElementById('databaseTableBody');
  tbody.innerHTML = '';

  ticketsData.forEach(ticket => {
    const totalValue = ticket.items.reduce((sum, item) => sum + item.total_price, 0);

    const tr = document.createElement('tr');
    tr.className = "hover:bg-slate-800/40 transition";
    tr.innerHTML = `
                    <td class="p-3 font-bold text-amber-400">${ticket.customer_queue_number}</td>
                    <td class="p-3 font-sans text-slate-100 font-semibold">${ticket.customer_name}</td>
                    <td class="p-3 font-sans text-slate-400 text-[11px]">${ticket.branch} (${ticket.counter})</td>
                    <td class="p-3 font-sans text-slate-300">${ticket.staff_name}</td>
                    <td class="p-3 text-slate-400">${ticket.date}</td>
                    <td class="p-3 text-slate-300">${ticket.items.length} pcs</td>
                    <td class="p-3 text-amber-300 font-bold">$${totalValue.toFixed(2)}</td>
                    <td class="p-3 text-right">
                        <button onclick="selectAndWorkOnTicket('${ticket.id}')" class="px-2.5 py-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded text-[11px] font-sans transition">
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

// Modal Handlers
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

  const newTicket = {
    id: `ticket-${Date.now()}`,
    branch: document.getElementById('stationBranch').value,
    counter: document.getElementById('stationCounter').value,
    staff_name: document.getElementById('stationStaff').value,
    customer_name: cName,
    customer_queue_number: qNo,
    date: document.getElementById('stationDate').value,
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

function deleteTicket(ticketId) {
  if (ticketsData.length <= 1) {
    showToast("Cannot delete the only remaining queue ticket.");
    return;
  }
  ticketsData = ticketsData.filter(t => t.id !== ticketId);
  if (activeTicketId === ticketId) {
    activeTicketId = ticketsData[0].id;
    loadActiveTicket(activeTicketId);
  }
  renderQueueGrid();
  showToast("Queue ticket removed.");
}

// Digital Signature Canvas
let sigCanvas, sigCtx, isSigning = false;

function initSignatureCanvas() {
  sigCanvas = document.getElementById('signatureCanvas');
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext('2d');

  sigCtx.strokeStyle = "#fbbf24";
  sigCtx.lineWidth = 3;
  sigCtx.lineCap = "round";

  sigCanvas.addEventListener('mousedown', startSig);
  sigCanvas.addEventListener('mousemove', drawSig);
  sigCanvas.addEventListener('mouseup', stopSig);

  sigCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); startSig(e.touches[0]); });
  sigCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); drawSig(e.touches[0]); });
  sigCanvas.addEventListener('touchend', stopSig);
}

function startSig(e) {
  isSigning = true;
  const rect = sigCanvas.getBoundingClientRect();
  sigCtx.beginPath();
  sigCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function drawSig(e) {
  if (!isSigning) return;
  const rect = sigCanvas.getBoundingClientRect();
  sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  sigCtx.stroke();
}

function stopSig() {
  isSigning = false;
}

function clearSignatureCanvas() {
  sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
}

function openSignatureModal() {
  document.getElementById('signatureModal').classList.remove('hidden');
  clearSignatureCanvas();
}

function closeSignatureModal() {
  document.getElementById('signatureModal').classList.add('hidden');
}

function saveSignature() {
  const ticket = getActiveTicket();
  if (ticket) {
    ticket.signature = sigCanvas.toDataURL();
    ticket.status = "Completed";
    renderCustomerPresentation();
    renderQueueGrid();
    showToast("Customer signature saved! Valuation trade completed.");
  }
  closeSignatureModal();
}

// Custom Toast Dialog
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = "bg-slate-900 border border-amber-500/40 text-slate-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto";
  toast.innerHTML = `<i class="fa-solid fa-circle-check text-amber-400 text-sm"></i> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
