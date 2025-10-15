const {
  generateRoomCode,
  updateRoomCount,
  emitPlayerList,
} = require("./utils.js");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    socket.on("createRoom", (username) => {
      const roomCode = generateRoomCode();
      socket.join(roomCode);
      socket.data.room = roomCode;
      socket.data.username = username;
      socket.data.isAdmin = true;
      socket.emit("roomCreated", roomCode);
      updateRoomCount(io, roomCode);
      emitPlayerList(io, roomCode);
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
      socket.data.isAdmin = false;
      socket.to(room).emit("userJoined", `${username} joined the room.`);
      socket.emit("roomJoined", room);

      updateRoomCount(io, room);
      emitPlayerList(io, room);
    });

    socket.on("disconnectRoom", () => {
      const roomCode = socket.data.room;
      if (!roomCode) {
        socket.emit("errorMessage", "You are not in any room.");
        return;
      }

      socket.leave(roomCode);
      socket
        .to(roomCode)
        .emit("userLeft", `User ${socket.data.username} left the room.`);

      socket.data.room = null;
      updateRoomCount(io, roomCode);
      emitPlayerList(io, roomCode);
      socket.emit("leftRoom", roomCode);
    });

    socket.on("disconnect", () => {
      const roomCode = socket.data.room;
      if (roomCode) {
        socket
          .to(roomCode)
          .emit("userLeft", `${socket.data.username} disconnected.`);
        setTimeout(() => updateRoomCount(io, roomCode), 100);
        emitPlayerList(io, roomCode);
      }
    });

    let gameState = {};

    socket.on("startGame", () => {
      const roomCode = socket.data.room;
      if (!roomCode) return;
      if (!socket.data.isAdmin) {
        socket.emit("errorMessage", "Only the admin can start the game.");
        return;
      }

      const room = io.sockets.adapter.rooms.get(roomCode);
      if (!room || room.size < 3) {
        socket.emit(
          "errorMessage",
          "At least 3 players are required to start the game."
        );
        return;
      }

      const players = Array.from(room).map((id) => io.sockets.sockets.get(id));
      const impostorIndex = Math.floor(Math.random() * players.length);
      const impostorSocket = players[impostorIndex];
      const secretWord = "Banana"; // later randomize

      gameState[roomCode] = { round: 0, impostor: impostorSocket.id };

      players.forEach((p) => {
        p.emit("gameStarted", {
          role: p.id === impostorSocket.id ? "impostor" : "citizen",
          secretWord: p.id === impostorSocket.id ? null : secretWord,
          admin: p.data.isAdmin,
        });
      });

      const firstSpeaker = players[Math.floor(Math.random() * players.length)];
      gameState[roomCode].round = 1;
      io.to(roomCode).emit("newRound", {
        round: 1,
        firstSpeaker: firstSpeaker.data.username,
      });

      console.log(
        `🎮 Game started in ${roomCode}. Impostor: ${impostorSocket.data.username}`
      );
    });

    socket.on("nextRound", () => {
      const roomCode = socket.data.room;
      if (!roomCode || !socket.data.isAdmin) return;

      const room = io.sockets.adapter.rooms.get(roomCode);
      if (!room) return;

      const players = Array.from(room).map((id) => io.sockets.sockets.get(id));

      if (!gameState[roomCode]) gameState[roomCode] = { round: 0 };

      gameState[roomCode].round++;

      const nextRound = gameState[roomCode].round;

      const impostorIndex = Math.floor(Math.random() * players.length);
      const impostorSocket = players[impostorIndex];

      const words = ["Pizza", "Deszcz", "Samolot", "Ocean", "Góra", "Księżyc"];
      const hintWords = [
        "Jedzenie",
        "Pogoda",
        "Transport",
        "Woda",
        "Przyroda",
        "Kosmos",
      ];
      const number = Math.floor(Math.random() * words.length);
      const secretWord = words[number];
      const hintWord = hintWords[number];

      gameState[roomCode].impostor = impostorSocket.id;

      players.forEach((p) => {
        p.emit("gameStarted", {
          role: p.id === impostorSocket.id ? "impostor" : "citizen",
          secretWord: p.id === impostorSocket.id ? hintWord : secretWord,
          admin: p.data.isAdmin,
        });
      });

      const firstSpeaker = players[Math.floor(Math.random() * players.length)];

      io.to(roomCode).emit("newRound", {
        round: nextRound,
        firstSpeaker: firstSpeaker.data.username,
      });

      console.log(
        `🔁 New round ${nextRound} in room ${roomCode}. Impostor: ${impostorSocket.data.username}`
      );
    });
  });
}

module.exports = registerSocketHandlers;
