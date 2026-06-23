import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import {
  breakdownTask,
  suggestTasks,
  predictPriority,
  getProductivityInsights,
  chatWithAI,
} from "../controllers/aiController.js";

const router = express.Router();
router.use(protect);
router.use(aiLimiter);

router.post("/breakdown", breakdownTask);
router.post("/suggest", suggestTasks);
router.post("/predict-priority", predictPriority);
router.get("/insights", getProductivityInsights);
router.post("/chat", chatWithAI);

export default router;
