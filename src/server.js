import "dotenv/config";

// ─── Step 1: Validate required environment variables ─────────────
// Runs immediately after dotenv loads — catches missing config early
const REQUIRED_ENV_VARS = [
  "PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASS",
  "DB_HOST",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[FATAL] Missing required environment variables: ${missing.join(", ")}\n` +
    `Please check your .env file at the project root.`
  );
  process.exit(1);
}

// ─── Step 2: Register crash handlers ─────────────────────────────
process.on("uncaughtException", (err) => {
  console.error("[CRASH] Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[CRASH] Unhandled Promise Rejection:", reason);
  process.exit(1);
});

// ─── Step 3: Import application modules ──────────────────────────
import app from "./app.js";
import { sequelize } from "./config/index.js";

const PORT = process.env.PORT || 5000;

let server;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("[DB] Connected to MySQL");

    await sequelize.sync();
    console.log("[DB] Database synced");

    server = app.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
      if (server) {
        server.close(() => {
          console.log("[SERVER] HTTP server closed.");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("[FATAL] Unable to start server:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

startServer();
