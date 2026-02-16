import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";

process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./test.db";
process.env.NODE_ENV = "test";

dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Ensure test database schema is up to date
execSync("npx prisma migrate deploy", {
  cwd: path.resolve(__dirname, ".."),
  env: { ...process.env },
  stdio: "ignore",
});
