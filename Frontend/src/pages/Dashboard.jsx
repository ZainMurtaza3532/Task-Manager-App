import React, { useEffect, useMemo } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  TrendingUp,
  ArrowRight,
  Plus,
  Kanban,
  Calendar,
  Users,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { Skeleton } from "../components/Skeleton";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const { stats, fetchStats, loading } = useTasks();
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const total = stats.total || 0;
  const completed = stats.completed || 0;
  const inProgress = stats.inProgress || 0;
  const pending = stats.pending || 0;
  const overdue = stats.overdue || 0;
  const dueSoon = stats.dueSoon || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeTasks = pending + inProgress;
  const upcoming = stats.upcoming || [];
  const recent = stats.recent || [];

  const isDark = resolvedTheme === "dark";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.12)";
  const textColor = isDark ? "#94a3b8" : "#64748b";

  const statCards = [
    {
      title: "Total Tasks",
      value: total,
      icon: ListTodo,
      color: "var(--accent)",
      bg: "var(--accent-light)",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "var(--success)",
      bg: "var(--success-bg)",
    },
    {
      title: "In Progress",
      value: inProgress,
      icon: TrendingUp,
      color: "var(--info)",
      bg: "var(--info-bg)",
    },
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "var(--status-pending)",
      bg: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.1)",
    },
    {
      title: "Overdue",
      value: overdue,
      icon: AlertCircle,
      color: "var(--danger)",
      bg: "var(--danger-bg)",
    },
    {
      title: "Due soon",
      value: dueSoon,
      icon: Calendar,
      color: "var(--warning, #f59e0b)",
      bg: isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.1)",
    },
  ];

  const quickActions = [
    { to: "/add-task", label: "New Task", icon: Plus, primary: true },
    { to: "/tasks", label: "All Tasks", icon: ListTodo },
    { to: "/kanban", label: "Kanban", icon: Kanban },
    { to: "/calendar", label: "Calendar", icon: Calendar },
    { to: "/ai-assistant", label: "AI Assist", icon: Sparkles },
    { to: "/teams", label: "Teams", icon: Users },
  ];

  const statusData = useMemo(
    () => ({
      labels: ["Completed", "In Progress", "Pending"],
      datasets: [
        {
          data: [completed, inProgress, pending],
          backgroundColor: ["#10b981", "#3b82f6", "#64748b"],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [completed, inProgress, pending]
  );

  const priorityData = useMemo(
    () => ({
      labels: ["High", "Medium", "Low"],
      datasets: [
        {
          label: "Tasks",
          data: [stats.highPriority || 0, stats.mediumPriority || 0, stats.lowPriority || 0],
          backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }),
    [stats.highPriority, stats.mediumPriority, stats.lowPriority]
  );

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: textColor, padding: 16, usePointStyle: true, pointStyle: "circle" },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0, color: textColor },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { display: false },
      },
    },
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-badge">Dashboard</span>
          <h1 className="dashboard-hero-title">Welcome back, {firstName}</h1>
          <p className="dashboard-hero-subtitle">
            {activeTasks > 0
              ? `You have ${activeTasks} active task${activeTasks !== 1 ? "s" : ""} to focus on today.`
              : "You're all caught up. Great work!"}
          </p>
        </div>
        <div className="dashboard-hero-progress">
          <div className="progress-ring-wrap">
            <svg className="progress-ring" viewBox="0 0 100 100">
              <circle className="progress-ring-bg" cx="50" cy="50" r="42" />
              <circle
                className="progress-ring-fill"
                cx="50"
                cy="50"
                r="42"
                style={{
                  strokeDasharray: `${completionRate * 2.64} 264`,
                }}
              />
            </svg>
            <div className="progress-ring-label">
              <span className="progress-ring-value">{loading ? "—" : `${completionRate}%`}</span>
              <span className="progress-ring-text">Done</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-quick-actions">
        {quickActions.map(({ to, label, icon: Icon, primary }) => (
          <Link
            key={to}
            to={to}
            className={`dashboard-action-btn ${primary ? "primary" : ""}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </div>

      <div className="stats-grid stats-grid--dense">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div className="stat-card" key={i}>
                <Skeleton height={64} />
              </div>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div className="stat-card" key={stat.title} style={{ "--stat-color": stat.color }}>
                  <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="stat-info">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.title}</div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="dashboard-charts">
        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h2>Tasks by Status</h2>
            <span className="dashboard-chart-meta">{total} total</span>
          </div>
          <div className="dashboard-chart-body pie">
            {total > 0 ? (
              <Pie data={statusData} options={pieOptions} />
            ) : (
              <div className="dashboard-chart-empty">No tasks yet</div>
            )}
          </div>
        </div>

        <div className="card dashboard-chart-card">
          <div className="dashboard-chart-header">
            <h2>Tasks by Priority</h2>
            <span className="dashboard-chart-meta">Distribution</span>
          </div>
          <div className="dashboard-chart-body">
            {total > 0 ? (
              <Bar data={priorityData} options={barOptions} />
            ) : (
              <div className="dashboard-chart-empty">No tasks yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="card dashboard-panel">
          <div className="dashboard-chart-header">
            <h2>Upcoming</h2>
            <Link to="/calendar" className="dashboard-chart-meta link">Calendar</Link>
          </div>
          <ul className="dashboard-list">
            {upcoming.length === 0 && <li className="muted">No upcoming due dates</li>}
            {upcoming.map((t) => (
              <li key={t._id}>
                <Link to={`/tasks/${t._id}`}>
                  <span className={`prio-dot ${t.priority}`} />
                  <span className="dashboard-list-title">{t.title}</span>
                  <span className="dashboard-list-meta">
                    {t.dueDate ? format(new Date(t.dueDate), "MMM d") : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card dashboard-panel">
          <div className="dashboard-chart-header">
            <h2>Recent activity</h2>
            <Link to="/tasks" className="dashboard-chart-meta link">All tasks</Link>
          </div>
          <ul className="dashboard-list">
            {recent.length === 0 && <li className="muted">No recent updates</li>}
            {recent.map((t) => (
              <li key={t._id}>
                <Link to={`/tasks/${t._id}`}>
                  <span className={`prio-dot ${t.priority}`} />
                  <span className="dashboard-list-title">{t.title}</span>
                  <span className="dashboard-list-meta">
                    {t.updatedAt ? formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true }) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="dashboard-cta card">
        <div className="dashboard-cta-content">
          <h2>Ready to conquer the day?</h2>
          <p>
            {activeTasks > 0
              ? `${activeTasks} active task${activeTasks !== 1 ? "s" : ""} waiting for you.`
              : "Create a new task or explore your team workspace."}
          </p>
        </div>
        <div className="dashboard-cta-actions">
          <Link to="/add-task" className="btn btn-primary">
            <Plus size={16} /> Add Task
          </Link>
          <Link to="/tasks" className="btn btn-secondary">
            View Tasks <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
