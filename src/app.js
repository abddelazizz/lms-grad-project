import express from "express";
import passport from "passport";
import { testRoutes, authRoutes, courseRoutes } from "./routes/index.js";
import { notFound, globalErrorHandler } from "./middlewares/index.js";
import { configurePassport } from "./config/index.js";

const app = express();

configurePassport();

app.use(express.json());
app.use(passport.initialize());

app.use("/", testRoutes);
app.use("/auth", authRoutes);
app.use("/", courseRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
