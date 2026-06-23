import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/api";
import { useSocket } from "./SocketContext";
import { useToast } from "./ToastContext";
import { useAuth } from "./AuthContext";
import { useApiHealth } from "./ApiHealthContext";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { isV2 } = useApiHealth();
  const { subscribe } = useSocket();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user || !isV2) return;
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        fetchNotifications({ limit: 50 }),
        fetchUnreadCount(),
      ]);
      setNotifications(notifRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [user, isV2]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user || !isV2) return;

    const unsub = subscribe("notification", (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 100));
      setUnreadCount((c) => c + 1);
      addToast(notification.title, notification.type?.includes("overdue") ? "error" : "info");

      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/vite.svg",
        });
      }
    });

    return unsub;
  }, [user, isV2, subscribe, addToast]);

  const requestPushPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (user) requestPushPermission();
  }, [user]);

  const markRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const removeNotification = async (id) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        loadNotifications,
        markRead,
        markAllRead,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
