import express from "express";
import { testRoutes, authRoutes, courseRoutes } from "./routes/index.js";
import { notFound, globalErrorHandler } from "./middlewares/index.js";

const app = express();

app.use(express.json());

app.use("/", testRoutes);
app.use("/auth", authRoutes);
app.use("/", courseRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;

