import React from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, Tag, User, Users, ListChecks, Sparkles } from "lucide-react";
import { PRIORITIES } from "../utils/constants";

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const date = new Date(dueDate + "T12:00:00");
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d, yyyy");
};

const AddTaskPreview = ({ formData, assigneeName, teamName }) => {
  const hasContent = formData.title?.trim() || formData.description?.trim();
  const priorityMeta = PRIORITIES[formData.priority] || PRIORITIES.medium;
  const dueLabel = formatDueDate(formData.dueDate);
  const subCount = formData.subTasks?.length || 0;

  return (
    <div className="add-task-preview card">
      <div className="add-task-preview-header">
        <Sparkles size={16} />
        <h3>Live preview</h3>
      </div>

      {!hasContent ? (
        <div className="add-task-preview-empty">
          <div className="add-task-preview-empty-icon">
            <ListChecks size={22} />
          </div>
          <p>Start typing a title to see how your task will look.</p>
        </div>
      ) : (
        <div className={`add-task-preview-card task-card-${formData.priority || "medium"}`}>
          <div className="task-card-priority-bar" />
          <h4 className="add-task-preview-title">
            {formData.title.trim() || "Untitled task"}
          </h4>
          {formData.description?.trim() && (
            <p className="add-task-preview-desc">{formData.description.trim()}</p>
          )}
          <div className="add-task-preview-meta">
            <span
              className="badge"
              style={{
                color: priorityMeta.color,
                background: priorityMeta.bgLight,
              }}
            >
              {priorityMeta.label}
            </span>
            <span className="badge badge-status-pending">Pending</span>
          </div>
          <div className="add-task-preview-details">
            {dueLabel && (
              <span className="add-task-preview-detail">
                <Calendar size={13} /> {dueLabel}
              </span>
            )}
            {formData.category && (
              <span className="add-task-preview-detail">
                <Tag size={13} /> {formData.category}
              </span>
            )}
            {teamName && (
              <span className="add-task-preview-detail">
                <Users size={13} /> {teamName}
              </span>
            )}
            {assigneeName && (
              <span className="add-task-preview-detail">
                <User size={13} /> {assigneeName}
              </span>
            )}
            {subCount > 0 && (
              <span className="add-task-preview-detail">
                <ListChecks size={13} /> {subCount} sub-task{subCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="add-task-tip add-task-tip--inline">
        <h3>Quick tips</h3>
        <ul>
          <li>Use action-oriented titles</li>
          <li>Set a due date for calendar sync</li>
          <li>Break big tasks into sub-tasks</li>
        </ul>
      </div>
    </div>
  );
};

export default AddTaskPreview;
