import express from "express";
import passport from "passport";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { testRoutes, authRoutes, courseRoutes, adminRoutes, studentRoutes, instructorRoutes } from "./routes/index.js";
import { notFound, globalErrorHandler } from "./middlewares/index.js";
import { globalLimiter, authLimiter } from "./middlewares/rateLimiter.js";
import { configurePassport } from "./config/index.js";
import logger from "./utilis/logger.js";

const app = express();

// ─── Passport ─────────────────────────────────────────────────
configurePassport();

// ─── Security Headers ─────────────────────────────────────────
// Helmet sets a suite of HTTP security headers, including
// X-Content-Type-Options, X-Frame-Options, and Referrer-Policy.
// This shuts down a broad class of browser-based attacks.
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────
// Only allow requests from the known frontend origin.
// In production replace with your FRONTEND_URL env var.
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ─── HTTP Request Logging (Morgan → Winston) ──────────────────
// Streams every HTTP request into Winston combined.log
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => process.env.NODE_ENV === "test", // silent in tests
  })
);

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: "10kb" })); // hard-limit body size to prevent DoS

// ─── Passport Middleware ───────────────────────────────────────
app.use(passport.initialize());

// ─── Global Rate Limiter ──────────────────────────────────────
app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────
app.use("/", testRoutes);
app.use("/auth", authLimiter, authRoutes); // strict rate limit on auth
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/instructor", instructorRoutes);

// ─── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
