import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getCalendarTasks, scheduleTask } from "../controllers/calendarController.js";

const router = express.Router();
router.use(protect);

router.get("/", getCalendarTasks);
router.patch("/:id/schedule", scheduleTask);

export default router;
