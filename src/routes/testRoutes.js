import express from "express";
import { checkHandler } from "../handlers/index.js";

const router = express.Router();

router.get("/check", checkHandler);

export default router;
