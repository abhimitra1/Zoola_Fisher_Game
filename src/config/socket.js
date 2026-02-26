// ── WebSocket Config ─────────────────────────────────
// Real-time events pushed to Unity client
// Used for: Kingfisher attacks, TX confirmations

let io;

function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Unity sends userId to join their room
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`🐟 User ${userId} joined their room`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 WebSocket server ready");
  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

// ── Send event to specific user ──────────────────────
function sendToUser(userId, event, data) {
  if (!io) return;
  io.to(userId).emit(event, data);
}

module.exports = { initSocket, getIO, sendToUser };
