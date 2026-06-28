/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and returns consistent JSON responses.
 */

import { logger } from "../utils/logger.js";

/**
 * 404 — Route not found handler.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
}

/**
 * Global error handler — must have 4 parameters for Express to recognize it.
 */
export function errorHandler(err, req, res, _next) {
  logger.error(err.stack || err.message);

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists.",
      field: err.meta?.target,
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found.",
    });
  }

  // Validation errors from express-validator
  if (err.type === "validation") {
    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors: err.errors,
    });
  }

  // JWT errors
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err.message || "Internal server error.",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}

/**
 * Async route handler wrapper — catches promise rejections.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
