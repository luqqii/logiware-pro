const pool = require('../database/pgClient');

function setupSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    // Token verification can be done here
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join org room
    socket.on('join:org', (orgId) => {
      socket.join(`org:${orgId}`);
      console.log(`Socket ${socket.id} joined org:${orgId}`);
    });

    // Inventory update broadcast
    socket.on('inventory:updated', (data) => {
      io.to(`org:${data.orgId}`).emit('inventory:change', data);
    });

    // Order status update broadcast
    socket.on('order:updated', (data) => {
      io.to(`org:${data.orgId}`).emit('order:change', data);
    });

    // Shipment status broadcast
    socket.on('shipment:updated', (data) => {
      io.to(`org:${data.orgId}`).emit('shipment:change', data);
    });

    // Alert broadcast
    socket.on('alert:new', (data) => {
      io.to(`org:${data.orgId}`).emit('alert:new', data);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Helper to emit to org
  global.emitToOrg = (orgId, event, data) => {
    io.to(`org:${orgId}`).emit(event, data);
  };
}

module.exports = setupSockets;
