const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users')


const app = express();

const server = http.createServer(app);
const io = socketio(server);
const botName = 'ChatBot';

// Run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room)

        socket.join(user.room);

        // Welcome current User
        socket.emit('message', formatMessage(botName, 'Welcome to ChatCord'))
    
        // Broadcast when a user connect
        socket.broadcast
                .to(user.room)
                .emit('message', 
                formatMessage(botName,`${user.username} has joined the chat`));
    
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    
    })


    // Listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        // Emit the message back to everyone to see
        io.to(user.room).emit('message', formatMessage(user.username,msg))
    })

    // Runs when clients disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`))
            
            
            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }

    })

})

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))