function generateRoomCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function updateRoomCount(io, roomCode) {
  const room = io.sockets.adapter.rooms.get(roomCode);
  const count = room ? room.size : 0;

  if (count === 0) {
    console.log(`❌ Room ${roomCode} closed (empty).`);
  } else {
    io.to(roomCode).emit("roomCount", count);
  }
}

function emitPlayerList(io, roomCode) {
  const room = io.sockets.adapter.rooms.get(roomCode);
  if (!room) return;

  const players = [];
  room.forEach((socketId) => {
    const s = io.sockets.sockets.get(socketId);
    if (s?.data.username) {
      players.push({
        username: s.data.username,
        isAdmin: s.data.isAdmin || false,
      });
    }
  });

  io.to(roomCode).emit("updatePlayers", players);
}

module.exports = {
  generateRoomCode,
  updateRoomCount,
  emitPlayerList,
};
