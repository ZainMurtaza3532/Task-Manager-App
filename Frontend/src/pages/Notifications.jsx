import React from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import { formatRelativeTime } from "../utils/helpers";

const NotificationsPage = () => {
  const { notifications, unreadCount, loading, markRead, markAllRead, removeNotification } = useNotifications();

  return (
    <div className="page notifications-page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Bell size={28} /> Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} />
          <h3>All caught up!</h3>
          <p>No notifications to show</p>
        </div>
      ) : (
        <div className="notifications-full-list">
          {notifications.map((n) => (
            <div key={n._id} className={`notification-full-item ${n.isRead ? "" : "unread"}`}>
              <div className="notification-full-content">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span className="notification-time">{formatRelativeTime(n.createdAt)}</span>
              </div>
              <div className="notification-full-actions">
                {!n.isRead && (
                  <button className="btn btn-secondary btn-sm" onClick={() => markRead(n._id)}>
                    <Check size={14} /> Read
                  </button>
                )}
                <button className="btn-icon" onClick={() => removeNotification(n._id)}>
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
