const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

let isAdmin = false;
let currentRound = 0;

// DOM elements
const statusDiv = document.getElementById("status");
const gameStatusDiv = document.querySelector(".flip-card-front");
const clickGameStatusDiv = document.getElementById("clickGameStatus");

const checkbox = document.getElementById("btnControl");
const messagesDiv = document.getElementById("messages");
const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("roomName");
const createBtn = document.getElementById("createBtn");
const joinBtn = document.getElementById("joinBtn");
const leaveBtn = document.getElementById("leaveBtn");
const copyBtn = document.getElementById("copyBtn");
const userCount = document.getElementById("userCount");
const playerList = document.getElementById("playerList");
const startGameBtn = document.getElementById("startGameBtn");
const nextRoundBtn = document.getElementById("nextRoundBtn");

// --- UI HELPERS ---
function log(msg) {
  const p = document.createElement("p");
  p.innerText = msg;
  messagesDiv.appendChild(p);
}

function clearMessages() {
  messagesDiv.innerHTML = "";
}

function updateStatus(msg, isError = false) {
  statusDiv.innerText = isError ? `❌ ${msg}` : msg;
}

function updateGameStatus(msg) {
  gameStatusDiv.innerText = msg;
}

function showRoomControls(inRoom) {
  createBtn.style.display = inRoom ? "none" : "inline-block";
  joinBtn.style.display = inRoom ? "none" : "inline-block";
  copyBtn.style.display = inRoom ? "inline-block" : "none";
  leaveBtn.style.display = inRoom ? "inline-block" : "none";
  userCount.style.display = inRoom ? "inline-block" : "none";
  startGameBtn.style.display = inRoom ? "inline-block" : "none";
  gameStatusDiv.style.display = inRoom ? "block" : "none";

  usernameInput.disabled = inRoom;
  roomInput.disabled = inRoom;

  if (!inRoom) {
    userCount.innerText = "Użytkownicy: 0";
    roomInput.value = "";
  }
}

function updatePlayerList(players) {
  playerList.innerHTML = "";
  players.forEach((player) => {
    const li = document.createElement("li");
    li.innerText = player.isAdmin
      ? `${player.username} 👑 (Admin)`
      : player.username;
    playerList.appendChild(li);
  });
}

// --- SOCKET EVENTS ---
socket.on("connect", () => showRoomControls(false));

socket.on("roomCreated", (room) => {
  updateStatus(`Pokój "${room}" został utworzony. Podziel się tym kodem.`);
  roomInput.value = room;
  showRoomControls(true);
});

socket.on("roomJoined", (room) => {
  updateStatus(`Dołączyłeś do pokoju: "${room}".`);
  roomInput.value = room;
  showRoomControls(true);
});

socket.on("leftRoom", (room) => {
  document.querySelector(".flip-card").style.display = "none";
  updateStatus(`Opuszczono pokój: "${room}".`);
  clearMessages();
  updatePlayerList([]);
  showRoomControls(false);
});

socket.on("userJoined", log);
socket.on("userLeft", log);

socket.on("roomCount", (count) => {
  userCount.innerText = `Users: ${count}`;
});

socket.on("errorMessage", (msg) => updateStatus(msg, true));

socket.on("updatePlayers", updatePlayerList);

socket.on("gameStarted", async ({ role, secretWord, admin }) => {
  document.querySelector(".flip-card").style.display = "block";

  if ("wakeLock" in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock aktywny!");
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }

  clearMessages();
  isAdmin = admin;
  if (role === "impostor") {
    updateStatus("");
    updateGameStatus(`Jesteś IMPOSTOREM! Twoja podpowiedź to: ${secretWord}`);
  } else {
    updateStatus("");
    updateGameStatus(`Jesteś OBYWATELEM! Twoja hasło to: ${secretWord}`);
  }
  document.getElementById("controls").style.display = "none";
  if (isAdmin) {
    nextRoundBtn.style.display = "inline-block";
  }
});
socket.on("newRound", ({ round, firstSpeaker }) => {
  currentRound = round;
  log(`🌀 Runda ${round} rozpoczęta! 🎤 ${firstSpeaker} zaczyna.`);
});

socket.on("flipCard", () => {
  checkbox.checked = false;
});

socket.on("firstSpeaker", ({ username }) => {
  log(`🎤 ${username} zaczyna dyskusję!`);
});

socket.on("connect_error", (err) => {
  console.warn("Connection error:", err.message);
  updateStatus("🔄 Reconnecting…");
});

// --- BUTTON HANDLERS ---
createBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username)
    return updateStatus("Proszę najpierw wprowadzić swoje imię.", true);
  socket.emit("createRoom", username);
});

joinBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const room = roomInput.value.trim();
  if (!username)
    return updateStatus("Proszę najpierw wprowadzić swoje imię.", true);
  if (!room) return updateStatus("Proszę wprowadzić kod pokoju.", true);
  socket.emit("joinRoom", { room, username });
});

leaveBtn.addEventListener("click", () => socket.emit("disconnectRoom"));

copyBtn.addEventListener("click", async () => {
  const code = roomInput.value;
  await navigator.clipboard.writeText(code);
  updateStatus(`✅ Skopiowano kod: ${code}`);
});

startGameBtn.addEventListener("click", () => {
  socket.emit("startGame");
});
nextRoundBtn.addEventListener("click", () => {
  socket.emit("nextRound");
});

document.addEventListener("visibilitychange", () => {
  console.log("Visibility changed:", document.visibilityState);
  if (document.visibilityState === "visible" && !socket.connected) {
    socket.connect();
  }
});
