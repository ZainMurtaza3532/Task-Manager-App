import React, { useEffect, useMemo, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Hash,
  ListChecks,
  Tag,
  User,
  Users,
} from "lucide-react";
import { PRIORITIES, STATUSES } from "../utils/constants";

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const date = new Date(`${dueDate}T12:00:00`);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d, yyyy");
};

const AddTaskPreview = ({ formData = {}, assigneeName, teamName, teamColor }) => {
  const [pulseKey, setPulseKey] = useState(0);

  const title = formData.title || "";
  const description = formData.description || "";
  const priority = formData.priority || "medium";
  const tags = formData.tags || [];
  const subTasksRaw = formData.subTasks || [];

  const hasContent =
    title.trim() ||
    description.trim() ||
    subTasksRaw.some((s) => s.title?.trim()) ||
    tags.length > 0;

  const priorityMeta = PRIORITIES[priority] || PRIORITIES.medium;
  const statusMeta = STATUSES.pending;
  const dueLabel = formatDueDate(formData.dueDate);
  const subTasks = subTasksRaw.filter((s) => s.title?.trim());
  const subDone = subTasks.filter((s) => s.isCompleted).length;
  const subProgress = subTasks.length ? Math.round((subDone / subTasks.length) * 100) : 0;

  const completeness = useMemo(() => {
    let score = 0;
    if (title.trim()) score += 40;
    if (description.trim()) score += 15;
    if (formData.dueDate) score += 15;
    if (formData.category && formData.category !== "General") score += 5;
    if (formData.team || formData.assignee) score += 10;
    if (subTasks.length) score += 10;
    if (tags.length) score += 5;
    return Math.min(score, 100);
  }, [title, description, formData.dueDate, formData.category, formData.team, formData.assignee, subTasks.length, tags.length]);

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [
    formData.priority,
    formData.dueDate,
    formData.category,
    formData.team,
    formData.assignee,
    formData.estimatedMinutes,
    tags.length,
    subTasksRaw.length,
  ]);

  return (
    <div className="add-task-preview add-task-preview--rich card">
      <div className="add-task-preview-header">
        <Eye size={15} />
        <div>
          <h3>Live preview</h3>
          <p>Updates as you type</p>
        </div>
        <div className="preview-completeness" title="How complete this draft is">
          <svg viewBox="0 0 36 36" className="preview-ring">
            <path
              className="preview-ring-bg"
              d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"
            />
            <path
              className="preview-ring-fill"
              strokeDasharray={`${completeness}, 100`}
              d="M18 2.5a15.5 15.5 0 1 1 0 31 15.5 15.5 0 1 1 0-31"
            />
          </svg>
          <span>{completeness}%</span>
        </div>
      </div>

      {!hasContent ? (
        <div className="add-task-preview-empty">
          <div className="add-task-preview-empty-icon">
            <ListChecks size={22} />
          </div>
          <h4>Nothing to preview yet</h4>
          <p>Start with a title — your task card will appear here instantly.</p>
        </div>
      ) : (
        <div className={`preview-stage task-card-${priority}`} data-pulse={pulseKey}>
          <div className="preview-stage-glow" aria-hidden="true" />
          <div className="preview-card-shell">
            <div className="task-card-priority-bar" />
            <div className="preview-card-badges">
              <span
                className="badge"
                style={{ color: priorityMeta.color, background: priorityMeta.bgLight }}
              >
                {priorityMeta.label}
              </span>
              <span
                className="badge"
                style={{ color: statusMeta.color, background: statusMeta.bgLight }}
              >
                {statusMeta.label}
              </span>
              {teamName && (
                <span
                  className="task-team-badge"
                  style={{ borderColor: teamColor || "var(--accent)" }}
                >
                  <Users size={11} /> {teamName}
                </span>
              )}
            </div>

            <h4 className="add-task-preview-title">
              {title.trim() || "Untitled task"}
            </h4>

            {description.trim() ? (
              <p className="add-task-preview-desc">{description.trim()}</p>
            ) : (
              <p className="add-task-preview-desc muted">No description</p>
            )}

            {tags.length > 0 && (
              <div className="preview-tags">
                {tags.map((tag) => (
                  <span key={tag} className="task-tag-chip">
                    <Hash size={11} /> {tag}
                  </span>
                ))}
              </div>
            )}

            {subTasks.length > 0 && (
              <div className="preview-subtasks">
                <div className="preview-subtasks-head">
                  <span>
                    <ListChecks size={13} /> Subtasks
                  </span>
                  <span>
                    {subDone}/{subTasks.length} · {subProgress}%
                  </span>
                </div>
                <div className="task-subtask-bar">
                  <div className="task-subtask-fill" style={{ width: `${subProgress}%` }} />
                </div>
                <ul>
                  {subTasks.slice(0, 5).map((st, i) => (
                    <li key={i} className={st.isCompleted ? "done" : ""}>
                      <CheckCircle2 size={13} />
                      <span>{st.title}</span>
                    </li>
                  ))}
                  {subTasks.length > 5 && (
                    <li className="more">+{subTasks.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="preview-props">
              <div className="preview-prop">
                <Calendar size={13} />
                <div>
                  <label>Due</label>
                  <strong className={!dueLabel ? "muted" : ""}>
                    {dueLabel || "Not set"}
                  </strong>
                </div>
              </div>
              <div className="preview-prop">
                <Tag size={13} />
                <div>
                  <label>Category</label>
                  <strong>{formData.category || "General"}</strong>
                </div>
              </div>
              <div className="preview-prop">
                <User size={13} />
                <div>
                  <label>Assignee</label>
                  <strong className={!assigneeName ? "muted" : ""}>
                    {assigneeName || "Unassigned"}
                  </strong>
                </div>
              </div>
              <div className="preview-prop">
                <Clock size={13} />
                <div>
                  <label>Estimate</label>
                  <strong className={!formData.estimatedMinutes ? "muted" : ""}>
                    {formData.estimatedMinutes
                      ? `${formData.estimatedMinutes} min`
                      : "Not set"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTaskPreview;
