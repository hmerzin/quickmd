var ws = new WebSocket('ws://localhost:8080');
ws.onclose = () => {
  location.reload();
};
