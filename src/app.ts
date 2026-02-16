import express, { Request, Response } from "express";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { randomUUID } from "crypto";
import taskRoutes from "./routes/task.routes";
import { errorHandler } from "./middlewares/error-handler";
import { logger } from "./lib/logger";

const app = express();

// Security headers
app.use(helmet());
app.use(cors());

// Rate limiting (disabled in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

// Request ID + structured logging
app.use((req: Request, _res: Response, next) => {
  req.id = randomUUID();
  next();
});

if (process.env.NODE_ENV !== "test") {
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as Request).id,
    })
  );
}

// Body parsing with size limit
app.use(express.json({ limit: "10kb" }));

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// API routes - versioned + backward compatible
app.use("/api/v1/tasks", taskRoutes);
app.use("/tasks", taskRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use(errorHandler);

export default app;
