import Workspace from "../models/Workspace.js";
import Team from "../models/Team.js";
import { hasPermission, hasMinRole } from "../utils/permissions.js";

export const checkWorkspaceAccess = (minRole = "viewer") => async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.body.workspace || req.query.workspace;
    if (!workspaceId) {
      const error = new Error("Workspace ID is required");
      error.statusCode = 400;
      throw error;
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.isActive) {
      const error = new Error("Workspace not found");
      error.statusCode = 404;
      throw error;
    }

    const role = workspace.getMemberRole(req.user.id);
    if (!role || !hasMinRole(role, minRole)) {
      const error = new Error("Not authorized to access this workspace");
      error.statusCode = 403;
      throw error;
    }

    req.workspace = workspace;
    req.workspaceRole = role;
    next();
  } catch (error) {
    next(error);
  }
};

export const checkTeamAccess = (minRole = "viewer") => async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.team || req.query.team;
    if (!teamId) {
      const error = new Error("Team ID is required");
      error.statusCode = 400;
      throw error;
    }

    const team = await Team.findById(teamId).populate("workspace");
    if (!team || !team.isActive) {
      const error = new Error("Team not found");
      error.statusCode = 404;
      throw error;
    }

    const workspaceRole = team.workspace.getMemberRole(req.user.id);
    const teamRole = team.getMemberRole(req.user.id);

    if (!workspaceRole && !teamRole) {
      const error = new Error("Not authorized to access this team");
      error.statusCode = 403;
      throw error;
    }

    const effectiveRole = teamRole || workspaceRole;
    if (!hasMinRole(effectiveRole, minRole)) {
      const error = new Error("Insufficient permissions");
      error.statusCode = 403;
      throw error;
    }

    req.team = team;
    req.teamRole = effectiveRole;
    next();
  } catch (error) {
    next(error);
  }
};

export const requirePermission = (permission) => (req, res, next) => {
  const role = req.teamRole || req.workspaceRole;
  if (!hasPermission(role, permission)) {
    return res.status(403).json({ success: false, message: `Permission denied: ${permission}` });
  }
  next();
};
