import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  Keyboard,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useTasks } from "../context/TaskContext";
import { useWorkspace } from "../context/WorkspaceContext";
import AddTaskPreview from "../components/AddTaskPreview";
import { CATEGORIES } from "../utils/constants";

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const DUE_SHORTCUTS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "Next week", days: 7 },
];

const EMPTY = {
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

const AddTask = () => {
  const navigate = useNavigate();
  const { addTask } = useTasks();
  const { teams, currentWorkspace } = useWorkspace();
  const [form, setForm] = useState(EMPTY);
  const [tagDraft, setTagDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === form.team),
    [teams, form.team]
  );

  const assigneeOptions = useMemo(() => {
    if (selectedTeam?.members?.length) {
      return selectedTeam.members.map((m) => ({
        id: m.user?._id || m.user,
        name: m.user?.name || "Member",
      }));
    }
    return (currentWorkspace?.members || []).map((m) => ({
      id: m.user?._id || m.user,
      name: m.user?.name || "Member",
    }));
  }, [selectedTeam, currentWorkspace]);

  const assigneeName = useMemo(() => {
    const match = assigneeOptions.find((m) => m.id === form.assignee);
    return match?.name || null;
  }, [assigneeOptions, form.assignee]);

  const setField = useCallback((name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "team") next.assignee = "";
      return next;
    });
  }, []);

  const setDueShortcut = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setField("dueDate", d.toISOString().split("T")[0]);
  };

  const addSubTask = () => {
    setForm((prev) => ({
      ...prev,
      subTasks: [...prev.subTasks, { title: "", isCompleted: false }],
    }));
  };

  const updateSubTask = (index, title) => {
    setForm((prev) => {
      const subTasks = [...prev.subTasks];
      subTasks[index] = { ...subTasks[index], title };
      return { ...prev, subTasks };
    });
  };

  const toggleSubTask = (index) => {
    setForm((prev) => {
      const subTasks = [...prev.subTasks];
      subTasks[index] = { ...subTasks[index], isCompleted: !subTasks[index].isCompleted };
      return { ...prev, subTasks };
    });
  };

  const removeSubTask = (index) => {
    setForm((prev) => ({
      ...prev,
      subTasks: prev.subTasks.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase();
    if (!tag) return;
    setForm((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), tag])),
    }));
    setTagDraft("");
  };

  const removeTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  };

  const resetForm = () => {
    setForm(EMPTY);
    setTagDraft("");
  };

  const submit = useCallback(async (another = false) => {
    if (!form.title.trim() || loading) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        team: form.team || undefined,
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || null,
        subTasks: form.subTasks.filter((s) => s.title.trim()),
        estimatedMinutes: Number(form.estimatedMinutes) || 0,
      };
        const created = await addTask(payload);
        if (created) {
          if (another) {
            resetForm();
          } else {
            const taskId = created._id || created.id;
            navigate(taskId ? `/tasks/${taskId}` : "/tasks");
          }
        }
    } finally {
      setLoading(false);
    }
  }, [form, loading, addTask, navigate]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        submit(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit]);

  return (
    <div className="page add-task-page add-task-composer-page">
      <div className="add-task-composer-top">
        <Link to="/tasks" className="add-task-back">
          <ArrowLeft size={16} />
          Back to tasks
        </Link>
        <div className="add-task-composer-top-meta">
          <span className="add-task-live-pill">
            <span className="add-task-live-dot" /> Live preview
          </span>
          {currentWorkspace && (
            <span className="add-task-ws-chip">
              {currentWorkspace.name}
            </span>
          )}
        </div>
      </div>

      <header className="add-task-composer-header">
        <div>
          <p className="add-task-kicker">
            <Sparkles size={14} /> New work item
          </p>
          <h1 className="page-title">Create task</h1>
          <p className="page-subtitle">
            Write once — watch the card update live on the right.
          </p>
        </div>
        <div className="add-task-composer-header-hint">
          <Keyboard size={14} />
          <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
        </div>
      </header>

      <div className="add-task-composer-layout">
        <form
          className="add-task-composer card"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <div className="composer-main">
            <input
              className="composer-title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Task title"
              autoFocus
              required
              maxLength={100}
            />
            <textarea
              className="composer-description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Add description, context, or acceptance criteria…"
              rows={4}
            />
          </div>

          <div className="composer-props">
            <div className="composer-prop">
              <span className="composer-prop-label">Priority</span>
              <div className="priority-pills composer-priority">
                {PRIORITIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`priority-pill priority-pill--${value} ${form.priority === value ? "active" : ""}`}
                    onClick={() => setField("priority", value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="composer-prop">
              <span className="composer-prop-label">
                <CalendarDays size={13} /> Due
              </span>
              <div className="composer-due-row">
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={(e) => setField("dueDate", e.target.value)}
                />
                <div className="due-date-shortcuts">
                  {DUE_SHORTCUTS.map(({ label, days }) => (
                    <button
                      key={label}
                      type="button"
                      className="due-date-shortcut"
                      onClick={() => setDueShortcut(days)}
                    >
                      {label}
                    </button>
                  ))}
                  {form.dueDate && (
                    <button
                      type="button"
                      className="due-date-shortcut due-date-shortcut--clear"
                      onClick={() => setField("dueDate", "")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="composer-prop">
              <span className="composer-prop-label">
                <Tag size={13} /> Category
              </span>
              <div className="category-chips">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`category-chip ${form.category === c ? "active" : ""}`}
                    onClick={() => setField("category", c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="composer-prop-grid">
              <div className="composer-prop">
                <span className="composer-prop-label">
                  <Users size={13} /> Team
                </span>
                <select
                  className="form-select"
                  value={form.team}
                  onChange={(e) => setField("team", e.target.value)}
                >
                  <option value="">Personal</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="composer-prop">
                <span className="composer-prop-label">
                  <User size={13} /> Assignee
                </span>
                <select
                  className="form-select"
                  value={form.assignee}
                  onChange={(e) => setField("assignee", e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="composer-prop">
                <span className="composer-prop-label">
                  <Clock size={13} /> Estimate (min)
                </span>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={form.estimatedMinutes || ""}
                  onChange={(e) => setField("estimatedMinutes", e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>
          </div>

          <div className="composer-section">
            <div className="composer-section-head">
              <h3>
                <CheckCircle2 size={16} /> Subtasks
                {form.subTasks.length > 0 && (
                  <span>{form.subTasks.length}</span>
                )}
              </h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addSubTask}>
                <Plus size={14} /> Add
              </button>
            </div>
            {form.subTasks.length === 0 ? (
              <button type="button" className="composer-empty-add" onClick={addSubTask}>
                Break this into smaller steps…
              </button>
            ) : (
              <div className="subtask-list">
                {form.subTasks.map((st, index) => (
                  <div key={index} className="subtask-row">
                    <button
                      type="button"
                      className={`subtask-check ${st.isCompleted ? "checked" : ""}`}
                      onClick={() => toggleSubTask(index)}
                    >
                      {st.isCompleted && <CheckCircle2 size={14} />}
                    </button>
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => updateSubTask(index, e.target.value)}
                      className={`form-input subtask-input ${st.isCompleted ? "completed" : ""}`}
                      placeholder="Subtask"
                    />
                    <button
                      type="button"
                      className="subtask-remove-btn"
                      onClick={() => removeSubTask(index)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="composer-section">
            <div className="composer-section-head">
              <h3>
                <Hash size={16} /> Tags
              </h3>
            </div>
            <div className="composer-tag-row">
              <input
                className="form-input"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Type a tag and press Enter"
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                Add
              </button>
            </div>
            {(form.tags || []).length > 0 && (
              <div className="task-details-chips" style={{ marginTop: 10 }}>
                {form.tags.map((tag) => (
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

          <div className="composer-footer">
            <Link to="/tasks" className="btn btn-secondary">
              Cancel
            </Link>
            <div className="composer-footer-right">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={loading || !form.title.trim()}
                onClick={() => submit(true)}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Saving…
                  </>
                ) : (
                  "Create & add another"
                )}
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || !form.title.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" /> Creating…
                  </>
                ) : (
                  "Create task"
                )}
              </button>
            </div>
          </div>
        </form>

        <aside className="add-task-aside">
          <AddTaskPreview
            formData={form}
            teamName={selectedTeam?.name}
            assigneeName={assigneeName}
            teamColor={selectedTeam?.color}
          />
        </aside>
      </div>
    </div>
  );
};

export default AddTask;
