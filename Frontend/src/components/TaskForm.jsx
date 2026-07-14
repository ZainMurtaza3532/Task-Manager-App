import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTasks } from "../context/TaskContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Users,
  Plus,
  FileText,
  CalendarDays,
  ListChecks,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Hash,
} from "lucide-react";
import { CATEGORIES } from "../utils/constants";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const DUE_DATE_SHORTCUTS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
];

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: "medium",
  status: "pending",
  dueDate: "",
  category: "General",
  subTasks: [],
  team: "",
  assignee: "",
  tags: [],
  labels: [],
  estimatedMinutes: 0,
};

const TaskForm = ({
  initialData = null,
  onSuccess = null,
  variant = "modal",
  onFormChange = null,
}) => {
  const { addTask, editTask } = useTasks();
  const { teams, currentWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [expandedOptional, setExpandedOptional] = useState({
    team: false,
    subtasks: false,
    labels: false,
  });
  const [tagDraft, setTagDraft] = useState("");

  const isPage = variant === "page";
  const isEdit = !!(initialData && initialData._id);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        priority: initialData.priority || "medium",
        status: initialData.status || "pending",
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        category: initialData.category || "General",
        subTasks: initialData.subTasks || [],
        team: initialData.team?._id || initialData.team || "",
        assignee: initialData.assignee?._id || initialData.assignee || "",
        tags: initialData.tags || [],
        labels: initialData.labels || [],
        estimatedMinutes: initialData.estimatedMinutes || 0,
      });
      if (isPage) {
        setExpandedOptional({
          team: !!(initialData.team?._id || initialData.team),
          subtasks: !!(initialData.subTasks?.length),
          labels: !!(initialData.tags?.length || initialData.labels?.length),
        });
      }
    }
  }, [initialData, isPage]);

  useEffect(() => {
    onFormChange?.(formData);
  }, [formData, onFormChange]);

  useEffect(() => {
    if (!isPage || isEdit) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        document.getElementById("task-form-submit")?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPage, isEdit]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === formData.team),
    [teams, formData.team]
  );

  const assigneeOptions = useMemo(() => {
    if (selectedTeam?.members?.length) {
      return selectedTeam.members.map((m) => ({
        id: m.user?._id || m.user,
        name: m.user?.name || "Member",
        email: m.user?.email,
      }));
    }
    return (currentWorkspace?.members || []).map((m) => ({
      id: m.user?._id || m.user,
      name: m.user?.name || "Member",
      email: m.user?.email,
    }));
  }, [selectedTeam, currentWorkspace]);

  const completionPercent = useMemo(() => {
    let score = 0;
    if (formData.title.trim()) score += 50;
    if (formData.description.trim()) score += 15;
    if (formData.dueDate) score += 20;
    if (formData.category && formData.category !== "General") score += 5;
    if (formData.team || formData.assignee) score += 5;
    if (formData.subTasks.length > 0) score += 5;
    return Math.min(score, 100);
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM);
    setExpandedOptional({ team: false, subtasks: false, labels: false });
    setTagDraft("");
  }, []);

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase();
    if (!tag) return;
    setFormData((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), tag])),
    }));
    setTagDraft("");
    setExpandedOptional((prev) => ({ ...prev, labels: true }));
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "team") next.assignee = "";
      return next;
    });
  };

  const handlePriorityChange = (value) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const setDueDateShortcut = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFormData((prev) => ({
      ...prev,
      dueDate: d.toISOString().split("T")[0],
    }));
  };

  const clearDueDate = () => {
    setFormData((prev) => ({ ...prev, dueDate: "" }));
  };

  const handleSubTaskChange = (index, value) => {
    const updatedSubTasks = [...formData.subTasks];
    updatedSubTasks[index].title = value;
    setFormData((prev) => ({ ...prev, subTasks: updatedSubTasks }));
  };

  const addSubTask = () => {
    setExpandedOptional((prev) => ({ ...prev, subtasks: true }));
    setFormData((prev) => ({
      ...prev,
      subTasks: [...prev.subTasks, { title: "", isCompleted: false }],
    }));
  };

  const removeSubTask = (index) => {
    setFormData((prev) => ({
      ...prev,
      subTasks: prev.subTasks.filter((_, i) => i !== index),
    }));
  };

  const toggleOptional = (section) => {
    setExpandedOptional((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = async (e, createAnother = false) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        team: formData.team || undefined,
        assignee: formData.assignee || undefined,
        dueDate: formData.dueDate || null,
        tags: formData.tags || [],
        labels: formData.labels || [],
        estimatedMinutes: Number(formData.estimatedMinutes) || 0,
      };

      if (isEdit) {
        await editTask(initialData._id, payload);
        if (onSuccess) onSuccess();
      } else {
        const created = await addTask(payload);
        if (created) {
          if (createAnother) {
            resetForm();
          } else if (onSuccess) {
            onSuccess(created);
          } else if (created._id) {
            navigate(`/tasks/${created._id}`);
          } else {
            navigate("/tasks");
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className={`task-form ${isPage ? "task-form--page" : "task-form--modal"}`}
    >
      {isPage && !isEdit && (
        <div className="task-form-progress">
          <div className="task-form-progress-label">
            <span>Form progress</span>
            <span>{completionPercent}%</span>
          </div>
          <div className="task-form-progress-bar">
            <div
              className="task-form-progress-fill"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      <section className="task-form-block">
        <header className="task-form-block-header">
          <span className="task-form-block-step">1</span>
          <span className="task-form-block-icon">
            <FileText size={18} />
          </span>
          <div>
            <h3 className="task-form-block-title">Task details</h3>
            <p className="task-form-block-desc">What needs to be done?</p>
          </div>
        </header>

        <div className="form-group">
          <label className="form-label" htmlFor="task-title">
            Title <span className="required">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="form-input form-input-lg"
            placeholder="e.g. Prepare weekly status report"
            autoFocus={isPage && !isEdit}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-description">
            Description
            <span className="form-label-optional">optional</span>
          </label>
          <textarea
            id="task-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Add context, links, or acceptance criteria..."
            rows={isPage ? 4 : 3}
          />
        </div>
      </section>

      <section className="task-form-block">
        <header className="task-form-block-header">
          <span className="task-form-block-step">2</span>
          <span className="task-form-block-icon">
            <CalendarDays size={18} />
          </span>
          <div>
            <h3 className="task-form-block-title">Schedule & priority</h3>
            <p className="task-form-block-desc">When is it due and how urgent is it?</p>
          </div>
        </header>

        <div className="form-group">
          <span className="form-label">Priority</span>
          <div className="priority-pills" role="group" aria-label="Priority">
            {PRIORITIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`priority-pill priority-pill--${value} ${formData.priority === value ? "active" : ""
                  }`}
                onClick={() => handlePriorityChange(value)}
                aria-pressed={formData.priority === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-due-date">
            Due date
            <span className="form-label-optional">optional</span>
          </label>
          <div className="due-date-row">
            <input
              id="task-due-date"
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="form-input"
            />
            {isPage && (
              <div className="due-date-shortcuts">
                {DUE_DATE_SHORTCUTS.map(({ label, days }) => (
                  <button
                    key={label}
                    type="button"
                    className="due-date-shortcut"
                    onClick={() => setDueDateShortcut(days)}
                  >
                    {label}
                  </button>
                ))}
                {formData.dueDate && (
                  <button
                    type="button"
                    className="due-date-shortcut due-date-shortcut--clear"
                    onClick={clearDueDate}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <span className="form-label">Category</span>
          {isPage ? (
            <div className="category-chips" role="group" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`category-chip ${formData.category === c ? "active" : ""}`}
                  onClick={() => handleCategoryChange(c)}
                  aria-pressed={formData.category === c}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <select
              id="task-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-select"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="form-label" htmlFor="task-status">
              Status
            </label>
            <select
              id="task-status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-select"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}

        {isPage && (
          <div className="form-group">
            <label className="form-label" htmlFor="task-estimate">
              Time estimate (minutes)
              <span className="form-label-optional">optional</span>
            </label>
            <input
              id="task-estimate"
              type="number"
              min="0"
              name="estimatedMinutes"
              value={formData.estimatedMinutes || ""}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. 60"
            />
          </div>
        )}
      </section>

      <section
        className={`task-form-block task-form-block--collapsible ${expandedOptional.team ? "is-open" : ""
          }`}
      >
        <header className="task-form-block-header task-form-block-header--toggle">
          <div className="task-form-block-header-left">
            <span className="task-form-block-step">3</span>
            <span className="task-form-block-icon">
              <Users size={18} />
            </span>
            <div>
              <h3 className="task-form-block-title">Team & assignment</h3>
              <p className="task-form-block-desc">
                {expandedOptional.team
                  ? "Assign to a team member"
                  : "Optional — click to expand"}
              </p>
            </div>
          </div>
          {isPage && (
            <button
              type="button"
              className="section-toggle-btn"
              onClick={() => toggleOptional("team")}
              aria-expanded={expandedOptional.team}
            >
              {expandedOptional.team ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </header>

        {(!isPage || expandedOptional.team) && (
          <div className="task-form-block-body">
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="task-team">
                  Team
                </label>
                <select
                  id="task-team"
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Personal task</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="task-assignee">
                  <User size={14} aria-hidden="true" /> Assign to
                </label>
                <select
                  id="task-assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        className={`task-form-block task-form-block--collapsible ${expandedOptional.subtasks ? "is-open" : ""
          }`}
      >
        <header className="task-form-block-header task-form-block-header--row">
          <div className="task-form-block-header-left">
            <span className="task-form-block-step">4</span>
            <span className="task-form-block-icon">
              <ListChecks size={18} />
            </span>
            <div>
              <h3 className="task-form-block-title">
                Sub-tasks
                {formData.subTasks.length > 0 && (
                  <span className="task-form-block-count">{formData.subTasks.length}</span>
                )}
              </h3>
              <p className="task-form-block-desc">
                {expandedOptional.subtasks
                  ? "Break work into smaller steps"
                  : "Optional — click to expand"}
              </p>
            </div>
          </div>
          <div className="task-form-block-header-actions">
            {expandedOptional.subtasks && (
              <button type="button" className="subtask-add-btn" onClick={addSubTask}>
                <Plus size={14} /> Add item
              </button>
            )}
            {isPage && (
              <button
                type="button"
                className="section-toggle-btn"
                onClick={() => toggleOptional("subtasks")}
                aria-expanded={expandedOptional.subtasks}
              >
                {expandedOptional.subtasks ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
            )}
          </div>
        </header>

        {(!isPage || expandedOptional.subtasks) && (
          <div className="task-form-block-body">
            {formData.subTasks.length === 0 ? (
              <div className="subtask-empty">
                <ListChecks size={20} />
                <p>No sub-tasks yet</p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addSubTask}>
                  <Plus size={14} /> Add first sub-task
                </button>
              </div>
            ) : (
              <div className="subtask-list">
                {formData.subTasks.map((st, index) => (
                  <div key={index} className="subtask-row">
                    <button
                      type="button"
                      className={`subtask-check ${st.isCompleted ? "checked" : ""}`}
                      onClick={() => {
                        const updated = [...formData.subTasks];
                        updated[index].isCompleted = !updated[index].isCompleted;
                        setFormData((prev) => ({ ...prev, subTasks: updated }));
                      }}
                      aria-label={st.isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                      {st.isCompleted && <CheckCircle2 size={14} />}
                    </button>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => handleSubTaskChange(index, e.target.value)}
                      className={`form-input subtask-input ${st.isCompleted ? "completed" : ""}`}
                      placeholder="Sub-task title"
                      required
                    />
                    <button
                      type="button"
                      className="subtask-remove-btn"
                      onClick={() => removeSubTask(index)}
                      aria-label="Remove sub-task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section
        className={`task-form-block task-form-block--collapsible ${expandedOptional.labels ? "is-open" : ""}`}
      >
        <header className="task-form-block-header task-form-block-header--toggle">
          <div className="task-form-block-header-left">
            <span className="task-form-block-step">5</span>
            <span className="task-form-block-icon">
              <Hash size={18} />
            </span>
            <div>
              <h3 className="task-form-block-title">Tags</h3>
              <p className="task-form-block-desc">
                {expandedOptional.labels ? "Organize with searchable tags" : "Optional — click to expand"}
              </p>
            </div>
          </div>
          {isPage && (
            <button
              type="button"
              className="section-toggle-btn"
              onClick={() => toggleOptional("labels")}
              aria-expanded={expandedOptional.labels}
            >
              {expandedOptional.labels ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </header>

        {(!isPage || expandedOptional.labels) && (
          <div className="task-form-block-body">
            <div className="task-details-inline-add">
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="form-input"
                placeholder="Add a tag and press Enter"
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                <Plus size={14} /> Add
              </button>
            </div>
            {(formData.tags || []).length > 0 && (
              <div className="task-details-chips" style={{ marginTop: 12 }}>
                {formData.tags.map((tag) => (
                  <span key={tag} className="task-tag-chip">
                    <Hash size={12} /> {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label="Remove tag">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className={`form-actions ${isPage ? "form-actions--page" : ""}`}>
        {isPage && !onSuccess && (
          <div className="form-actions-left">
            <Link to="/tasks" className="btn btn-secondary">
              Cancel
            </Link>
            {isPage && !isEdit && (
              <span className="form-kbd-hint">
                <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to save
              </span>
            )}
          </div>
        )}
        {onSuccess && (
          <button type="button" className="btn btn-secondary" onClick={onSuccess}>
            Cancel
          </button>
        )}
        <div className="form-actions-right">
          {isPage && !isEdit && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading || !formData.title.trim()}
              onClick={(e) => handleSubmit(e, true)}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Saving...
                </>
              ) : (
                "Create & add another"
              )}
            </button>
          )}
          <button
            id="task-form-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" /> Saving...
              </>
            ) : isEdit ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
