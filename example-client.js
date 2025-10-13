/**
 * Example Socket.IO client for Impostor Game Backend
 * 
 * This file demonstrates how to connect to the backend service
 * and interact with the game server using Socket.IO events.
 * 
 * Usage:
 * 1. Install socket.io-client: npm install socket.io-client
 * 2. Ensure the server is running: npm start
 * 3. Run this client: node example-client.js
 */

const io = require('socket.io-client');

// Connect to the server
const socket = io('http://localhost:3000');

console.log('Attempting to connect to server...\n');

// Handle connection
socket.on('connect', () => {
  console.log('✓ Connected to server');
  console.log(`  Socket ID: ${socket.id}\n`);
  
  // Register as a player
  socket.emit('register', { name: 'ExamplePlayer' });
});

// Handle player registration
socket.on('registered', (data) => {
  console.log('✓ Player registered successfully');
  console.log(`  Player ID: ${data.id}`);
  console.log(`  Player Name: ${data.name}\n`);
  
  // Create a new game
  socket.emit('createGame', {});
});

// Handle game creation
socket.on('gameCreated', (game) => {
  console.log('✓ Game created successfully');
  console.log(`  Game ID: ${game.id}`);
  console.log(`  Host: ${game.host}`);
  console.log(`  Status: ${game.status}`);
  console.log(`  Players: ${game.players.length}\n`);
  
  // Get list of all games
  socket.emit('getGames');
});

// Handle games list
socket.on('gamesList', (games) => {
  console.log('✓ Available games:');
  if (games.length === 0) {
    console.log('  No games available\n');
  } else {
    games.forEach((game, index) => {
      console.log(`  ${index + 1}. Game ${game.id}`);
      console.log(`     Players: ${game.players}`);
      console.log(`     Status: ${game.status}`);
    });
    console.log('');
  }
  
  // Send a message in the game
  socket.emit('gameMessage', { message: 'Hello everyone!' });
});

// Handle incoming messages
socket.on('message', (data) => {
  console.log('✓ Message received:');
  console.log(`  From: ${data.playerName} (${data.playerId})`);
  console.log(`  Message: ${data.message}`);
  console.log(`  Time: ${data.timestamp}\n`);
  
  // Demonstrate leaving the game
  console.log('Leaving the game...');
  socket.emit('leaveGame');
  
  // Disconnect after a short delay
  setTimeout(() => {
    console.log('Disconnecting from server...\n');
    socket.disconnect();
  }, 1000);
});

// Handle other players joining
socket.on('playerJoined', (data) => {
  console.log('✓ Another player joined:');
  console.log(`  Player ID: ${data.playerId}`);
  console.log(`  Player Name: ${data.playerName}`);
  console.log(`  Total players: ${data.totalPlayers}\n`);
});

// Handle players leaving
socket.on('playerLeft', (data) => {
  console.log('✓ Player left:');
  console.log(`  Player ID: ${data.playerId}`);
  console.log(`  Remaining players: ${data.totalPlayers}\n`);
});

// Handle game start
socket.on('gameStarted', (game) => {
  console.log('✓ Game started!');
  console.log(`  Game ID: ${game.id}`);
  console.log(`  Status: ${game.status}\n`);
});

// Handle errors
socket.on('error', (error) => {
  console.error('✗ Error:', error.message);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
  process.exit(0);
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  console.error('Make sure the server is running on http://localhost:3000');
  process.exit(1);
});
