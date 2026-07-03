import React from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { formatRelativeTime } from "../utils/helpers";

const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markRead, markAllRead, removeNotification } = useNotifications();

  return (
    <div className="page notifications-page">
      {/* Header container styled for crisp horizontal alignment */}
      <div 
        className="page-header" 
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
      >
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <Bell size={28} /> Notifications
          </h1>
          <p className="page-subtitle" style={{ margin: "4px 0 0 0" }}>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            className="btn btn-secondary" 
            onClick={markAllRead}
            style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
          >
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div 
          className="empty-state" 
          style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "60px 20px" }}
        >
          <Bell size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
          <h3 style={{ margin: "0 0 8px 0" }}>All caught up!</h3>
          <p style={{ margin: 0 }}>No notifications to show</p>
        </div>
      ) : (
        <div 
          className="notifications-full-list" 
          style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}
          aria-live="polite"
        >
          {notifications.map((n) => (
            <div 
              key={n._id} 
              className={`notification-full-item ${n.isRead ? "" : "unread"}`}
              style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "16px" }}
            >
              {/* minWidth: 0 prevents long text strings from overflowing text wraps */}
              <div className="notification-full-content" style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block", marginBottom: "4px", wordBreak: "break-word" }}>
                  {n.title}
                </strong>
                <p style={{ margin: "0 0 6px 0", wordBreak: "break-word" }}>
                  {n.message}
                </p>
                <span className="notification-time" style={{ display: "block", fontSize: "0.85em" }}>
                  {formatRelativeTime(n.createdAt)}
                </span>
              </div>

              {/* Keep buttons stacked nicely on a clean horizontal strip */}
              <div 
                className="notification-full-actions" 
                style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginTop: "2px" }}
              >
                {!n.isRead && (
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => markRead(n._id)}
                    style={{ display: "flex", alignItems: "center", gap: "4px" }}
                    title="Mark as read"
                  >
                    <Check size={14} /> Read
                  </button>
                )}
                <button 
                  className="btn-icon" 
                  onClick={() => removeNotification(n._id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;