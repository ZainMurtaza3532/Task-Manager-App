import React from "react";
import { GripVertical, Calendar, CheckSquare, User, Edit2, Trash2, CheckCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const priorityColors = {
  high: "var(--priority-high)",
  medium: "var(--priority-medium)",
  low: "var(--priority-low)",
};

const KanbanCard = ({ task, onEdit, onDelete, onComplete, isDragging }) => {
  const subtotal = task.subTasks?.length || 0;
  const subDone = task.subTasks?.filter((s) => s.isCompleted).length || 0;
  const progress = subtotal > 0 ? Math.round((subDone / subtotal) * 100) : 0;

  const getDueClass = () => {
    if (!task.dueDate || task.status === "completed") return "";
    const date = new Date(task.dueDate);
    if (isPast(date) && !isToday(date)) return "overdue";
    if (isToday(date)) return "today";
    return "";
  };

  return (
    <div className={`kanban-card ${isDragging ? "dragging" : ""}`}>
      <div className="kanban-card-stripe" style={{ background: priorityColors[task.priority] || priorityColors.medium }} />

      <div className="kanban-card-body">
        <div className="kanban-card-top">
          <span className="kanban-drag-handle" title="Drag to move">
            <GripVertical size={14} />
          </span>
          <div className="kanban-card-actions">
            {task.status !== "completed" && onComplete && (
              <button type="button" className="kanban-action-btn success" onClick={() => onComplete(task)} title="Complete">
                <CheckCircle size={13} />
              </button>
            )}
            {onEdit && (
              <button type="button" className="kanban-action-btn" onClick={() => onEdit(task)} title="Edit">
                <Edit2 size={13} />
              </button>
            )}
            {onDelete && (
              <button type="button" className="kanban-action-btn danger" onClick={() => onDelete(task._id)} title="Delete">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        <h4 className="kanban-card-title">{task.title}</h4>

        {task.description && (
          <p className="kanban-card-desc">{task.description}</p>
        )}

        {subtotal > 0 && (
          <div className="kanban-subtask-bar">
            <div className="kanban-subtask-track">
              <div className="kanban-subtask-fill" style={{ width: `${progress}%` }} />
            </div>
            <span><CheckSquare size={11} /> {subDone}/{subtotal}</span>
          </div>
        )}

        <div className="kanban-card-footer">
          <div className="kanban-card-tags">
            <span className={`kanban-priority-tag ${task.priority}`}>{task.priority}</span>
            {task.category && <span className="kanban-category-tag">{task.category}</span>}
          </div>

          <div className="kanban-card-meta-right">
            {task.dueDate && (
              <span className={`kanban-due-date ${getDueClass()}`}>
                <Calendar size={11} />
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
            {task.assignee && (
              <span className="kanban-assignee" title={task.assignee.name}>
                <span className="kanban-assignee-avatar">
                  {task.assignee.name?.charAt(0) || <User size={10} />}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
