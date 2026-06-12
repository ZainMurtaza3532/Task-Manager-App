import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

// Axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ──────────── Auth API Calls ────────────

export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await api.post("/auth/login", userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await api.put("/auth/profile", userData);
  return response.data;
};

export const updatePassword = async (passwordData) => {
  const response = await api.put("/auth/password", passwordData);
  return response.data;
};

// ──────────── Task API Calls ────────────

// Get all active tasks (with search, filter, sort)
export const fetchTasks = async (params = {}) => {
  const response = await api.get("/tasks", { params });
  return response.data;
};

// Get task statistics for dashboard
export const fetchTaskStats = async () => {
  const response = await api.get("/tasks/stats");
  return response.data;
};

// Get all trashed tasks
export const fetchTrashedTasks = async () => {
  const response = await api.get("/tasks/trash");
  return response.data;
};

// Get single task by ID
export const fetchTaskById = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

// Create a new task
export const createTask = async (taskData) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

// Update a task
export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

// Soft delete — move to trash
export const softDeleteTask = async (id) => {
  const response = await api.patch(`/tasks/${id}/trash`);
  return response.data;
};

// Restore from trash
export const restoreTask = async (id) => {
  const response = await api.patch(`/tasks/${id}/restore`);
  return response.data;
};

// Permanently delete
export const permanentDeleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

// Empty all trash
export const emptyTrash = async () => {
  const response = await api.delete("/tasks/trash/empty");
  return response.data;
};

export default api;
