import React, { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Plus,
  Clock,
  BarChart3,
  Wifi,
  Trash2,
  X,
  Timer,
  TrendingUp,
  List,
  Filter,
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTimer } from "../hooks/useTimer";
import { useTasks } from "../context/TaskContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import {
  fetchTimeEntries,
  fetchTimeReports,
  createManualTimeEntry,
  deleteTimeEntry,
} from "../services/api";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const formatDuration = (seconds) => {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const TimeTracking = () => {
  const { tasks } = useTasks();
  const { entry, formatted, isRunning, isPaused, loading, start, pause, resume, stop } = useTimer();
  const { connected, subscribe } = useSocket();
  const { resolvedTheme } = useTheme();
  const { addToast } = useToast();

  const [selectedTask, setSelectedTask] = useState("");
  const [timerNote, setTimerNote] = useState("");
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("week");
  const [showManual, setShowManual] = useState(false);
  const [taskFilter, setTaskFilter] = useState("all");
  const [manual, setManual] = useState({ taskId: "", startTime: "", endTime: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.12)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  const loadData = useCallback(async () => {
    try {
      const [entriesRes, reportRes] = await Promise.all([
        fetchTimeEntries({ limit: 50 }),
        fetchTimeReports(period),
      ]);
      setEntries(entriesRes.data || []);
      setReport(reportRes.data);
    } catch {
      // API unavailable
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData, entry]);

  useEffect(() => {
    const refreshData = () => loadData();
    const unsubs = [
      subscribe("time_entry_created", refreshData),
      subscribe("time_entry_updated", refreshData),
      subscribe("time_entry_deleted", refreshData),
    ];
    return () => unsubs.forEach((unsub) => unsub && unsub());
  }, [subscribe, loadData]);

  const handleStart = async () => {
    if (!selectedTask) {
      addToast("Select a task first", "error");
      return;
    }
    await start(selectedTask, timerNote);
    addToast("Timer started", "success");
  };

  const handleStop = async () => {
    await stop();
    addToast("Timer stopped — entry saved", "success");
    loadData();
  };

  const handleManual = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createManualTimeEntry(manual);
      addToast("Time entry added", "success");
      setShowManual(false);
      setManual({ taskId: "", startTime: "", endTime: "", description: "" });
      loadData();
    } catch {
      addToast("Failed to add entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this time entry?")) return;
    try {
      await deleteTimeEntry(id);
      setEntries((prev) => prev.filter((x) => x._id !== id));
      addToast("Entry deleted", "success");
      loadData();
    } catch {
      addToast("Failed to delete entry", "error");
    }
  };

  const filteredEntries =
    taskFilter === "all" ? entries : entries.filter((e) => e.task?._id === taskFilter);

  const todaySeconds = entries
    .filter((e) => {
      const d = new Date(e.startTime);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    })
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const chartData = {
    labels: report?.dailyBreakdown?.map((d) => d.date) || [],
    datasets: [
      {
        label: "Hours",
        data: report?.dailyBreakdown?.map((d) => d.hours) || [],
        backgroundColor: "rgba(99, 102, 241, 0.75)",
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const taskChartData = {
    labels: report?.taskBreakdown?.map((t) => t.task) || [],
    datasets: [
      {
        data: report?.taskBreakdown?.map((t) => t.hours) || [],
        backgroundColor: [
          "#6366f1",
          "#8b5cf6",
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#ec4899",
          "#14b8a6",
        ],
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
      x: { ticks: { color: textColor, maxRotation: 45 }, grid: { display: false } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: textColor, boxWidth: 12, padding: 10 } },
    },
  };

  return (
    <div className="page time-tracking-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Timer size={28} /> Time Tracking
          </h1>
          <p className="page-subtitle">Track time, analyze productivity, and manage entries</p>
          <span className={`time-sync-badge ${connected ? "online" : ""}`}>
            <Wifi size={14} /> {connected ? "Live sync" : "Offline"}
          </span>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setShowManual(true)}>
          <Plus size={16} /> Manual Entry
        </button>
      </div>

      <div className="time-summary-row">
        <div className="time-summary-card">
          <Clock size={20} />
          <div>
            <span className="time-summary-value">{formatDuration(todaySeconds)}</span>
            <span className="time-summary-label">Today</span>
          </div>
        </div>
        <div className="time-summary-card">
          <TrendingUp size={20} />
          <div>
            <span className="time-summary-value">{report?.totalHours || 0}h</span>
            <span className="time-summary-label">This {period}</span>
          </div>
        </div>
        <div className="time-summary-card">
          <List size={20} />
          <div>
            <span className="time-summary-value">{report?.totalEntries || 0}</span>
            <span className="time-summary-label">Entries</span>
          </div>
        </div>
        <div className="time-summary-card">
          <BarChart3 size={20} />
          <div>
            <span className="time-summary-value">
              {report?.totalEntries
                ? (report.totalHours / report.totalEntries).toFixed(1)
                : "0"}
              h
            </span>
            <span className="time-summary-label">Avg / Entry</span>
          </div>
        </div>
      </div>

      <div className="time-tracking-grid">
        <div className="timer-card">
          <div className={`timer-status ${isRunning ? (isPaused ? "paused" : "running") : "idle"}`}>
            {isRunning ? (isPaused ? "Paused" : "Recording") : "Ready"}
          </div>
          <div className="timer-display-large">{formatted}</div>
          {entry?.task && <p className="timer-task-name">{entry.task.title}</p>}

          {!isRunning ? (
            <div className="timer-setup">
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="form-select"
              >
                <option value="">Select a task to track...</option>
                {activeTasks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-input"
                placeholder="What are you working on? (optional)"
                value={timerNote}
                onChange={(e) => setTimerNote(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary btn-lg btn-full"
                onClick={handleStart}
                disabled={loading || !selectedTask}
              >
                <Play size={20} /> Start Timer
              </button>
            </div>
          ) : (
            <div className="timer-actions">
              {isPaused ? (
                <button type="button" className="btn btn-primary" onClick={resume}>
                  <Play size={18} /> Resume
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={pause}>
                  <Pause size={18} /> Pause
                </button>
              )}
              <button type="button" className="btn btn-danger" onClick={handleStop}>
                <Square size={18} /> Stop & Save
              </button>
            </div>
          )}
        </div>

        <div className="time-stats-card">
          <div className="time-stats-header">
            <h3>
              <BarChart3 size={18} /> Reports
            </h3>
            <div className="period-toggle">
              {["day", "week", "month"].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`btn btn-sm ${period === p ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setPeriod(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="time-chart-wrap">
            {report?.dailyBreakdown?.length > 0 ? (
              <Bar data={chartData} options={barOptions} />
            ) : (
              <div className="time-chart-empty">No data for this period</div>
            )}
          </div>
        </div>
      </div>

      <div className="time-breakdown-grid">
        <div className="card time-breakdown-card">
          <h3>Time by Task</h3>
          {report?.taskBreakdown?.length > 0 ? (
            <div className="time-doughnut-wrap">
              <Doughnut data={taskChartData} options={doughnutOptions} />
            </div>
          ) : (
            <p className="empty-text">Start tracking to see task breakdown</p>
          )}
          <ul className="time-task-list">
            {report?.taskBreakdown?.slice(0, 5).map((t) => (
              <li key={t.task}>
                <span>{t.task}</span>
                <strong>{t.hours}h</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="card time-breakdown-card">
          <h3>By Category</h3>
          <ul className="time-category-list">
            {report?.categoryBreakdown?.length > 0 ? (
              report.categoryBreakdown.map((c) => (
                <li key={c.category}>
                  <span className="category-name">{c.category}</span>
                  <div className="category-bar-wrap">
                    <div
                      className="category-bar"
                      style={{
                        width: `${Math.min(100, (c.hours / (report.totalHours || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="category-hours">{c.hours}h</span>
                </li>
              ))
            ) : (
              <p className="empty-text">No category data yet</p>
            )}
          </ul>
        </div>
      </div>

      <div className="time-entries-section">
        <div className="time-entries-header">
          <h3>
            <Clock size={18} /> Recent Entries
          </h3>
          <div className="time-entries-filter">
            <Filter size={14} />
            <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)}>
              <option value="all">All tasks</option>
              {[...new Map(entries.map((e) => [e.task?._id, e.task])).values()]
                .filter(Boolean)
                .map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.title}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div className="time-entries-list">
          {filteredEntries.map((e) => (
            <div key={e._id} className="time-entry-item">
              <div className="time-entry-icon">
                <Clock size={16} />
              </div>
              <div className="time-entry-info">
                <strong>{e.task?.title || "Task"}</strong>
                <span>
                  {formatDate(e.startTime)} • {formatDuration(e.duration)}
                  {e.isManual && " • Manual"}
                  {e.description && ` • ${e.description}`}
                </span>
              </div>
              <span className={`time-entry-status priority-${e.task?.priority || "low"}`}>
                {e.task?.priority || "—"}
              </span>
              <button
                type="button"
                className="btn-icon danger"
                title="Delete entry"
                onClick={() => handleDelete(e._id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="empty-state compact">
              <Clock size={32} />
              <p>No time entries yet. Start a timer or add a manual entry.</p>
            </div>
          )}
        </div>
      </div>

      {showManual && (
        <div className="modal-overlay" onClick={() => setShowManual(false)}>
          <form className="modal-dialog" onSubmit={handleManual} onClick={(ev) => ev.stopPropagation()}>
            <div className="modal-header">
              <h3>Manual Time Entry</h3>
              <button type="button" className="modal-close" onClick={() => setShowManual(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task</label>
                <select
                  required
                  value={manual.taskId}
                  onChange={(e) => setManual({ ...manual, taskId: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select task</option>
                  {tasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={manual.startTime}
                  onChange={(e) => setManual({ ...manual, startTime: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={manual.endTime}
                  onChange={(e) => setManual({ ...manual, endTime: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={manual.description}
                  onChange={(e) => setManual({ ...manual, description: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Add Entry"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;
