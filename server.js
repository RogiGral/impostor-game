const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configure CORS for Express
app.use(cors());
app.use(express.json());

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Port configuration
const PORT = process.env.PORT || 3000;

// Game state management
const games = new Map();
const players = new Map();

// Basic Express route
app.get('/', (req, res) => {
  res.json({
    message: 'Impostor Game Backend Server',
    status: 'running',
    activeGames: games.size,
    activePlayers: players.size
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Register player
  socket.on('register', (data) => {
    const playerData = {
      id: socket.id,
      name: data.name || `Player_${socket.id.substring(0, 5)}`,
      gameId: null
    };
    players.set(socket.id, playerData);
    socket.emit('registered', playerData);
    console.log(`Player registered: ${playerData.name}`);
  });

  // Create game room
  socket.on('createGame', (data) => {
    const gameId = `game_${Date.now()}`;
    const game = {
      id: gameId,
      host: socket.id,
      players: [socket.id],
      status: 'waiting',
      createdAt: new Date()
    };
    
    games.set(gameId, game);
    socket.join(gameId);
    
    const player = players.get(socket.id);
    if (player) {
      player.gameId = gameId;
    }
    
    socket.emit('gameCreated', game);
    console.log(`Game created: ${gameId} by ${socket.id}`);
  });

  // Join game room
  socket.on('joinGame', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    if (game.status !== 'waiting') {
      socket.emit('error', { message: 'Game already started' });
      return;
    }
    
    game.players.push(socket.id);
    socket.join(gameId);
    
    const player = players.get(socket.id);
    if (player) {
      player.gameId = gameId;
    }
    
    socket.emit('joinedGame', game);
    io.to(gameId).emit('playerJoined', {
      playerId: socket.id,
      playerName: player?.name || 'Unknown',
      totalPlayers: game.players.length
    });
    
    console.log(`Player ${socket.id} joined game: ${gameId}`);
  });

  // Start game
  socket.on('startGame', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }
    
    if (game.host !== socket.id) {
      socket.emit('error', { message: 'Only host can start the game' });
      return;
    }
    
    game.status = 'playing';
    io.to(gameId).emit('gameStarted', game);
    console.log(`Game started: ${gameId}`);
  });

  // Leave game
  socket.on('leaveGame', () => {
    const player = players.get(socket.id);
    if (player && player.gameId) {
      const game = games.get(player.gameId);
      if (game) {
        game.players = game.players.filter(id => id !== socket.id);
        socket.leave(player.gameId);
        
        io.to(player.gameId).emit('playerLeft', {
          playerId: socket.id,
          totalPlayers: game.players.length
        });
        
        // If no players left, delete the game
        if (game.players.length === 0) {
          games.delete(player.gameId);
          console.log(`Game deleted: ${player.gameId}`);
        }
        
        player.gameId = null;
      }
    }
  });

  // Send game message
  socket.on('gameMessage', (data) => {
    const player = players.get(socket.id);
    if (player && player.gameId) {
      io.to(player.gameId).emit('message', {
        playerId: socket.id,
        playerName: player.name,
        message: data.message,
        timestamp: new Date()
      });
    }
  });

  // Get list of available games
  socket.on('getGames', () => {
    const availableGames = Array.from(games.values())
      .filter(game => game.status === 'waiting')
      .map(game => ({
        id: game.id,
        players: game.players.length,
        status: game.status
      }));
    
    socket.emit('gamesList', availableGames);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const player = players.get(socket.id);
    if (player && player.gameId) {
      const game = games.get(player.gameId);
      if (game) {
        game.players = game.players.filter(id => id !== socket.id);
        
        io.to(player.gameId).emit('playerLeft', {
          playerId: socket.id,
          totalPlayers: game.players.length
        });
        
        // If host left, assign new host or delete game
        if (game.host === socket.id) {
          if (game.players.length > 0) {
            game.host = game.players[0];
            io.to(player.gameId).emit('newHost', { hostId: game.host });
          } else {
            games.delete(player.gameId);
            console.log(`Game deleted: ${player.gameId}`);
          }
        }
      }
    }
    
    players.delete(socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
