import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";
import { uploadFiles, deleteFile, getTaskAttachments } from "../controllers/fileController.js";

const router = express.Router();
router.use(protect);

router.get("/:taskId", getTaskAttachments);
router.post("/:taskId", uploadLimiter, upload.array("files", 5), uploadFiles);
router.delete("/:taskId/:attachmentId", deleteFile);

export default router;
