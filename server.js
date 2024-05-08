const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// Crear el servidor Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {}; // Objeto para almacenar las salas
let users = {}; // Objeto para almacenar usuarios

// Servir archivos estáticos desde 'public'
app.use(express.static("public"));

// Manejar conexiones entrantes
io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado:", socket.id);

  // Unirse a una sala existente
  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    if (!rooms[room]) {
      rooms[room] = { admins: [], messages: [] };
    }

    if (!users[socket.id]) {
      users[socket.id] = { username, rooms: [] };
    }

    if (!users[socket.id].rooms.includes(room)) {
      users[socket.id].rooms.push(room);
    }

    const joinMessage = { user: "admin", text: `${username} se a unido!` };
    rooms[room].messages.push(joinMessage);

    socket.emit("history", rooms[room].messages); // Enviar historial
    io.to(room).emit("message", joinMessage);

    socket.username = username;
    socket.room = room;

    io.emit("updateRoomsList", Object.keys(rooms));
  });

  // Crear una nueva sala (convertir al creador en administrador)
  socket.on("createRoom", ({ username, room }) => {
    if (!rooms[room]) {
      rooms[room] = { admins: [username], messages: [] };
    }
    socket.join(room);

    if (!users[socket.id]) {
      users[socket.id] = { username, rooms: [] };
    }

    if (!users[socket.id].rooms.includes(room)) {
      users[socket.id].rooms.push(room);
    }

    const joinMessage = { user: "admin", text: `${username} se a unido!` };
    rooms[room].messages.push(joinMessage);

    socket.emit("history", rooms[room].messages);
    io.to(room).emit("message", joinMessage);

    socket.username = username;
    socket.room = room;

    io.emit("updateRoomsList", Object.keys(rooms));
  });

  // Eliminar mensajes en una sala
  socket.on("deleteMessage", ({ room, index }) => {
    const user = users[socket.id];
    if (user && rooms[room].admins.includes(user.username)) {
      rooms[room].messages.splice(index, 1);
      io.to(room).emit("history", rooms[room].messages); // Actualizar historial
    }
  });
  // Asignar nuevos administradores
  socket.on("assignAdmin", ({ room, username }) => {
    const user = users[socket.id];
    if (user && rooms[room].admins.includes(user.username)) {
      rooms[room].admins.push(username);
    }
  });
  // Manejar mensajes en el chat
  socket.on("chatMessage", (message) => {
    const room = socket.room;
    const username = socket.username;

    // Comprobar si el mensaje está vacío
    if (message.trim() !== "") {
      const chatMessage = { user: username, text: message };
      rooms[room].messages.push(chatMessage);
      io.to(room).emit("message", chatMessage);
    }
  });
  // Desconexión del cliente
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      user.rooms.forEach((room) => {
        io.to(room).emit("message", {
          user: "admin",
          text: `${user.username} has left the chat.`,
        });
      });
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log("Servidor en ejecución en el puerto 3000");
});
