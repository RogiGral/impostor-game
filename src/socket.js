const {
  generateRoomCode,
  updateRoomCount,
  emitPlayerList,
  startNewRound,
} = require("./utils.js");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`⚡ Nowy klient: ${socket.id}`);

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
        socket.emit("errorMessage", "Podany pokój nie istnieje.");
        return;
      }

      socket.join(room);
      socket.data.room = room;
      socket.data.username = username;
      socket.data.isAdmin = false;
      socket.to(room).emit("userJoined", `${username} dołączył/a do pokoju.`);
      socket.emit("roomJoined", room);

      updateRoomCount(io, room);
      emitPlayerList(io, room);
    });

    socket.on("disconnectRoom", () => {
      const roomCode = socket.data.room;
      if (!roomCode) {
        socket.emit("errorMessage", "Nie jesteś w żadnym pokoju.");
        return;
      }

      socket.leave(roomCode);
      socket
        .to(roomCode)
        .emit("userLeft", `Użytkownik ${socket.data.username} opuścił pokój.`);

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
          .emit("userLeft", `${socket.data.username} puścił pokój.`);
        setTimeout(() => updateRoomCount(io, roomCode), 100);
        emitPlayerList(io, roomCode);
      }
    });

    let gameState = {};

    socket.on("startGame", () => {
      const roomCode = socket.data.room;
      if (!roomCode) return;
      if (!socket.data.isAdmin) {
        return socket.emit(
          "errorMessage",
          "Tylko administrator może rozpocząć grę."
        );
      }

      const room = io.sockets.adapter.rooms.get(roomCode);
      if (!room || room.size < 1) {
        return socket.emit(
          "errorMessage",
          "Wymagane jest co najmniej 3 graczy."
        );
      }

      const players = Array.from(room).map((id) => io.sockets.sockets.get(id));
      startNewRound(io, roomCode, players, gameState);
    });

    socket.on("nextRound", () => {
      const roomCode = socket.data.room;
      if (!roomCode || !socket.data.isAdmin) return;

      const room = io.sockets.adapter.rooms.get(roomCode);
      if (!room) return;

      const players = Array.from(room).map((id) => io.sockets.sockets.get(id));
      startNewRound(io, roomCode, players, gameState);
    });
  });
}

module.exports = registerSocketHandlers;
