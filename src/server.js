const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const registerSocketHandlers = require("./socket");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Serve client.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/client.html"));
});

// Register socket handlers
registerSocketHandlers(io);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
