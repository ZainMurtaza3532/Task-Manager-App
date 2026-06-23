import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { formatRelativeTime } from "../utils/helpers";

const NotificationCenter = () => {
  const { notifications, unreadCount, markRead, markAllRead, removeNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="notification-center" ref={ref} style={{ position: "relative" }}>
      <button className="header-btn notification-btn" onClick={() => setOpen(!open)} title="Notifications">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {unreadCount > 0 && (
                <button className="btn-icon" onClick={markAllRead} title="Mark all read">
                  <CheckCheck size={16} />
                </button>
              )}
              <button className="btn-icon" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n._id} className={`notification-item ${n.isRead ? "" : "unread"}`}>
                  <div className="notification-item-content">
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <span className="notification-time">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <div className="notification-item-actions">
                    {!n.isRead && (
                      <button className="btn-icon" onClick={() => markRead(n._id)} title="Mark read">
                        <Check size={14} />
                      </button>
                    )}
                    <button className="btn-icon" onClick={() => removeNotification(n._id)} title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link to="/notifications" className="notification-view-all" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
