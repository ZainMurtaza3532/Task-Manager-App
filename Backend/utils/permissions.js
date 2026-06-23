export const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
};

export const PERMISSIONS = {
  admin: ["read", "write", "delete", "assign", "invite", "manage_members", "manage_team", "manage_workspace"],
  manager: ["read", "write", "delete", "assign", "invite", "manage_members"],
  member: ["read", "write", "assign_self"],
  viewer: ["read"],
};

export const hasPermission = (role, permission) => {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) || false;
};

export const hasMinRole = (userRole, minRole) => {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
};

export const canModifyTask = (role, task, userId) => {
  if (!role) return task.user?.toString() === userId.toString();
  if (hasPermission(role, "write")) return true;
  if (role === "member") {
    return task.user?.toString() === userId.toString() ||
      task.assignee?.toString() === userId.toString() ||
      task.createdBy?.toString() === userId.toString();
  }
  return false;
};
