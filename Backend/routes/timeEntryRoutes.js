import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getTimeEntries,
  getRunningTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  createManualEntry,
  deleteTimeEntry,
  getTimeReports,
  getTaskTimeLogs,
} from "../controllers/timeEntryController.js";

const router = express.Router();
router.use(protect);

router.get("/", getTimeEntries);
router.get("/reports", getTimeReports);
router.get("/running", getRunningTimer);
router.post("/start", startTimer);
router.post("/manual", createManualEntry);
router.get("/task/:taskId", getTaskTimeLogs);
router.patch("/:id/pause", pauseTimer);
router.patch("/:id/resume", resumeTimer);
router.patch("/:id/stop", stopTimer);
router.delete("/:id", deleteTimeEntry);

export default router;
