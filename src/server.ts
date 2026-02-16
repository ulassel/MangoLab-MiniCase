import dotenv from "dotenv";
dotenv.config();

import { config } from "./lib/config";
import { logger } from "./lib/logger";
import app from "./app";
import prisma from "./lib/prisma";

const server = app.listen(config.PORT, () => {
  logger.info(`Server is running on port ${config.PORT}`);
});

const SHUTDOWN_TIMEOUT_MS = 10_000;

const shutdown = async () => {
  logger.info("Shutting down gracefully...");

  const forceExit = setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  server.close(async () => {
    clearTimeout(forceExit);
    await prisma.$disconnect();
    logger.info("Server stopped");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
