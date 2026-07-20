import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Hash,
  ListChecks,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Tag,
  Timer,
  Trash2,
  User,
  Users,
  Activity,
  X,
} from "lucide-react";
import {
  addTaskComment,
  deleteTaskComment,
  fetchTaskActivity,
  fetchTaskById,
  fetchTaskComments,
  fetchTaskTimeLogs,
  startTimer,
  updateTask,
} from "../services/api";
import { joinTaskRoom, leaveTaskRoom, emitCommentTyping } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useTasks } from "../context/TaskContext";
import { useToast } from "../context/ToastContext";
import { useWorkspace } from "../context/WorkspaceContext";
import FileUpload from "../components/FileUpload";
import { TaskDetailsSkeleton } from "../components/Skeleton";
import { LABEL_COLORS, PRIORITIES, STATUSES } from "../utils/constants";

const TaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trashTask } = useTasks();
  const { teams, currentWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const { subscribe, connected } = useSocket();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [newSubtask, setNewSubtask] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[4]);
  const [typingUser, setTypingUser] = useState(null);
  const commentEndRef = useRef(null);
  const typingTimeout = useRef(null);

  const loadTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const taskRes = await fetchTaskById(id);
      if (!taskRes?.data) {
        throw new Error("Task not found");
      }
      setTask(taskRes.data);

      const [commentsRes, activityRes, timeRes] = await Promise.all([
        fetchTaskComments(id).catch(() => ({ data: [] })),
        fetchTaskActivity(id).catch(() => ({ data: [] })),
        fetchTaskTimeLogs(id).catch(() => ({ data: [] })),
      ]);
      setComments(commentsRes.data || []);
      setActivity(activityRes.data || []);
      setTimeLogs(timeRes.data?.entries || (Array.isArray(timeRes.data) ? timeRes.data : []));
    } catch {
      addToast("Task not found", "error");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  }, [id, addToast, navigate]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  useEffect(() => {
    joinTaskRoom(id);
    return () => leaveTaskRoom(id);
  }, [id]);

  useEffect(() => {
    const unsubComment = subscribe("task_comment", ({ taskId, comment }) => {
      if (taskId !== id) return;
      setComments((prev) => (prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]));
    });
    const unsubTyping = subscribe("comment_typing", ({ taskId, userId, userName, isTyping }) => {
      if (taskId !== id || userId === user?._id) return;
      setTypingUser(isTyping ? userName : null);
    });
    const unsubTask = subscribe("task_update", (payload) => {
      if (payload?.task?._id === id || payload?._id === id) {
        fetchTaskById(id).then((r) => setTask(r.data)).catch(() => {});
        fetchTaskActivity(id).then((r) => setActivity(r.data || [])).catch(() => {});
      }
    });
    return () => {
      unsubComment();
      unsubTyping();
      unsubTask();
    };
  }, [subscribe, id, user?._id]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === (task?.team?._id || task?.team)),
    [teams, task]
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

  const saveField = async (patch) => {
    if (!task) return;
    setSaving(true);
    try {
      const res = await updateTask(task._id, patch);
      setTask(res.data);
      const act = await fetchTaskActivity(task._id);
      setActivity(act.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update", "error");
      await loadTask();
    } finally {
      setSaving(false);
    }
  };

  const handleTitleBlur = (e) => {
    const title = e.target.value.trim();
    if (title && title !== task.title) saveField({ title });
  };

  const handleDescriptionBlur = (e) => {
    const description = e.target.value;
    if (description !== (task.description || "")) saveField({ description });
  };

  const toggleSubtask = async (index) => {
    const subTasks = task.subTasks.map((st, i) =>
      i === index ? { ...st, isCompleted: !st.isCompleted } : st
    );
    setTask((prev) => ({ ...prev, subTasks }));
    await saveField({ subTasks });
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const subTasks = [...(task.subTasks || []), { title: newSubtask.trim(), isCompleted: false }];
    setNewSubtask("");
    setTask((prev) => ({ ...prev, subTasks }));
    await saveField({ subTasks });
  };

  const removeSubtask = async (index) => {
    const subTasks = task.subTasks.filter((_, i) => i !== index);
    setTask((prev) => ({ ...prev, subTasks }));
    await saveField({ subTasks });
  };

  const addTag = async () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const tags = Array.from(new Set([...(task.tags || []), tag]));
    setTagInput("");
    await saveField({ tags });
  };

  const removeTag = async (tag) => {
    await saveField({ tags: (task.tags || []).filter((t) => t !== tag) });
  };

  const addLabel = async () => {
    if (!labelName.trim()) return;
    const labels = [...(task.labels || []), { name: labelName.trim(), color: labelColor }];
    setLabelName("");
    await saveField({ labels });
  };

  const removeLabel = async (idx) => {
    await saveField({ labels: (task.labels || []).filter((_, i) => i !== idx) });
  };

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
    emitCommentTyping(id, true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitCommentTyping(id, false), 1200);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || posting) return;
    setPosting(true);
    emitCommentTyping(id, false);
    try {
      const res = await addTaskComment(id, { content: commentText.trim() });
      setComments((prev) => (prev.some((c) => c._id === res.data._id) ? prev : [...prev, res.data]));
      setCommentText("");
      const act = await fetchTaskActivity(id);
      setActivity(act.data || []);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to post comment", "error");
    } finally {
      setPosting(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await deleteTaskComment(id, commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      addToast("Failed to delete comment", "error");
    }
  };

  const handleStartTimer = async () => {
    try {
      await startTimer({ taskId: task._id, workspaceId: task.workspace || currentWorkspace?._id });
      addToast("Timer started", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Could not start timer", "error");
    }
  };

  const handleDelete = async () => {
    await trashTask(task._id);
    navigate("/tasks");
  };

  if (loading) return <TaskDetailsSkeleton />;
  if (!task) return null;

  const dueClass = (() => {
    if (!task.dueDate || task.status === "completed") return "";
    const d = new Date(task.dueDate);
    if (Number.isNaN(d.getTime())) return "";
    if (isPast(d) && !isToday(d)) return "overdue";
    if (isToday(d)) return "today";
    return "";
  })();

  const dueDateValue = (() => {
    if (!task.dueDate) return "";
    const d = new Date(task.dueDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  })();

  const subtotal = task.subTasks?.length || 0;
  const subDone = task.subTasks?.filter((s) => s.isCompleted).length || 0;
  const progress = subtotal > 0 ? Math.round((subDone / subtotal) * 100) : 0;

  return (
    <div className="task-details-page">
      <div className="task-details-topbar">
        <Link to="/tasks" className="task-details-back">
          <ArrowLeft size={16} /> All tasks
        </Link>
        <div className="task-details-topbar-actions">
          {connected && <span className="presence-live-dot" title="Live updates on" />}
          {saving && (
            <span className="task-details-saving">
              <Loader2 size={14} className="spin" /> Saving
            </span>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleStartTimer}>
            <Timer size={14} /> Track time
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDelete}>
            <Trash2 size={14} /> Trash
          </button>
        </div>
      </div>

      <div className="task-details-layout">
        <div className="task-details-main">
          <div className="task-details-hero card">
            <div className="task-details-badges">
              <span className={`badge badge-priority-${task.priority}`}>{PRIORITIES[task.priority]?.label || task.priority}</span>
              <span className={`badge badge-status-${task.status}`}>{STATUSES[task.status]?.label || task.status}</span>
              {task.team && (
                <span className="task-team-badge" style={{ borderColor: task.team.color }}>
                  <Users size={11} /> {task.team.name}
                </span>
              )}
            </div>

            <input
              className="task-details-title-input"
              defaultValue={task.title}
              key={`title-${task._id}-${task.updatedAt}`}
              onBlur={handleTitleBlur}
              aria-label="Task title"
            />

            <textarea
              className="task-details-desc-input"
              defaultValue={task.description || ""}
              key={`desc-${task._id}-${task.updatedAt}`}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description..."
              rows={4}
            />

            {(task.labels?.length > 0 || task.tags?.length > 0) && (
              <div className="task-details-chips">
                {task.labels?.map((label, i) => (
                  <span key={`${label.name}-${i}`} className="task-label-chip" style={{ background: `${label.color}22`, color: label.color, borderColor: label.color }}>
                    {label.name}
                    <button type="button" onClick={() => removeLabel(i)} aria-label="Remove label"><X size={12} /></button>
                  </span>
                ))}
                {task.tags?.map((tag) => (
                  <span key={tag} className="task-tag-chip">
                    <Hash size={12} /> {tag}
                    <button type="button" onClick={() => removeTag(tag)} aria-label="Remove tag"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <section className="card task-details-section">
            <div className="task-details-section-header">
              <h3><ListChecks size={18} /> Subtasks {subtotal > 0 && <span>{subDone}/{subtotal}</span>}</h3>
              {subtotal > 0 && (
                <div className="task-subtask-progress compact">
                  <div className="task-subtask-bar"><div className="task-subtask-fill" style={{ width: `${progress}%` }} /></div>
                  <span>{progress}%</span>
                </div>
              )}
            </div>
            <div className="subtask-list">
              {(task.subTasks || []).map((st, index) => (
                <div key={st._id || index} className="subtask-row">
                  <button
                    type="button"
                    className={`subtask-check ${st.isCompleted ? "checked" : ""}`}
                    onClick={() => toggleSubtask(index)}
                  >
                    {st.isCompleted && <CheckCircle2 size={14} />}
                  </button>
                  <span className={`subtask-input ${st.isCompleted ? "completed" : ""}`} style={{ flex: 1 }}>
                    {st.title}
                  </span>
                  <button type="button" className="subtask-remove-btn" onClick={() => removeSubtask(index)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="task-details-inline-add">
              <input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubtask())}
                placeholder="Add a subtask..."
                className="form-input"
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addSubtask}>
                <Plus size={14} /> Add
              </button>
            </div>
          </section>

          <section className="card task-details-section">
            <div className="task-details-section-header">
              <h3><Paperclip size={18} /> Attachments</h3>
            </div>
            <FileUpload
              taskId={task._id}
              attachments={task.attachments || []}
              onUpdate={(next) => setTask((prev) => ({ ...prev, attachments: next }))}
            />
          </section>

          <section className="card task-details-section">
            <div className="task-details-tabs">
              <button
                type="button"
                className={activeTab === "comments" ? "active" : ""}
                onClick={() => setActiveTab("comments")}
              >
                <MessageSquare size={16} /> Comments ({comments.length})
              </button>
              <button
                type="button"
                className={activeTab === "activity" ? "active" : ""}
                onClick={() => setActiveTab("activity")}
              >
                <Activity size={16} /> Activity
              </button>
            </div>

            {activeTab === "comments" ? (
              <div className="task-comments">
                <div className="task-comments-list">
                  {comments.length === 0 && (
                    <p className="task-comments-empty">No comments yet. Start the conversation.</p>
                  )}
                  {comments.map((c) => (
                    <div key={c._id} className="task-comment">
                      <div className="task-comment-avatar">{c.author?.name?.charAt(0) || "?"}</div>
                      <div className="task-comment-body">
                        <div className="task-comment-meta">
                          <strong>{c.author?.name || "User"}</strong>
                          <span>{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                          {c.isEdited && <span className="edited">edited</span>}
                          {c.author?._id === user?._id && (
                            <button type="button" className="btn-icon" onClick={() => removeComment(c._id)} title="Delete">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <p>{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentEndRef} />
                </div>
                {typingUser && <p className="comment-typing">{typingUser} is typing…</p>}
                <form className="task-comment-form" onSubmit={submitComment}>
                  <textarea
                    value={commentText}
                    onChange={handleCommentChange}
                    placeholder="Write a comment…"
                    rows={3}
                    className="form-textarea"
                  />
                  <button type="submit" className="btn btn-primary" disabled={posting || !commentText.trim()}>
                    {posting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                    Post
                  </button>
                </form>
              </div>
            ) : (
              <div className="task-activity-timeline">
                {activity.length === 0 && <p className="task-comments-empty">No activity yet.</p>}
                {activity.map((item) => (
                  <div key={item._id} className="task-activity-item">
                    <div className="task-activity-dot" />
                    <div>
                      <p>
                        <strong>{item.actor?.name || "Someone"}</strong> {item.description}
                      </p>
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="task-details-sidebar">
          <div className="card task-details-props">
            <h3>Properties</h3>

            <label className="prop-field">
              <span><Flag size={14} /> Status</span>
              <select
                className="form-select"
                value={task.status}
                onChange={(e) => saveField({ status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="prop-field">
              <span><Flag size={14} /> Priority</span>
              <select
                className="form-select"
                value={task.priority}
                onChange={(e) => saveField({ priority: e.target.value })}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>

            <label className="prop-field">
              <span><Calendar size={14} /> Due date</span>
              <input
                type="date"
                className={`form-input ${dueClass}`}
                value={dueDateValue}
                onChange={(e) => saveField({ dueDate: e.target.value || null })}
              />
            </label>

            <label className="prop-field">
              <span><Tag size={14} /> Category</span>
              <input
                className="form-input"
                value={task.category || "General"}
                onChange={(e) => setTask((prev) => ({ ...prev, category: e.target.value }))}
                onBlur={(e) => saveField({ category: e.target.value || "General" })}
              />
            </label>

            <label className="prop-field">
              <span><Users size={14} /> Team</span>
              <select
                className="form-select"
                value={task.team?._id || task.team || ""}
                onChange={(e) => saveField({ team: e.target.value || null, assignee: null })}
              >
                <option value="">Personal</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </label>

            <label className="prop-field">
              <span><User size={14} /> Assignee</span>
              <select
                className="form-select"
                value={task.assignee?._id || task.assignee || ""}
                onChange={(e) => saveField({ assignee: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {assigneeOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>

            <label className="prop-field">
              <span><Clock size={14} /> Estimate (min)</span>
              <input
                type="number"
                min="0"
                className="form-input"
                value={task.estimatedMinutes || 0}
                onChange={(e) => setTask((prev) => ({ ...prev, estimatedMinutes: Number(e.target.value) }))}
                onBlur={(e) => saveField({ estimatedMinutes: Number(e.target.value) || 0 })}
              />
            </label>

            <div className="prop-meta">
              <p>Created {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy") : "—"}</p>
              <p>Updated {task.updatedAt ? formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true }) : "—"}</p>
              {task.createdBy && <p>By {task.createdBy.name}</p>}
            </div>
          </div>

          <div className="card task-details-props">
            <h3><Tag size={16} /> Labels</h3>
            <div className="task-details-inline-add">
              <input
                className="form-input"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="Label name"
              />
              <input
                type="color"
                value={labelColor}
                onChange={(e) => setLabelColor(e.target.value)}
                title="Color"
                className="label-color-picker"
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLabel}>
                <Plus size={14} />
              </button>
            </div>
            <div className="label-swatches">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`label-swatch ${labelColor === c ? "active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setLabelColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          <div className="card task-details-props">
            <h3><Hash size={16} /> Tags</h3>
            <div className="task-details-inline-add">
              <input
                className="form-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag"
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="card task-details-props">
            <h3><Timer size={16} /> Time logged</h3>
            <p className="time-logged-total">
              {Math.round((task.loggedMinutes || 0) / 60 * 10) / 10}h logged
              {task.estimatedMinutes > 0 && ` / ${Math.round(task.estimatedMinutes / 60 * 10) / 10}h estimated`}
            </p>
            <ul className="time-log-list">
              {timeLogs.slice(0, 5).map((log) => (
                <li key={log._id}>
                  <span>{Math.round((log.duration || 0) / 60)} min</span>
                  <span>{log.createdAt ? format(new Date(log.createdAt), "MMM d") : ""}</span>
                </li>
              ))}
              {timeLogs.length === 0 && <li className="muted">No time entries yet</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TaskDetails;
