let stateWebSocket;
let shouldReconnect = true;
let firstConnect = true;

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

    ticketsData = JSON.parse(event.data);

    if (!firstConnect && ticketsData.length > len) {
      activeTicketId = ticketsData[0].id;

      closeNewTicketModal();
      loadActiveTicket();
      switchTab('measurementTab');
    }
    firstConnect = false;

    renderActiveTicketItems();
    renderQueueGrid();
    if (typeof showToast === 'function') {
      showToast(`Updated queue tickets`);
    }
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
