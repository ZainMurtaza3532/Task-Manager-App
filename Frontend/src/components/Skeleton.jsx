import React from "react";

export const Skeleton = ({ width = "100%", height = 16, className = "", style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
    aria-hidden="true"
  />
);

export const TaskDetailsSkeleton = () => (
  <div className="task-details-page">
    <div className="task-details-topbar">
      <Skeleton width={120} height={20} />
      <Skeleton width={180} height={32} />
    </div>
    <div className="task-details-layout">
      <div className="task-details-main">
        <Skeleton height={36} style={{ marginBottom: 16 }} />
        <Skeleton height={100} style={{ marginBottom: 24 }} />
        <Skeleton height={200} />
      </div>
      <aside className="task-details-sidebar">
        <Skeleton height={280} style={{ marginBottom: 16 }} />
        <Skeleton height={160} />
      </aside>
    </div>
  </div>
);

export default Skeleton;
