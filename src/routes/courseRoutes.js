import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/index.js";

const router = express.Router();

router.post(
  "/courses",
  authenticate,
  authorizeRoles("admin", "instructor"),
  (req, res) => {
    res.json({
      message: "Course created successfully",
    });
  }
);

router.get("/courses", authenticate, (req, res) => {
  res.json({
    message: "All courses",
  });
});

export default router;
