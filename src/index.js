const errorHandler = require("./middleware/errorHandler");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const { connectDB } = require("./config/db");
const { startTickWorker } = require("./workers/tickWorker");
const authRoutes = require("./routes/auth");
const gameRoutes = require("./routes/game");
const economyRoutes = require("./routes/economy");
const cosmeticsRoutes = require("./routes/cosmetics");
const { initSocket } = require("./config/socket");
const http = require("http");
const shopRoutes = require("./routes/shop");
const profileRoutes = require("./routes/profile");
const fishRoutes = require("./routes/fish");

const {
  generalLimiter,
  authLimiter,
  gameLimiter,
} = require("./middleware/rateLimit");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
// ── Rate Limiters ────────────────────────────────────
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1/game", gameLimiter);
app.use("/api/v1", generalLimiter);
// ── Routes ──────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/game", gameRoutes);
app.use("/api/v1/economy", economyRoutes);
app.use("/api/v1/cosmetics", cosmeticsRoutes);
app.use("/api/v1/shop", shopRoutes);
app.use("/api/v1/user", profileRoutes);
app.use("/api/v1/fish", fishRoutes);
// ── Global Error Handler ─────────────────────────────
app.use(errorHandler);
// ── Health Check ────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    project: "Fisher: Guardians of the Blue Tank",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Start Server ────────────────────────────────────
async function startServer() {
  await connectDB();
  startTickWorker();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`🐟 Fisher Backend running on port ${PORT}`);
    console.log(`🌊 Environment: ${process.env.NODE_ENV}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
  });
}

startServer();

module.exports = app;
