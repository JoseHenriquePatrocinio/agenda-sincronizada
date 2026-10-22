window.socket.on("user:deactivated", () => {
  window.socket.disconnect();
  window.location.replace("/login.html?reason=deactivated");
});