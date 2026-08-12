// ==================== CORE APP DATA STATE ====================
let ticketsData = [
  // {
  //   id: "ticket-101",
  //   branch: "Jakarta Barat",
  //   counter: "Counter #01",
  //   staff_name: "Alex Rivera (Appraiser)",
  //   customer_name: "Eleanor Vance",
  //   customer_queue_number: "Q-001",
  //   date: new Date().toISOString().split('T')[0],
  //   status: "In Measurement",
  //   signature: null,
  //   items: [
  //     {
  //       id: "item-1",
  //       title: "18K Gold Diamond Ring",
  //       photo: SAMPLE_IMAGES.jewelry,
  //       weighing_photo: SAMPLE_IMAGES.scale,
  //       xrf_photo: SAMPLE_IMAGES.xrf,
  //       weight: 12.45,
  //       carat: 18.0,
  //       price_per_gram: 62.50,
  //       total_price: 778.13
  //     },
  //     {
  //       id: "item-2",
  //       title: "22K Solid Gold Bangle",
  //       photo: SAMPLE_IMAGES.jewelry,
  //       weighing_photo: SAMPLE_IMAGES.scale,
  //       xrf_photo: SAMPLE_IMAGES.xrf,
  //       weight: 24.10,
  //       carat: 22.0,
  //       price_per_gram: 76.20,
  //       total_price: 1836.42
  //     }
  //   ]
  // },
  // {
  //   id: "ticket-102",
  //   branch: "Jakarta Barat",
  //   counter: "Counter #02",
  //   staff_name: "Sarah Chen",
  //   customer_name: "Marcus Brody",
  //   customer_queue_number: "Q-002",
  //   date: new Date().toISOString().split('T')[0],
  //   status: "Ready for Customer",
  //   signature: null,
  //   items: [
  //     {
  //       id: "item-3",
  //       title: "14K Gold Chain Necklace",
  //       photo: SAMPLE_IMAGES.jewelry,
  //       weighing_photo: SAMPLE_IMAGES.scale,
  //       xrf_photo: SAMPLE_IMAGES.xrf,
  //       weight: 18.50,
  //       carat: 14.0,
  //       price_per_gram: 48.00,
  //       total_price: 888.00
  //     }
  //   ]
  // }
];
let remoteName;

let stateWebSocket;
let shouldReconnect = true;

const APPRAISER_SESSION_KEY = 'ile_appraiser_session';

let currentAppraiser = {
  branch: '',
  counter: '',
  name: '',
  date: new Date().toISOString().split('T')[0]
};

function connectStateWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  stateWebSocket = new WebSocket(
    `${protocol}//${window.location.host}/ws/state` +
    `?office=${encodeURIComponent(currentAppraiser.branch)}` +
    `&counter=${encodeURIComponent(currentAppraiser.counter)}` +
    `&date=${encodeURIComponent(currentAppraiser.date)}`
  );

  stateWebSocket.onopen = () => {
    console.log("Connected to /ws/state");
  };

  stateWebSocket.onmessage = (event) => {
    console.log("Got message from /ws/state");

    const len = ticketsData.length;

    const broadcastData = JSON.parse(event.data);
    ticketsData = broadcastData.ticketsData;
    remoteName = broadcastData.remoteName;

    if (ticketsData.length > len) {
      activeTicketId = ticketsData[0].id;

      closeNewCustomerModal();
      loadActiveTicket();
      switchTab('measurementTab');
      // showToast(`Created Queue Ticket ${qNo} for ${cName}`);
    }

    renderActiveTicketItems();
    renderQueueGrid();
  };

  stateWebSocket.onclose = () => {
    console.log("Disconnected from /ws/state");

    if (shouldReconnect) {
      setTimeout(connectStateWebSocket, 1000);
    }
  };

  stateWebSocket.onerror = (error) => {
    console.error("WebSocket error:", error);
    stateWebSocket.close();
  };
}

function disconnectStateWebSocket() {
  shouldReconnect = false;

  if (stateWebSocket) {
    stateWebSocket.close();
    stateWebSocket = null;
  }
}

let activeTicketId;

// Current Form Image State (Base64 / Data URIs)
let currentPhoto1 = "";
let currentPhoto2 = "";
let currentPhoto3 = "";

function getActiveTicket() {
  return ticketsData.find(t => t.id === activeTicketId);
}
