// Priority configuration
export const PRIORITIES = {
  high: {
    label: "High",
    color: "var(--priority-high)",
    bgLight: "rgba(239, 68, 68, 0.1)",
    bgDark: "rgba(239, 68, 68, 0.15)",
    icon: "fa-arrow-up",
  },
  medium: {
    label: "Medium",
    color: "var(--priority-medium)",
    bgLight: "rgba(245, 158, 11, 0.1)",
    bgDark: "rgba(245, 158, 11, 0.15)",
    icon: "fa-minus",
  },
  low: {
    label: "Low",
    color: "var(--priority-low)",
    bgLight: "rgba(16, 185, 129, 0.1)",
    bgDark: "rgba(16, 185, 129, 0.15)",
    icon: "fa-arrow-down",
  },
};

// Status configuration
export const STATUSES = {
  pending: {
    label: "Pending",
    color: "var(--status-pending)",
    bgLight: "rgba(100, 116, 139, 0.1)",
    bgDark: "rgba(100, 116, 139, 0.15)",
    icon: "fa-clock",
  },
  "in-progress": {
    label: "In Progress",
    color: "var(--status-progress)",
    bgLight: "rgba(59, 130, 246, 0.1)",
    bgDark: "rgba(59, 130, 246, 0.15)",
    icon: "fa-spinner",
  },
  completed: {
    label: "Completed",
    color: "var(--status-completed)",
    bgLight: "rgba(16, 185, 129, 0.1)",
    bgDark: "rgba(16, 185, 129, 0.15)",
    icon: "fa-circle-check",
  },
};

// Categories
export const CATEGORIES = [
  "General",
  "Work",
  "Personal",
  "Shopping",
  "Health",
  "Finance",
  "Education",
  "Travel",
];

// Sort options
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priority", label: "Priority" },
  { value: "dueDate", label: "Due Date" },
  { value: "title", label: "Title (A-Z)" },
];

// API base URL
export const API_BASE_URL = "https://task-manager-app-production-7c24.up.railway.app/api";
