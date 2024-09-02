const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Serve static files from 'public' directory

const activeUsers = new Set();

io.on('connection', (socket) => {
    console.log('New user connected');

    // Handle joining a chat room
    socket.on('join', (username) => {
        if (activeUsers.has(username)) {
            socket.emit('error', 'Username already taken.');
        } else {
            socket.username = username;
            activeUsers.add(username);
            io.emit('userJoined', `${username} joined the chat`);
            console.log(`User joined: ${username}`);
        }
    });

    // Handle sending messages
    socket.on('message', (message) => {
        const messageData = { username: socket.username, text: message };
        io.emit('message', messageData);
        console.log('Emitting message:', messageData);
    });

    // Handle typing event
    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        if (socket.username) {
            activeUsers.delete(socket.username);
            io.emit('userLeft', `${socket.username} left the chat`);
            console.log(`User disconnected: ${socket.username}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
