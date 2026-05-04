import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, "../../logs");

const { combine, timestamp, printf, colorize, errors } = winston.format;

// ─── Log Format ───────────────────────────────────────────────
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// ─── Winston Logger ──────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "http",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Console: dev only
    ...(process.env.NODE_ENV !== "production"
      ? [new winston.transports.Console({ format: combine(colorize(), logFormat) })]
      : []),
    // Error log: production file
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    // Combined log: all levels
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
});

// ─── Audit Logger ─────────────────────────────────────────────
// Tracks WHO did WHAT and WHEN on critical resource mutations
export const auditLog = (action, userId, resourceType, resourceId, extra = {}) => {
  logger.warn(`AUDIT | action=${action} | user_id=${userId} | ${resourceType}=${resourceId} | ${JSON.stringify(extra)}`);
};

// ─── Security Logger ─────────────────────────────────────────
// Failed logins, bad tokens, suspicious patterns
export const securityLog = (event, context = {}) => {
  logger.error(`SECURITY | event=${event} | ${JSON.stringify(context)}`);
};

export default logger;
