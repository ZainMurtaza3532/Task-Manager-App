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
    
    const escapeHandler = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", escapeHandler);
    }
    
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escapeHandler);
    };
  }, [open]);

  return (
    <div className="notification-center" ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button 
        className="header-btn notification-btn" 
        onClick={() => setOpen((prev) => !prev)} 
        title="Notifications"
        aria-expanded={open}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge" style={{ position: "absolute", top: "-2px", right: "-2px" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header" style={{ display: "flex", alignItems: "center", justifyContent: "between" }}>
            <h3>Notifications</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {unreadCount > 0 && (
                <button className="btn-icon" onClick={markAllRead} title="Mark all read" style={{ display: "flex", alignItems: "center" }}>
                  <CheckCheck size={16} />
                </button>
              )}
              <button className="btn-icon" onClick={() => setOpen(false)} title="Close panel" style={{ display: "flex", alignItems: "center" }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet</p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div key={n._id} className={`notification-item ${n.isRead ? "" : "unread"}`} style={{ display: "flex", alignItems: "start", justifyContent: "space-between" }}>
                  <div className="notification-item-content" style={{ flex: 1, paddingRight: "12px" }}>
                    <strong style={{ display: "block", marginBottom: "2px" }}>{n.title}</strong>
                    <p style={{ margin: "0 0 4px 0" }}>{n.message}</p>
                    <span className="notification-time" style={{ display: "block" }}>{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  <div className="notification-item-actions" style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    {!n.isRead && (
                      <button className="btn-icon" onClick={() => markRead(n._id)} title="Mark read" style={{ display: "flex", alignItems: "center" }}>
                        <Check size={14} />
                      </button>
                    )}
                    <button className="btn-icon" onClick={() => removeNotification(n._id)} title="Delete" style={{ display: "flex", alignItems: "center" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link to="/notifications" className="notification-view-all" onClick={() => setOpen(false)} style={{ display: "block", textAlign: "center" }}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;