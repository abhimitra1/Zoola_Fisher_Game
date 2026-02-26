// ── Global Error Handler ─────────────────────────────
// Catches all unhandled errors across the entire server

function errorHandler(err, req, res, next) {
  console.error("❌ Unhandled error:", err.message);

  // Prisma errors
  if (err.code === "P2002") {
    return res.status(400).json({
      success: false,
      error: "This record already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      error: "Record not found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expired, please login again",
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

module.exports = errorHandler;
