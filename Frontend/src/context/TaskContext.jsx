import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as api from "../services/api";
import { useSocket } from "./SocketContext";
import { useToast } from "./ToastContext";

const TaskContext = createContext();

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTasks must be used within TaskProvider");
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [trashedTasks, setTrashedTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0,
    overdue: 0,
    dueSoon: 0,
    trashedCount: 0,
    upcoming: [],
    recent: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    priority: "all",
    status: "all",
    category: "all",
    sort: "newest",
  });

  const { addToast } = useToast();
  const { subscribe } = useSocket();

  const clearFilters = useCallback(() => {
    setFilters({
      priority: "all",
      status: "all",
      category: "all",
      sort: "newest",
    });
    setSearchQuery("");
  }, []);

  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.fetchTasks({ ...filters, search: searchQuery });
      setTasks(response.data || []);
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to fetch tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, addToast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.fetchTaskStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  }, []);

  useEffect(() => {
    const refreshTasks = () => {
      fetchAllTasks();
      fetchStats();
    };
    const unsubTask = subscribe("task_update", refreshTasks);
    return () => unsubTask();
  }, [fetchAllTasks, fetchStats, subscribe]);

  const fetchAllTrashedTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.fetchTrashedTasks();
      setTrashedTasks(response.data || []);
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to fetch trashed tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const addTask = async (taskData) => {
    try {
      const res = await api.createTask(taskData);
      addToast("Task created successfully", "success");
      fetchAllTasks();
      fetchStats();
      // API returns { success, data: task } — support either shape
      const created = res?.data?._id ? res.data : res;
      return created?._id ? created : null;
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to create task", "error");
      return null;
    }
  };

  const editTask = async (id, taskData) => {
    try {
      await api.updateTask(id, taskData);
      addToast("Task updated successfully", "success");
      fetchAllTasks();
      fetchStats();
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to update task", "error");
      return false;
    }
  };

  const trashTask = async (id) => {
    try {
      await api.softDeleteTask(id);
      addToast("Task moved to trash", "info");
      fetchAllTasks();
      fetchStats();
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to move task to trash", "error");
      return false;
    }
  };

  const restoreFromTrash = async (id) => {
    try {
      await api.restoreTask(id);
      addToast("Task restored", "success");
      fetchAllTrashedTasks();
      fetchStats();
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to restore task", "error");
      return false;
    }
  };

  const deleteForever = async (id) => {
    try {
      await api.permanentDeleteTask(id);
      addToast("Task permanently deleted", "success");
      fetchAllTrashedTasks();
      fetchStats();
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to delete task", "error");
      return false;
    }
  };

  const clearTrash = async () => {
    try {
      await api.emptyTrash();
      addToast("Trash emptied", "success");
      fetchAllTrashedTasks();
      fetchStats();
      return true;
    } catch (error) {
      addToast(error.response?.data?.message || "Failed to empty trash", "error");
      return false;
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        trashedTasks,
        stats,
        loading,
        searchQuery,
        filters,
        setSearchQuery,
        setFilters,
        clearFilters,
        fetchAllTasks,
        fetchStats,
        fetchAllTrashedTasks,
        addTask,
        editTask,
        trashTask,
        restoreFromTrash,
        deleteForever,
        clearTrash,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
