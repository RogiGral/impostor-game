const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/client.html"));
});

function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on("connection", (socket) => {
  function updateRoomCount(roomCode) {
    const room = io.sockets.adapter.rooms.get(roomCode);
    const count = room ? room.size : 0;

    if (count === 0) {
      console.log(`❌ Room ${roomCode} closed (empty).`);
    } else {
      io.to(roomCode).emit("roomCount", count);
    }
  }

  function emitPlayerList(roomCode) {
    const room = io.sockets.adapter.rooms.get(roomCode);
    if (!room) return;

    const players = [];
    room.forEach((socketId) => {
      const s = io.sockets.sockets.get(socketId);
      if (s?.data.username) players.push(s.data.username);
    });

    io.to(roomCode).emit("updatePlayers", players);
  }

  socket.on("createRoom", (username) => {
    const roomCode = generateRoomCode();
    socket.join(roomCode);
    socket.data.room = roomCode;
    socket.data.username = username;
    socket.emit("roomCreated", roomCode);
    updateRoomCount(roomCode);
    emitPlayerList(roomCode);
  });

  socket.on("joinRoom", ({ room, username }) => {
    const roomExists = io.sockets.adapter.rooms.get(room);
    if (!roomExists) {
      socket.emit("errorMessage", "Room does not exist.");
      return;
    }

    socket.join(room);
    socket.data.room = room;
    socket.data.username = username;
    socket.to(room).emit("userJoined", `${username} joined the room.`);
    socket.emit("roomJoined", room);

    updateRoomCount(room);
    emitPlayerList(room);
  });

  socket.on("disconnectRoom", () => {
    const roomCode = socket.data.room;

    if (!roomCode) {
      socket.emit("errorMessage", "You are not in any room.");
      return;
    }

    socket.leave(roomCode);
    socket.to(roomCode).emit("userLeft", `User ${socket.id} left the room.`);

    socket.data.room = null;

    updateRoomCount(roomCode);
    emitPlayerList(roomCode);
    socket.emit("leftRoom", roomCode);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.room;
    if (roomCode) {
      socket.to(roomCode).emit("userLeft", `User ${socket.id} disconnected.`);
      setTimeout(() => updateRoomCount(roomCode), 100);
      emitPlayerList(roomCode);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {});
