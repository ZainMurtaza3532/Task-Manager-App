import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  switchWorkspace,
  inviteToWorkspace,
  updateMemberRole,
  removeMember,
} from "../controllers/workspaceController.js";

const router = express.Router();
router.use(protect);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:id", getWorkspace);
router.put("/:id", updateWorkspace);
router.post("/:id/switch", switchWorkspace);
router.post("/:id/invite", inviteToWorkspace);
router.put("/:id/members/:memberId/role", updateMemberRole);
router.delete("/:id/members/:memberId", removeMember);

export default router;
