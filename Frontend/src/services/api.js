import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => api.post("/auth/register", data).then((r) => r.data);
export const loginUser = (data) => api.post("/auth/login", data).then((r) => r.data);
export const getMe = () => api.get("/auth/me").then((r) => r.data);
export const updateProfile = (data) => api.put("/auth/profile", data).then((r) => r.data);
export const updatePassword = (data) => api.put("/auth/password", data).then((r) => r.data);

// Tasks
export const fetchTasks = (params = {}) => api.get("/tasks", { params }).then((r) => r.data);
export const fetchTaskStats = () => api.get("/tasks/stats").then((r) => r.data);
export const fetchTrashedTasks = () => api.get("/tasks/trash").then((r) => r.data);
export const fetchTaskById = (id) => api.get(`/tasks/${id}`).then((r) => r.data);
export const createTask = (data) => api.post("/tasks", data).then((r) => r.data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data).then((r) => r.data);
export const softDeleteTask = (id) => api.patch(`/tasks/${id}/trash`).then((r) => r.data);
export const restoreTask = (id) => api.patch(`/tasks/${id}/restore`).then((r) => r.data);
export const permanentDeleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);
export const emptyTrash = () => api.delete("/tasks/trash/empty").then((r) => r.data);

// Comments & task activity
export const fetchTaskComments = (taskId) => api.get(`/tasks/${taskId}/comments`).then((r) => r.data);
export const addTaskComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data).then((r) => r.data);
export const updateTaskComment = (taskId, commentId, data) =>
  api.put(`/tasks/${taskId}/comments/${commentId}`, data).then((r) => r.data);
export const deleteTaskComment = (taskId, commentId) =>
  api.delete(`/tasks/${taskId}/comments/${commentId}`).then((r) => r.data);
export const fetchTaskActivity = (taskId) => api.get(`/tasks/${taskId}/activity`).then((r) => r.data);

// Notifications
export const fetchNotifications = (params = {}) => api.get("/notifications", { params }).then((r) => r.data);
export const fetchUnreadCount = () => api.get("/notifications/unread-count").then((r) => r.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () => api.patch("/notifications/read-all").then((r) => r.data);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`).then((r) => r.data);

// Workspaces
export const fetchWorkspaces = () => api.get("/workspaces").then((r) => r.data);
export const fetchWorkspace = (id) => api.get(`/workspaces/${id}`).then((r) => r.data);
export const createWorkspace = (data) => api.post("/workspaces", data).then((r) => r.data);
export const updateWorkspace = (id, data) => api.put(`/workspaces/${id}`, data).then((r) => r.data);
export const switchWorkspace = (id) => api.post(`/workspaces/${id}/switch`).then((r) => r.data);
export const inviteToWorkspace = (id, data) => api.post(`/workspaces/${id}/invite`, data).then((r) => r.data);
export const updateWorkspaceMemberRole = (id, memberId, role) =>
  api.put(`/workspaces/${id}/members/${memberId}/role`, { role }).then((r) => r.data);
export const removeWorkspaceMember = (id, memberId) =>
  api.delete(`/workspaces/${id}/members/${memberId}`).then((r) => r.data);

// Teams
export const fetchTeams = (params = {}) => api.get("/teams", { params }).then((r) => r.data);
export const fetchTeam = (id) => api.get(`/teams/${id}`).then((r) => r.data);
export const createTeam = (data) => api.post("/teams", data).then((r) => r.data);
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data).then((r) => r.data);
export const inviteTeamMember = (id, data) => api.post(`/teams/${id}/invite`, data).then((r) => r.data);
export const joinTeamByInvite = (inviteCode) => api.post("/teams/join", { inviteCode }).then((r) => r.data);
export const regenerateTeamInvite = (id) => api.post(`/teams/${id}/regenerate-invite`).then((r) => r.data);
export const updateTeamMemberRole = (id, memberId, role) =>
  api.put(`/teams/${id}/members/${memberId}/role`, { role }).then((r) => r.data);
export const removeTeamMember = (id, memberId) =>
  api.delete(`/teams/${id}/members/${memberId}`).then((r) => r.data);
export const fetchTeamActivity = (id) => api.get(`/teams/${id}/activity`).then((r) => r.data);
export const fetchChatMessages = (teamId, params = {}) =>
  api.get(`/teams/${teamId}/chat`, { params }).then((r) => r.data);
export const sendChatMessage = (teamId, content) =>
  api.post(`/teams/${teamId}/chat`, { content }).then((r) => r.data);

// Time Tracking
export const fetchTimeEntries = (params = {}) => api.get("/time-entries", { params }).then((r) => r.data);
export const fetchRunningTimer = () => api.get("/time-entries/running").then((r) => r.data);
export const startTimer = (data) => api.post("/time-entries/start", data).then((r) => r.data);
export const pauseTimer = (id) => api.patch(`/time-entries/${id}/pause`).then((r) => r.data);
export const resumeTimer = (id) => api.patch(`/time-entries/${id}/resume`).then((r) => r.data);
export const stopTimer = (id) => api.patch(`/time-entries/${id}/stop`).then((r) => r.data);
export const createManualTimeEntry = (data) => api.post("/time-entries/manual", data).then((r) => r.data);
export const deleteTimeEntry = (id) => api.delete(`/time-entries/${id}`).then((r) => r.data);
export const fetchTimeReports = (period = "week") =>
  api.get("/time-entries/reports", { params: { period } }).then((r) => r.data);
export const fetchTaskTimeLogs = (taskId) => api.get(`/time-entries/task/${taskId}`).then((r) => r.data);

// Files
export const uploadTaskFiles = (taskId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return api.post(`/files/${taskId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);
};
export const deleteTaskFile = (taskId, attachmentId) =>
  api.delete(`/files/${taskId}/${attachmentId}`).then((r) => r.data);
export const fetchTaskAttachments = (taskId) => api.get(`/files/${taskId}`).then((r) => r.data);

// Calendar
export const fetchCalendarTasks = (params) => api.get("/calendar", { params }).then((r) => r.data);
export const scheduleTask = (id, data) => api.patch(`/calendar/${id}/schedule`, data).then((r) => r.data);

// AI
export const aiBreakdownTask = (input) => api.post("/ai/breakdown", { input }).then((r) => r.data);
export const aiSuggestTasks = () => api.post("/ai/suggest").then((r) => r.data);
export const aiPredictPriority = (data) => api.post("/ai/predict-priority", data).then((r) => r.data);
export const aiGetInsights = () => api.get("/ai/insights").then((r) => r.data);
export const aiChat = (message, history = []) =>
  api.post("/ai/chat", { message, history }).then((r) => r.data);

export default api;
