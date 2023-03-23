const { Server } = require("socket.io");
const { NODE_ENV } = require('./config')

// if (NODE_ENV === 'test') return;

console.log("SETTING UP SOCKETS");

const io = (NODE_ENV === 'test') 
  ? {emit: () => {}, on: () => {}} 
  : new Server(3001,{
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
});

io.on('connection', (socket) => {
    console.log('a user connected');
});

module.exports = { io: io };
