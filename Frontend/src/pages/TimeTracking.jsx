import React, { useState, useEffect } from "react";
import { Play, Pause, Square, Plus, Clock, BarChart3 } from "lucide-react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { useTimer } from "../hooks/useTimer";
import { useTasks } from "../context/TaskContext";
import { fetchTimeEntries, fetchTimeReports, createManualTimeEntry, deleteTimeEntry } from "../services/api";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/helpers";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TimeTracking = () => {
  const { tasks } = useTasks();
  const { entry, formatted, isRunning, isPaused, loading, start, pause, resume, stop } = useTimer();
  const { addToast } = useToast();
  const [selectedTask, setSelectedTask] = useState("");
  const [entries, setEntries] = useState([]);
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("week");
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ taskId: "", startTime: "", endTime: "", description: "" });

  const activeTasks = tasks.filter((t) => t.status !== "completed");

  useEffect(() => {
    const load = async () => {
      try {
        const [entriesRes, reportRes] = await Promise.all([
          fetchTimeEntries({ limit: 20 }),
          fetchTimeReports(period),
        ]);
        setEntries(entriesRes.data || []);
        setReport(reportRes.data);
      } catch {
        // API unavailable (v1 backend or offline)
      }
    };
    load();
  }, [period, entry]);

  const handleStart = async () => {
    if (!selectedTask) { addToast("Select a task first", "error"); return; }
    await start(selectedTask);
    addToast("Timer started", "success");
  };

  const handleManual = async (e) => {
    e.preventDefault();
    try {
      await createManualTimeEntry(manual);
      addToast("Time entry added", "success");
      setShowManual(false);
      setManual({ taskId: "", startTime: "", endTime: "", description: "" });
      const r = await fetchTimeEntries({ limit: 20 });
      setEntries(r.data || []);
    } catch {
      addToast("Failed to add entry", "error");
    }
  };

  const chartData = {
    labels: report?.dailyBreakdown?.map((d) => d.date) || [],
    datasets: [{
      label: "Hours",
      data: report?.dailyBreakdown?.map((d) => d.hours) || [],
      backgroundColor: "rgba(99, 102, 241, 0.7)",
      borderRadius: 6,
    }],
  };

  return (
    <div className="page time-tracking-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Time Tracking</h1>
          <p className="page-subtitle">Track time spent on your tasks</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowManual(!showManual)}>
          <Plus size={16} /> Manual Entry
        </button>
      </div>

      <div className="time-tracking-grid">
        <div className="timer-card">
          <div className="timer-display-large">{formatted}</div>
          {entry?.task && <p className="timer-task-name">{entry.task.title}</p>}

          {!isRunning ? (
            <>
              <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)} className="form-select">
                <option value="">Select a task...</option>
                {activeTasks.map((t) => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
                <Play size={20} /> Start Timer
              </button>
            </>
          ) : (
            <div className="timer-actions">
              {isPaused ? (
                <button className="btn btn-primary" onClick={resume}><Play size={18} /> Resume</button>
              ) : (
                <button className="btn btn-secondary" onClick={pause}><Pause size={18} /> Pause</button>
              )}
              <button className="btn btn-danger" onClick={stop}><Square size={18} /> Stop</button>
            </div>
          )}
        </div>

        <div className="time-stats-card">
          <h3><BarChart3 size={18} /> Reports</h3>
          <div className="period-toggle">
            {["day", "week", "month"].map((p) => (
              <button key={p} className={`btn btn-sm ${period === p ? "btn-primary" : "btn-secondary"}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="stat-row">
            <div className="stat-item">
              <span className="stat-value">{report?.totalHours || 0}h</span>
              <span className="stat-label">Total Hours</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{report?.totalEntries || 0}</span>
              <span className="stat-label">Entries</span>
            </div>
          </div>
          {report?.dailyBreakdown?.length > 0 && (
            <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          )}
        </div>
      </div>

      {showManual && (
        <form className="manual-entry-form" onSubmit={handleManual}>
          <h3>Manual Time Entry</h3>
          <select required value={manual.taskId} onChange={(e) => setManual({ ...manual, taskId: e.target.value })}>
            <option value="">Select task</option>
            {tasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
          <input type="datetime-local" required value={manual.startTime} onChange={(e) => setManual({ ...manual, startTime: e.target.value })} />
          <input type="datetime-local" required value={manual.endTime} onChange={(e) => setManual({ ...manual, endTime: e.target.value })} />
          <input type="text" placeholder="Description (optional)" value={manual.description} onChange={(e) => setManual({ ...manual, description: e.target.value })} />
          <button type="submit" className="btn btn-primary">Add Entry</button>
        </form>
      )}

      <div className="time-entries-section">
        <h3><Clock size={18} /> Recent Entries</h3>
        <div className="time-entries-list">
          {entries.map((e) => (
            <div key={e._id} className="time-entry-item">
              <div>
                <strong>{e.task?.title || "Task"}</strong>
                <span>{formatDate(e.startTime)} — {Math.floor((e.duration || 0) / 60)}m {e.isManual && "(manual)"}</span>
              </div>
              <button className="btn-icon" onClick={async () => {
                await deleteTimeEntry(e._id);
                setEntries((prev) => prev.filter((x) => x._id !== e._id));
              }}>×</button>
            </div>
          ))}
          {entries.length === 0 && <p className="empty-text">No time entries yet</p>}
        </div>
      </div>
    </div>
  );
};

export default TimeTracking;
