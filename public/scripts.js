const socket = io();

// Gestionar eventos de la interfaz
document.getElementById("join-room").addEventListener("click", () => {
  const room = document.getElementById("room-input").value;
  const username = prompt("What's your name?");
  socket.emit("joinRoom", { username, room });
});

document.getElementById("send-message").addEventListener("click", () => {
  const message = document.getElementById("message-input").value;
  socket.emit("chatMessage", message);
  document.getElementById("message-input").value = "";
});

// Escuchar mensajes del servidor
socket.on("message", (message) => {
  const li = document.createElement("li");
  li.innerText = `${message.user}: ${message.text}`;
  document.getElementById("message-list").appendChild(li);
});

// Cargar historial de mensajes
socket.on("history", (messages) => {
  const messageList = document.getElementById("message-list");
  messageList.innerHTML = ""; // Limpiar historial anterior
  messages.forEach((message) => {
    const li = document.createElement("li");
    li.innerText = `${message.user}: ${message.text}`;
    messageList.appendChild(li);
  });
});
