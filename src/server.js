const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', (socket) => {

    socket.on('createRoom', (room) => {
        if (!room) return;

        const rooms = Array.from(io.sockets.adapter.rooms.keys());

        if (rooms.includes(room)) {
            socket.emit('errorMessage', 'Room already exists.');
        } else {
            socket.join(room);
            console.log(`Socket ${socket.id} created and joined room: ${room}`);
            socket.emit('roomCreated', room);
        }
    });

    socket.on('joinRoom', (room) => {
    const roomExists = io.sockets.adapter.rooms.has(room);

    if (roomExists) {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);
        socket.to(room).emit('userJoined', `A new user has joined the room: ${socket.id}`);
        socket.emit('roomJoined', room);
    } else {
        socket.emit('errorMessage', 'Room does not exist.');
    }
});

    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    // Add your custom event handlers here
    // socket.on('event', (data) => { ... });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
