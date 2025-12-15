const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const registerSocketHandlers = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/impostor-game/index.html")
  );
});

app.get("/awantura-o-kielicha", (req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/pages/awantura-o-kielicha/index.html")
  );
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
