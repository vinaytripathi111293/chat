const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let users = {}; // Stores user connections
let messages = []; // Array to hold messages for offline users

// Serve static files like HTML, CSS, and JS
app.use(express.static('public'));

// Handle requests to root path
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Handle fruit input and user validation
app.post('/validateFruit', express.json(), (req, res) => {
    const { fruit, socketId } = req.body;

    if (fruit === 'xxxx') {
        users[socketId] = { user: 'userX', isValid: true };
        res.status(200).send({ message: 'Valid user: userX' });
    } else if (fruit === 'kam30bal') {
        users[socketId] = { user: 'userY', isValid: true };
        res.status(200).send({ message: 'Valid user: userY' });
    } else {
        users[socketId] = { user: 'invalid', isValid: false };
        res.status(200).send({ message: 'Invalid user' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Send previous messages for valid users
    socket.emit('previousMessages', messages);

    // Handle chat message
    socket.on('chatMessage', (msg) => {
        if (users[socket.id]?.isValid === true) {
            const timestamp = new Date().toLocaleString();
            const user = users[socket.id].user;
            const message = {id: Math.floor(Math.random() * 100000000), user, timestamp, message: msg };

            // Send message to all users in the chat
            io.emit('chatMessage', message);

            // Store message in the array for offline users
            messages.push(message);
        } else {
            const message = { user: 'userException', timestamp: new Date().toLocaleString(), message: msg };
            socket.emit('chatMessage', message);
        }
    });

    // Handle delete messages request
    socket.on('deleteMessages', (messageIds) => {
        // Filter out messages that are deleted
        messages = messages.filter(message => !messageIds.includes(message.id.toString()));

        // Broadcast the updated message list
        io.emit('previousMessages', messages);
    });

    // Disconnect event
    socket.on('disconnect', () => {
        console.log('A user disconnected: ' + socket.id);
        delete users[socket.id];
    });
});

// Start server on port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
