import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";

import connectDB from "./config/database";
import { errorHandler, AppError } from "./middleware/error-handler";
import { apiRateLimiter } from "./middleware/rate-limiter";
import { initWebSocketServer } from "./websocket/ws-server";

// Import routes (stubs for now — filled in Phase 2)
import authRoutes from "./routes/auth.routes";
import jobRoutes from "./routes/job.routes";
import applicationRoutes from "./routes/application.routes";
import adminRoutes  from "./routes/admin.routes";
import uploadRoutes from "./routes/upload.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();

// Security middleware 
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow file serving
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL ?? "http://localhost:5173",
  credentials: true,      // Allow cookies to be sent cross-origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Body parsers 
app.use(express.json({ limit: "10kb" }));           // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// HTTP request logger (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting (applied to all /api routes) 
app.use("/api", apiRateLimiter);

// Static file serving for uploaded resumes/avatars
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "1d",
    etag: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin",   adminRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check — EKS load balancer and k8s liveness probes hit this
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// 404 handler
app.all("/{*path}", (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// Global error handler (must be last)
app.use(errorHandler);

// Create HTTP server (shared with WebSocket)
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Start
const PORT = Number(process.env.PORT) ?? 5000;

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket ready on ws://localhost:${PORT}/ws`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
  });
}

start();

// Graceful shutdown 
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});