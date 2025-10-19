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

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function loadWordsFromFile() {
  const fs = require("fs");
  const data = fs.readFileSync("src/words.json", "utf-8");
  const words = JSON.parse(data);
  return { words };
}

function getRandomWordAndHint() {
  const { words } = loadWordsFromFile();
  const index = Math.floor(Math.random() * words.length);
  const secret = words[index].word;
  const hint = words[index].hint;
  return { secret, hint };
}

function startNewRound(io, roomCode, players, gameState) {
  if (!gameState[roomCode]) gameState[roomCode] = { players: [], round: 0 };
  gameState[roomCode].round += 1;
  gameState[roomCode].players = players.map((p) => p.data.username);

  const { secret, hint } = getRandomWordAndHint();
  const impostorSocket = getRandomElement(players);
  gameState[roomCode].impostor = impostorSocket.id;

  players.forEach((p) => {
    p.emit("gameStarted", {
      role: p.id === impostorSocket.id ? "impostor" : "citizen",
      secretWord: p.id === impostorSocket.id ? hint : secret,
      admin: p.data.isAdmin,
    });
  });

  const firstSpeaker = getRandomElement(players);
  io.to(roomCode).emit("newRound", {
    round: gameState[roomCode].round,
    firstSpeaker: firstSpeaker.data.username,
  });
}

module.exports = {
  generateRoomCode,
  updateRoomCount,
  emitPlayerList,
  startNewRound,
};
