const socketIO = require('socket.io');

let io;

const setupSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: '*', // ili tvoja frontend domena
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};

module.exports = { setupSocket, getIO };
