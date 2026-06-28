/**
 * ═══════════════════════════════════════════════════════════════
 * Cakes & Crunches — Server Entry Point
 *
 * Initializes Prisma, starts Express, and registers cron jobs.
 * ═══════════════════════════════════════════════════════════════
 */

import "dotenv/config";
import app from "./app.js";
import { prisma } from "./utils/prisma.js";
import { logger } from "./utils/logger.js";
import { registerCronJobs } from "./cron/index.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info("✅ Database connected successfully");

    // Register scheduled cron jobs
    registerCronJobs();
    logger.info("✅ Cron jobs registered");

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      logger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    logger.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

bootstrap();
