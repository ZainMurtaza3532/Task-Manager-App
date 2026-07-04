import React from "react";
import { Edit2, Trash2, RotateCcw, XCircle, Calendar, Tag, CheckCircle, CheckSquare, User, Users } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const TaskCard = ({ task, onEdit, onDelete, onRestore, onPermanentDelete, onComplete, isTrash, showAssignee = true }) => {
  const getPriorityBadge = (priority) => {
    const map = {
      high: "badge-priority-high",
      medium: "badge-priority-medium",
      low: "badge-priority-low",
    };
    return (
      <span className={`badge ${map[priority] || map.medium}`}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "badge-status-pending",
      "in-progress": "badge-status-in-progress",
      completed: "badge-status-completed",
    };
    const labels = { pending: "Pending", "in-progress": "In Progress", completed: "Completed" };
    return <span className={`badge ${map[status]}`}>{labels[status] || status}</span>;
  };

  const getDateClass = (dueDate, status) => {
    if (!dueDate || status === "completed") return "due-completed";
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "due-overdue";
    if (isToday(date)) return "due-today";
    return "due-normal";
  };

  const subtotal = task.subTasks?.length || 0;
  const subDone = task.subTasks?.filter((s) => s.isCompleted).length || 0;

  return (
    <div className={`task-card task-card-${task.priority || "medium"}`}>
      <div className="task-card-priority-bar" />

      <div className="task-card-header">
        <h3 className="task-card-title">{task.title}</h3>
        <div className="task-card-actions">
          {!isTrash ? (
            <>
              {task.status !== "completed" && onComplete && (
                <button type="button" className="task-action-btn" onClick={() => onComplete(task)} title="Complete">
                  <CheckCircle size={14} />
                </button>
              )}
              {onEdit && (
                <button type="button" className="task-action-btn" onClick={() => onEdit(task)} title="Edit">
                  <Edit2 size={14} />
                </button>
              )}
              {onDelete && (
                <button type="button" className="task-action-btn delete-btn" onClick={() => onDelete(task._id)} title="Trash">
                  <Trash2 size={14} />
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" className="task-action-btn restore-btn" onClick={() => onRestore(task._id)} title="Restore">
                <RotateCcw size={14} />
              </button>
              <button type="button" className="task-action-btn delete-btn" onClick={() => onPermanentDelete(task._id)} title="Delete">
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="task-card-meta">
        {getPriorityBadge(task.priority)}
        {getStatusBadge(task.status)}
      </div>

      {task.description && (
        <p className="task-card-desc">{task.description}</p>
      )}

      {subtotal > 0 && (
        <div className="task-subtask-progress">
          <div className="task-subtask-bar">
            <div className="task-subtask-fill" style={{ width: `${Math.round((subDone / subtotal) * 100)}%` }} />
          </div>
          <span><CheckSquare size={12} /> {subDone}/{subtotal} sub-tasks</span>
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-card-footer-left">
          <span className="task-category">
            <Tag size={12} />
            {task.category || "General"}
          </span>
          {task.dueDate && (
            <span className={`task-date ${getDateClass(task.dueDate, task.status)}`}>
              <Calendar size={12} />
              {format(new Date(task.dueDate), "MMM dd, yyyy")}
            </span>
          )}
        </div>

        {showAssignee && (task.assignee || task.team) && (
          <div className="task-card-assign-row">
            {task.team && (
              <span className="task-team-badge" style={{ borderColor: task.team.color }}>
                <Users size={11} />
                {task.team.name}
              </span>
            )}
            {task.assignee && (
              <span className="task-assignee-badge" title={task.assignee.email}>
                <span className="task-assignee-avatar">{task.assignee.name?.charAt(0) || "?"}</span>
                {task.assignee.name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
