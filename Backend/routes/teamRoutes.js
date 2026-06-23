import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  inviteMember,
  joinTeamByInvite,
  regenerateInvite,
  updateTeamMemberRole,
  removeTeamMember,
  getTeamActivity,
} from "../controllers/teamController.js";
import { getMessages, sendMessage, deleteMessage } from "../controllers/chatController.js";

const router = express.Router();
router.use(protect);

router.post("/", createTeam);
router.get("/", getTeams);
router.post("/join", joinTeamByInvite);
router.get("/:id", getTeam);
router.put("/:id", updateTeam);
router.post("/:id/invite", inviteMember);
router.post("/:id/regenerate-invite", regenerateInvite);
router.put("/:id/members/:memberId/role", updateTeamMemberRole);
router.delete("/:id/members/:memberId", removeTeamMember);
router.get("/:id/activity", getTeamActivity);
router.get("/:teamId/chat", getMessages);
router.post("/:teamId/chat", sendMessage);
router.delete("/:teamId/chat/:messageId", deleteMessage);

export default router;
