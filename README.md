# Impostor Game - Backend Service

A real-time multiplayer game backend service built with Node.js, Express, and Socket.IO.

## Features

- **Real-time Communication**: Built with Socket.IO for instant bidirectional communication
- **Game Room Management**: Create and join game rooms with multiple players
- **Player Management**: Register players, track connections, and handle disconnections
- **Event-driven Architecture**: Comprehensive event handling for all game actions
- **RESTful API**: Health check and status endpoints
- **CORS Support**: Configurable CORS for cross-origin requests

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/RogiGral/impostor-game.git
cd impostor-game
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration (optional):
```bash
cp .env.example .env
```

## Usage

### Start the server

```bash
npm start
```

The server will start on port 3000 by default (or the port specified in the PORT environment variable).

### Development mode

```bash
npm run dev
```

## API Endpoints

### REST API

- `GET /` - Server status and statistics
- `GET /health` - Health check endpoint

### Socket.IO Events

#### Client to Server Events

- `register` - Register a player
  ```javascript
  socket.emit('register', { name: 'PlayerName' });
  ```

- `createGame` - Create a new game room
  ```javascript
  socket.emit('createGame', {});
  ```

- `joinGame` - Join an existing game room
  ```javascript
  socket.emit('joinGame', { gameId: 'game_123' });
  ```

- `startGame` - Start the game (host only)
  ```javascript
  socket.emit('startGame', { gameId: 'game_123' });
  ```

- `leaveGame` - Leave the current game
  ```javascript
  socket.emit('leaveGame');
  ```

- `gameMessage` - Send a message to all players in the game
  ```javascript
  socket.emit('gameMessage', { message: 'Hello!' });
  ```

- `getGames` - Get list of available games
  ```javascript
  socket.emit('getGames');
  ```

#### Server to Client Events

- `registered` - Player registration confirmed
- `gameCreated` - Game room created successfully
- `joinedGame` - Successfully joined a game
- `playerJoined` - Another player joined the game
- `gameStarted` - Game has started
- `playerLeft` - A player left the game
- `newHost` - New host assigned when previous host left
- `message` - Message from another player
- `gamesList` - List of available games
- `error` - Error message

## Example Client Usage

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000');

// Register player
socket.emit('register', { name: 'John' });

socket.on('registered', (data) => {
  console.log('Registered:', data);
  
  // Create a game
  socket.emit('createGame', {});
});

socket.on('gameCreated', (game) => {
  console.log('Game created:', game);
});

socket.on('playerJoined', (data) => {
  console.log('Player joined:', data);
});
```

## Configuration

The server can be configured using environment variables:

- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origins (default: *)

## Architecture

The backend service uses:
- **Express**: HTTP server and REST API endpoints
- **Socket.IO**: WebSocket-based real-time communication
- **In-memory storage**: Game state and player data (can be extended with database)

## Future Enhancements

- Database integration for persistent game history
- Authentication and user accounts
- Game logic implementation (impostor assignment, voting, etc.)
- Matchmaking system
- Game statistics and leaderboards

## License

ISC