// ==================== CORE APP DATA STATE ====================
let ticketsData = [];
let offices = {}

let currentAppraiser = {
  branch: '',
  counter: '',
  name: '',
  date: new Date().toISOString().split('T')[0]
};

// Current Form Image State (Base64 / Data URIs)
let currentPhoto1 = "";
let currentPhoto2 = "";
let currentPhoto3 = "";

let activeTicketId;

function getActiveTicket() {
  return ticketsData.find(t => t.id === activeTicketId);
}
