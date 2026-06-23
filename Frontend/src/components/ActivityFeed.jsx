import React from "react";
import { formatRelativeTime } from "../utils/helpers";

const ActivityFeed = ({ activities = [] }) => {
  if (!activities.length) {
    return <p className="activity-empty">No recent activity</p>;
  }

  return (
    <div className="activity-feed">
      {activities.map((activity) => (
        <div key={activity._id} className="activity-item">
          <div className="activity-avatar">
            {activity.actor?.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="activity-content">
            <p>
              <strong>{activity.actor?.name || "Someone"}</strong>{" "}
              {activity.description}
            </p>
            <span className="activity-time">{formatRelativeTime(activity.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
