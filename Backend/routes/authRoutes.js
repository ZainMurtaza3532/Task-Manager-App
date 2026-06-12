import express from "express";
import * as authController from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/me", protect, authController.getMe);
router.put("/profile", protect, authController.updateProfile);
router.put("/password", protect, authController.updatePassword);

export default router;
