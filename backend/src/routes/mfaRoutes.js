import express from "express";
import { authenticate, restrictTo } from "../middlewares/index.js";
import { setupMFA, verifyAndEnableMFA, verifyMFALogin, recoverWithCode, disableMFA } from "../handlers/mfaHandler.js";

const router = express.Router();

router.post("/setup", authenticate, setupMFA);
router.post("/verify-setup", authenticate, verifyAndEnableMFA);
router.post("/verify-login", verifyMFALogin);
router.post("/recover", recoverWithCode);
router.post("/disable", authenticate, disableMFA);

export default router;
