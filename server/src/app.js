/**
 * ═══════════════════════════════════════════════════════════════
 * Cakes & Crunches — Express Application Configuration
 *
 * Configures Express with security middleware, CORS, rate limiting,
 * logging, file upload handling, and all API route registrations.
 * ═══════════════════════════════════════════════════════════════
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import bulkOrderRoutes from "./routes/bulkOrder.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reportRoutes from "./routes/report.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ── Security Middleware ──────────────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

/* ── CORS ─────────────────────────────────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── Request Parsing ──────────────────────────────────────────── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ── HTTP Logging ─────────────────────────────────────────────── */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* ── Rate Limiting ────────────────────────────────────────────── */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

/* ── Auth-specific stricter rate limit ────────────────────────── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

/* ── Static File Serving (Uploads) ────────────────────────────── */
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* ── Health Check ─────────────────────────────────────────────── */
app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    message: "Cakes & Crunches Backend API is running successfully.",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Cakes & Crunches REST API is online & operational.",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", uptime: process.uptime() });
});

/* ── API Routes ───────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/bulk-orders", bulkOrderRoutes);
app.use("/api/orders", bulkOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);

/* ── Error Handling ───────────────────────────────────────────── */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
