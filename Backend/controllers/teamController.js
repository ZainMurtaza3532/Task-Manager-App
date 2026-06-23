import crypto from "crypto";
import Team from "../models/Team.js";
import Workspace from "../models/Workspace.js";
import Activity from "../models/Activity.js";
import Task from "../models/Task.js";
import { createNotification, emitTeamActivity } from "../utils/notificationService.js";

const logActivity = async (team, workspace, actor, action, entityType, entityId, description, metadata = {}) => {
  const activity = await Activity.create({
    team: team._id,
    workspace: workspace._id || workspace,
    actor,
    action,
    entityType,
    entityId,
    description,
    metadata,
  });
  const populated = await Activity.findById(activity._id).populate("actor", "name email avatar");
  emitTeamActivity(team._id, populated);
  return populated;
};

export const createTeam = async (req, res, next) => {
  try {
    const { name, description, workspaceId, color } = req.body;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isMember(req.user.id)) {
      const error = new Error("Workspace not found or access denied");
      error.statusCode = 403;
      throw error;
    }

    const role = workspace.getMemberRole(req.user.id);
    if (!["admin", "manager", "member"].includes(role)) {
      const error = new Error("Not authorized to create teams");
      error.statusCode = 403;
      throw error;
    }

    const team = await Team.create({
      name,
      description,
      workspace: workspaceId,
      createdBy: req.user.id,
      color: color || "#6366f1",
      members: [{ user: req.user.id, role: "admin" }],
    });

    await logActivity(team, workspace, req.user.id, "team_created", "team", team._id, `Team "${name}" was created`);

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    const filter = { isActive: true, "members.user": req.user.id };
    if (workspaceId) filter.workspace = workspaceId;

    const teams = await Team.find(filter)
      .populate("members.user", "name email avatar")
      .populate("workspace", "name")
      .sort({ name: 1 });

    res.json({ success: true, data: teams });
  } catch (error) {
    next(error);
  }
};

export const getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name email avatar")
      .populate("workspace", "name owner members")
      .populate("createdBy", "name email");

    if (!team || !team.isActive) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    if (!team.isMember(req.user.id)) {
      const Workspace = (await import("../models/Workspace.js")).default;
      const workspace = await Workspace.findById(team.workspace._id || team.workspace);
      const wsRole = workspace?.getMemberRole(req.user.id);
      if (!wsRole) {
        const error = new Error("Not authorized");
        error.statusCode = 403;
        throw error;
      }
    }

    const [tasks, activities] = await Promise.all([
      Task.find({ team: team._id, isDeleted: false })
        .populate("assignee", "name email avatar")
        .populate("user", "name email")
        .sort({ updatedAt: -1 })
        .limit(50),
      Activity.find({ team: team._id })
        .populate("actor", "name email avatar")
        .sort({ createdAt: -1 })
        .limit(30),
    ]);

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      members: team.members.length,
    };

    res.json({ success: true, data: { team, tasks, activities, stats } });
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    const role = team.getMemberRole(req.user.id);
    if (!["admin", "manager"].includes(role)) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const { name, description, color } = req.body;
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (color) team.color = color;
    await team.save();

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const { email, role = "member" } = req.body;
    const team = await Team.findById(req.params.id).populate("workspace");
    if (!team) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    const userRole = team.getMemberRole(req.user.id);
    if (!["admin", "manager"].includes(userRole)) {
      const error = new Error("Not authorized to invite");
      error.statusCode = 403;
      throw error;
    }

    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (team.isMember(user._id)) {
      const error = new Error("User is already a team member");
      error.statusCode = 400;
      throw error;
    }

    team.members.push({ user: user._id, role });
    await team.save();

    await createNotification({
      recipientId: user._id,
      senderId: req.user.id,
      type: "team_invite",
      title: "Team Invitation",
      message: `You've been added to team "${team.name}"`,
      teamId: team._id,
      workspaceId: team.workspace._id,
    });

    await logActivity(team, team.workspace, req.user.id, "member_joined", "member", user._id, `${user.name} joined the team`);

    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const joinTeamByInvite = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode, isActive: true }).populate("workspace");
    if (!team) {
      const error = new Error("Invalid or expired invite link");
      error.statusCode = 404;
      throw error;
    }

    if (team.inviteExpiresAt && team.inviteExpiresAt < new Date()) {
      const error = new Error("Invite link has expired");
      error.statusCode = 400;
      throw error;
    }

    if (team.isMember(req.user.id)) {
      return res.json({ success: true, data: team, message: "Already a member" });
    }

    team.members.push({ user: req.user.id, role: "member" });
    await team.save();

    await logActivity(team, team.workspace, req.user.id, "member_joined", "member", req.user.id, `${req.user.name} joined via invite link`);

    res.json({ success: true, data: team, message: "Successfully joined team" });
  } catch (error) {
    next(error);
  }
};

export const regenerateInvite = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    if (!["admin", "manager"].includes(team.getMemberRole(req.user.id))) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    team.inviteCode = crypto.randomBytes(16).toString("hex");
    team.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await team.save();

    res.json({
      success: true,
      data: { inviteCode: team.inviteCode, expiresAt: team.inviteExpiresAt },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTeamMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    if (team.getMemberRole(req.user.id) !== "admin") {
      const error = new Error("Only team admins can change roles");
      error.statusCode = 403;
      throw error;
    }

    const member = team.members.find((m) => m.user.toString() === req.params.memberId);
    if (!member) {
      const error = new Error("Member not found");
      error.statusCode = 404;
      throw error;
    }

    member.role = role;
    await team.save();
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    if (!["admin", "manager"].includes(team.getMemberRole(req.user.id))) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    team.members = team.members.filter((m) => m.user.toString() !== req.params.memberId);
    await team.save();
    res.json({ success: true, message: "Member removed from team" });
  } catch (error) {
    next(error);
  }
};

export const getTeamActivity = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team || !team.isMember(req.user.id)) {
      const error = new Error("Team not found or access denied");
      error.statusCode = 403;
      throw error;
    }

    const activities = await Activity.find({ team: team._id })
      .populate("actor", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 50);

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

export { logActivity };
