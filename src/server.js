const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ✅ Helper: Generate random 4-digit room codes
function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on("connection", (socket) => {
  console.log("🟢 A user connected:", socket.id);

  // ✅ Helper: Count and emit number of users in a room
  function updateRoomCount(roomCode) {
    const room = io.sockets.adapter.rooms.get(roomCode);
    const count = room ? room.size : 0;

    if (count === 0) {
      console.log(`❌ Room ${roomCode} closed (empty).`);
      io.emit("roomClosed", roomCode);
    } else {
      io.to(roomCode).emit("roomCount", count);
    }
  }

  // ✅ Create a new room with a random 4-digit code
  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();

    // Check if the generated room already exists (rare)
    if (io.sockets.adapter.rooms.has(roomCode)) {
      socket.emit("errorMessage", "Room code conflict, please try again.");
      return;
    }

    socket.join(roomCode);
    socket.data.room = roomCode;

    console.log(`🆕 Socket ${socket.id} created room ${roomCode}`);
    socket.emit("roomCreated", roomCode);
    updateRoomCount(roomCode);
  });

  // ✅ Join existing room
  socket.on("joinRoom", (roomCode) => {
    if (!roomCode) {
      socket.emit("errorMessage", "Please enter a room code.");
      return;
    }

    const room = io.sockets.adapter.rooms.get(roomCode);
    if (!room) {
      socket.emit("errorMessage", "Room does not exist.");
      return;
    }

    socket.join(roomCode);
    socket.data.room = roomCode;

    console.log(`👤 Socket ${socket.id} joined room ${roomCode}`);

    // Notify others
    socket
      .to(roomCode)
      .emit("userJoined", `User ${socket.id} joined the room.`);
    socket.emit("roomJoined", roomCode);

    updateRoomCount(roomCode);
  });

  // ✅ Leave room manually
  socket.on("disconnectRoom", () => {
    const roomCode = socket.data.room;

    if (!roomCode) {
      socket.emit("errorMessage", "You are not in any room.");
      return;
    }

    socket.leave(roomCode);
    console.log(`🚪 Socket ${socket.id} left room ${roomCode}`);
    socket.to(roomCode).emit("userLeft", `User ${socket.id} left the room.`);

    socket.data.room = null;

    updateRoomCount(roomCode);
    socket.emit("leftRoom", roomCode);
  });

  // ✅ When user disconnects (browser closed or connection lost)
  socket.on("disconnect", () => {
    const roomCode = socket.data.room;

    if (roomCode) {
      console.log(`🔴 User ${socket.id} disconnected from room ${roomCode}`);
      socket.to(roomCode).emit("userLeft", `User ${socket.id} disconnected.`);

      // Allow time for socket.io to process the disconnection
      setTimeout(() => updateRoomCount(roomCode), 100);
    } else {
      console.log(`User ${socket.id} disconnected (not in room).`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
