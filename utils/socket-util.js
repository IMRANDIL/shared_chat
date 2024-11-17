const { Server } = require('socket.io');

const initializeSocket = (server) => {
  const io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

// Utility to join a room
const joinRoom = (io, socket, roomId) => {
  socket.join(roomId);
  console.log(`Socket ${socket.id} joined room ${roomId}`);
};

// Utility to emit a message to a specific room
const emitToRoom = (io, roomId, event, data) => {
  io.to(roomId).emit(event, data);
  console.log(`Message sent to room ${roomId}:`, data);
};

// Utility to broadcast a message to all sockets except sender
const broadcast = (io, socket, event, data) => {
  socket.broadcast.emit(event, data);
  console.log(`Broadcast message from ${socket.id}:`, data);
};

module.exports = { initializeSocket, joinRoom, emitToRoom, broadcast };
