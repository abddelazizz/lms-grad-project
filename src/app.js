import express from "express";
import { testRoutes, authRoutes, courseRoutes } from "./routes/index.js";

const app = express();

app.use(express.json());

app.use("/", testRoutes);
app.use("/auth", authRoutes);
app.use("/", courseRoutes);

export default app;
