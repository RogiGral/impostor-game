# Backend Architecture

## Overview

This backend service is built using Node.js, Express, and Socket.IO to provide real-time multiplayer game functionality for the Impostor Game.

## Technology Stack

- **Node.js**: Runtime environment
- **Express**: HTTP server and REST API framework
- **Socket.IO**: WebSocket library for real-time bidirectional communication
- **CORS**: Cross-Origin Resource Sharing middleware

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│  (Web Browsers, Mobile Apps, Game Clients)             │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────┴────────────────────────────────────────┐
│                   Express Server                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  REST API Endpoints                              │  │
│  │  - GET /        (Server Status)                  │  │
│  │  - GET /health  (Health Check)                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                 Socket.IO Server                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Event Handlers                                  │  │
│  │  - connection      (Player connects)             │  │
│  │  - register        (Player registration)         │  │
│  │  - createGame      (Create game room)            │  │
│  │  - joinGame        (Join game room)              │  │
│  │  - startGame       (Start game)                  │  │
│  │  - leaveGame       (Leave game)                  │  │
│  │  - gameMessage     (Send message)                │  │
│  │  - getGames        (List games)                  │  │
│  │  - disconnect      (Player disconnects)          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                   Data Layer                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │  In-Memory Storage                               │  │
│  │  - games Map      (Active game rooms)            │  │
│  │  - players Map    (Connected players)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Models

### Player Model
```javascript
{
  id: String,        // Socket ID
  name: String,      // Player name
  gameId: String     // Current game ID (null if not in game)
}
```

### Game Model
```javascript
{
  id: String,        // Unique game identifier
  host: String,      // Socket ID of the host
  players: Array,    // Array of player socket IDs
  status: String,    // 'waiting' or 'playing'
  createdAt: Date    // Game creation timestamp
}
```

## Event Flow

### Creating a Game
1. Client connects to server
2. Client sends `register` event with player name
3. Server responds with `registered` event
4. Client sends `createGame` event
5. Server creates game room and responds with `gameCreated` event
6. Game is now in 'waiting' status

### Joining a Game
1. Client is registered (same as above)
2. Client sends `getGames` to get available games
3. Server responds with `gamesList`
4. Client sends `joinGame` with gameId
5. Server adds player to game and responds with `joinedGame`
6. All players in game receive `playerJoined` event

### Starting a Game
1. Host sends `startGame` event
2. Server validates host permission
3. Game status changes to 'playing'
4. All players receive `gameStarted` event

### Disconnection Handling
1. Player disconnects (intentionally or connection lost)
2. Server receives `disconnect` event
3. Server removes player from game
4. Other players receive `playerLeft` event
5. If host leaves, new host is assigned or game is deleted

## Game Room Management

### Room Features
- Each game has a unique ID generated with timestamp
- Players join Socket.IO rooms matching the game ID
- Messages are broadcast only to players in the same room
- Automatic cleanup when all players leave

### Host Privileges
- Only the host can start the game
- If host leaves, the first remaining player becomes the new host
- If no players remain, the game is automatically deleted

## Security Considerations

### Current Implementation
- CORS is open to all origins (for development)
- No authentication required
- In-memory storage (data lost on restart)

### Recommended Production Enhancements
- Implement authentication (JWT tokens)
- Restrict CORS to specific origins
- Add rate limiting
- Add input validation and sanitization
- Use persistent database (MongoDB, PostgreSQL)
- Implement session management
- Add logging and monitoring

## Scalability Considerations

### Current Limitations
- Single server instance
- In-memory storage
- No horizontal scaling

### Scaling Options
1. **Redis Adapter**: Use Socket.IO Redis adapter for multiple server instances
2. **Database**: Replace in-memory storage with persistent database
3. **Load Balancer**: Use sticky sessions or shared storage
4. **Microservices**: Split into separate services (game logic, matchmaking, chat)

## Performance Optimizations

### Current Optimizations
- Event-driven architecture (non-blocking)
- Efficient Map data structures
- Room-based message broadcasting

### Future Optimizations
- Implement connection pooling
- Add caching layer (Redis)
- Optimize message payload sizes
- Implement message queuing for high traffic

## Testing

### Manual Testing
Use the provided `example-client.js` to test all functionality:
```bash
npm start            # In terminal 1
node example-client.js  # In terminal 2
```

### Integration Testing
- Connect multiple clients simultaneously
- Test game creation and joining
- Test message broadcasting
- Test disconnection scenarios
- Test host transfer

## Monitoring and Debugging

### Server Logs
The server logs the following events:
- Player connections/disconnections
- Game creation/deletion
- Player registration
- Game joining/leaving

### Debugging Tips
1. Check server logs for connection issues
2. Use browser developer tools for client-side debugging
3. Monitor network tab for WebSocket messages
4. Use Socket.IO debug mode: `DEBUG=socket.io* node server.js`

## Future Enhancements

### Game Logic
- Implement impostor assignment
- Add voting system
- Implement tasks and objectives
- Add in-game chat rooms
- Implement game rounds

### Features
- Persistent user accounts
- Game history and statistics
- Leaderboards
- Custom game settings
- Private/public games
- Spectator mode

### Technical Improvements
- Add TypeScript support
- Implement comprehensive testing
- Add CI/CD pipeline
- Add Docker support
- Add API documentation (Swagger/OpenAPI)
