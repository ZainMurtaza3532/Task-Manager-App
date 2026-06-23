// Priority configuration
export const PRIORITIES = {
  high: { label: "High", color: "var(--priority-high)", bgLight: "rgba(239, 68, 68, 0.1)", bgDark: "rgba(239, 68, 68, 0.15)", icon: "fa-arrow-up" },
  medium: { label: "Medium", color: "var(--priority-medium)", bgLight: "rgba(245, 158, 11, 0.1)", bgDark: "rgba(245, 158, 11, 0.15)", icon: "fa-minus" },
  low: { label: "Low", color: "var(--priority-low)", bgLight: "rgba(16, 185, 129, 0.1)", bgDark: "rgba(16, 185, 129, 0.15)", icon: "fa-arrow-down" },
};

export const STATUSES = {
  pending: { label: "Pending", color: "var(--status-pending)", bgLight: "rgba(100, 116, 139, 0.1)", bgDark: "rgba(100, 116, 139, 0.15)", icon: "fa-clock" },
  "in-progress": { label: "In Progress", color: "var(--status-progress)", bgLight: "rgba(59, 130, 246, 0.1)", bgDark: "rgba(59, 130, 246, 0.15)", icon: "fa-spinner" },
  completed: { label: "Completed", color: "var(--status-completed)", bgLight: "rgba(16, 185, 129, 0.1)", bgDark: "rgba(16, 185, 129, 0.15)", icon: "fa-circle-check" },
};

export const CATEGORIES = ["General", "Work", "Personal", "Shopping", "Health", "Finance", "Education", "Travel"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priority", label: "Priority" },
  { value: "dueDate", label: "Due Date" },
  { value: "title", label: "Title (A-Z)" },
];

const PROD_API = "https://task-manager-app-production-7c24.up.railway.app/api";
const DEV_API = "http://127.0.0.1:5000/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? DEV_API : PROD_API);

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  API_BASE_URL.replace("/api", "");

export const ROLES = {
  admin: { label: "Admin", color: "#ef4444" },
  manager: { label: "Manager", color: "#f59e0b" },
  member: { label: "Member", color: "#6366f1" },
  viewer: { label: "Viewer", color: "#64748b" },
};

export const NOTIFICATION_TYPES = {
  task_assigned: { icon: "UserPlus", color: "#6366f1" },
  task_updated: { icon: "Edit", color: "#3b82f6" },
  task_completed: { icon: "CheckCircle", color: "#10b981" },
  task_due_soon: { icon: "Clock", color: "#f59e0b" },
  task_overdue: { icon: "AlertTriangle", color: "#ef4444" },
  team_invite: { icon: "Users", color: "#8b5cf6" },
  team_joined: { icon: "UserCheck", color: "#10b981" },
  system: { icon: "Bell", color: "#64748b" },
};

export const FILE_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  spreadsheet: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  presentation: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  archive: ["application/zip", "application/x-zip-compressed"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
