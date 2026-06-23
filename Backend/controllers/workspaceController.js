import Workspace from "../models/Workspace.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
    });

    await User.findByIdAndUpdate(req.user.id, { currentWorkspace: workspace._id });

    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
      isActive: true,
    })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: workspaces });
  } catch (error) {
    next(error);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    if (!workspace || !workspace.isActive) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    if (!workspace.isMember(req.user.id)) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const teams = await Team.find({ workspace: workspace._id, isActive: true })
      .populate("members.user", "name email avatar")
      .sort({ name: 1 });

    res.json({ success: true, data: { workspace, teams } });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    const role = workspace.getMemberRole(req.user.id);
    if (!["admin", "manager"].includes(role)) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    const { name, description, settings } = req.body;
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };
    await workspace.save();

    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const switchWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace || !workspace.isMember(req.user.id)) {
      const error = new Error("Workspace not found or access denied");
      error.statusCode = 404;
      throw error;
    }

    await User.findByIdAndUpdate(req.user.id, { currentWorkspace: workspace._id });
    res.json({ success: true, data: workspace, message: "Workspace switched" });
  } catch (error) {
    next(error);
  }
};

export const inviteToWorkspace = async (req, res, next) => {
  try {
    const { email, role = "member" } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    const userRole = workspace.getMemberRole(req.user.id);
    if (!["admin", "manager"].includes(userRole)) {
      const error = new Error("Not authorized to invite");
      error.statusCode = 403;
      throw error;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      const error = new Error("User not found. They must register first.");
      error.statusCode = 404;
      throw error;
    }

    if (workspace.isMember(user._id)) {
      const error = new Error("User is already a member");
      error.statusCode = 400;
      throw error;
    }

    workspace.members.push({ user: user._id, role });
    await workspace.save();

    const { createNotification } = await import("../utils/notificationService.js");
    await createNotification({
      recipientId: user._id,
      senderId: req.user.id,
      type: "team_invite",
      title: "Workspace Invitation",
      message: `You've been added to workspace "${workspace.name}"`,
      workspaceId: workspace._id,
    });

    res.json({ success: true, data: workspace, message: "Member invited" });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    if (workspace.getMemberRole(req.user.id) !== "admin") {
      const error = new Error("Only admins can change roles");
      error.statusCode = 403;
      throw error;
    }

    const member = workspace.members.find((m) => m.user.toString() === req.params.memberId);
    if (!member) {
      const error = new Error("Member not found");
      error.statusCode = 404;
      throw error;
    }

    member.role = role;
    await workspace.save();
    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    if (workspace.getMemberRole(req.user.id) !== "admin") {
      const error = new Error("Only admins can remove members");
      error.statusCode = 403;
      throw error;
    }

    if (req.params.memberId === workspace.owner.toString()) {
      const error = new Error("Cannot remove workspace owner");
      error.statusCode = 400;
      throw error;
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== req.params.memberId
    );
    await workspace.save();
    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    next(error);
  }
};
