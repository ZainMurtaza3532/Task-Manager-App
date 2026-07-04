import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
} from "date-fns";
import { enUS } from "date-fns/locale";
import {
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Flag,
  User,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { fetchCalendarTasks, scheduleTask } from "../services/api";
import { useToast } from "../context/ToastContext";
import { useSocket } from "../context/SocketContext";
import { useTheme } from "../context/ThemeContext";
import { PRIORITIES, STATUSES } from "../utils/constants";

const DnDCalendar = withDragAndDrop(BigCalendar);
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

const CalendarPage = () => {
  const { subscribe } = useSocket();
  const { addToast } = useToast();
  const { resolvedTheme } = useTheme();
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfMonth(subMonths(date, 1));
      const end = endOfMonth(addMonths(date, 1));
      const res = await fetchCalendarTasks({
        start: start.toISOString(),
        end: end.toISOString(),
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      });
      setEvents(
        (res.data?.events || []).map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }))
      );
    } catch {
      addToast("Failed to load calendar", "error");
    } finally {
      setLoading(false);
    }
  }, [date, search, statusFilter, priorityFilter, addToast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const refresh = (payload) => {
      if (payload?.task) loadEvents();
    };
    const unsub1 = subscribe("task_update", refresh);
    const unsub2 = subscribe("task_updated", refresh);
    const unsub3 = subscribe("task_scheduled", refresh);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [subscribe, loadEvents]);

  const summary = useMemo(() => {
    const today = new Date();
    const scheduledToday = events.filter((e) => isSameDay(e.start, today)).length;
    const overdue = events.filter(
      (e) =>
        e.resource?.dueDate &&
        new Date(e.resource.dueDate) < today &&
        e.resource?.status !== "completed"
    ).length;
    const completed = events.filter((e) => e.resource?.status === "completed").length;
    return { total: events.length, scheduledToday, overdue, completed };
  }, [events]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => e.start >= now && e.resource?.status !== "completed")
      .sort((a, b) => a.start - b.start)
      .slice(0, 5);
  }, [events]);

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: priorityColors[event.resource?.priority] || "#6366f1",
      borderRadius: "6px",
      border: "none",
      color: "#fff",
      fontSize: "12px",
      opacity: event.resource?.status === "completed" ? 0.55 : 1,
      padding: "2px 4px",
    },
  });

  const EventRenderer = ({ event }) => (
    <div className="calendar-event-card">
      <strong>{event.title}</strong>
      {view !== "month" && (
        <div className="calendar-event-meta">
          {PRIORITIES[event.resource?.priority]?.label} • {STATUSES[event.resource?.status]?.label}
        </div>
      )}
    </div>
  );

  const handleEventDrop = async ({ event, start }) => {
    try {
      await scheduleTask(event.id, { scheduledDate: start.toISOString() });
      addToast("Task rescheduled", "success");
      loadEvents();
    } catch {
      addToast("Failed to reschedule", "error");
    }
  };

  const views = useMemo(() => ["month", "week", "day", "agenda"], []);

  const navigateDate = (dir) => {
    const unit = view === "month" ? "month" : view === "week" ? "week" : "day";
    const fn = dir === "prev" ? subMonths : addMonths;
    if (unit === "month") setDate((d) => fn(d, 1));
    else if (unit === "week") setDate((d) => new Date(d.getTime() + (dir === "prev" ? -7 : 7) * 86400000));
    else setDate((d) => new Date(d.getTime() + (dir === "prev" ? -1 : 1) * 86400000));
  };

  const isDark = resolvedTheme === "dark";

  return (
    <div className="page calendar-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarDays size={28} /> Calendar
          </h1>
          <p className="page-subtitle">Schedule, drag-and-drop, and visualize your tasks</p>
        </div>
      </div>

      <div className="calendar-stats-row">
        <div className="calendar-stat-card">
          <span className="calendar-stat-value">{summary.total}</span>
          <span className="calendar-stat-label">Visible Tasks</span>
        </div>
        <div className="calendar-stat-card accent">
          <span className="calendar-stat-value">{summary.scheduledToday}</span>
          <span className="calendar-stat-label">Today</span>
        </div>
        <div className="calendar-stat-card warning">
          <span className="calendar-stat-value">{summary.overdue}</span>
          <span className="calendar-stat-label">Overdue</span>
        </div>
        <div className="calendar-stat-card success">
          <span className="calendar-stat-value">{summary.completed}</span>
          <span className="calendar-stat-label">Completed</span>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-main">
          <div className="calendar-toolbar">
            <div className="calendar-nav">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDate(new Date())}>
                Today
              </button>
              <button type="button" className="calendar-nav-btn" onClick={() => navigateDate("prev")}>
                <ChevronLeft size={18} />
              </button>
              <span className="calendar-current-date">{format(date, "MMMM yyyy")}</span>
              <button type="button" className="calendar-nav-btn" onClick={() => navigateDate("next")}>
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-filters">
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priority</option>
                {Object.entries(PRIORITIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="calendar-view-toggle">
              {views.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={view === v ? "active" : ""}
                  onClick={() => setView(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={`calendar-container ${loading ? "loading" : ""} ${isDark ? "dark" : ""}`}>
            <DnDCalendar
              localizer={localizer}
              events={events}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              views={views}
              toolbar={false}
              style={{ height: "calc(100vh - 340px)", minHeight: "520px" }}
              eventPropGetter={eventStyleGetter}
              onEventDrop={handleEventDrop}
              onSelectEvent={setSelectedEvent}
              components={{ event: EventRenderer }}
              draggableAccessor={(event) => event.resource?.status !== "completed"}
              resizable={false}
              popup
            />
          </div>

          <div className="calendar-legend">
            {Object.entries(priorityColors).map(([p, color]) => (
              <span key={p} className="legend-item">
                <span className="legend-dot" style={{ background: color }} />
                {PRIORITIES[p]?.label || p}
              </span>
            ))}
            <span className="legend-hint">Drag tasks to reschedule</span>
          </div>
        </div>

        <aside className="calendar-sidebar">
          {selectedEvent ? (
            <div className="calendar-details-panel">
              <div className="calendar-details-header">
                <h3>Task Details</h3>
                <button type="button" className="modal-close" onClick={() => setSelectedEvent(null)}>
                  <X size={18} />
                </button>
              </div>
              <h4 className="calendar-details-title">{selectedEvent.title}</h4>
              <div className="calendar-detail-rows">
                <div className="calendar-detail-row">
                  <Flag size={16} />
                  <div>
                    <label>Status</label>
                    <span
                      className={`status-pill status-${selectedEvent.resource?.status}`}
                    >
                      {STATUSES[selectedEvent.resource?.status]?.label || selectedEvent.resource?.status}
                    </span>
                  </div>
                </div>
                <div className="calendar-detail-row">
                  <Clock size={16} />
                  <div>
                    <label>Priority</label>
                    <span
                      className={`priority-badge priority-${selectedEvent.resource?.priority}`}
                    >
                      {PRIORITIES[selectedEvent.resource?.priority]?.label || selectedEvent.resource?.priority}
                    </span>
                  </div>
                </div>
                <div className="calendar-detail-row">
                  <CalendarDays size={16} />
                  <div>
                    <label>Scheduled</label>
                    <span>
                      {selectedEvent.resource?.scheduledDate
                        ? format(new Date(selectedEvent.resource.scheduledDate), "MMM d, yyyy")
                        : "Not scheduled"}
                    </span>
                  </div>
                </div>
                <div className="calendar-detail-row">
                  <Clock size={16} />
                  <div>
                    <label>Due Date</label>
                    <span>
                      {selectedEvent.resource?.dueDate
                        ? format(new Date(selectedEvent.resource.dueDate), "MMM d, yyyy")
                        : "No due date"}
                    </span>
                  </div>
                </div>
                <div className="calendar-detail-row">
                  <User size={16} />
                  <div>
                    <label>Assignee</label>
                    <span>{selectedEvent.resource?.assignee?.name || "Unassigned"}</span>
                  </div>
                </div>
                <div className="calendar-detail-row">
                  <Users size={16} />
                  <div>
                    <label>Team</label>
                    <span>{selectedEvent.resource?.team?.name || "Personal"}</span>
                  </div>
                </div>
              </div>
              <Link to="/tasks" className="btn btn-primary btn-full">
                View in Tasks
              </Link>
            </div>
          ) : (
            <div className="calendar-upcoming-panel">
              <h3>Upcoming</h3>
              {upcomingEvents.length === 0 ? (
                <p className="calendar-upcoming-empty">No upcoming scheduled tasks</p>
              ) : (
                <ul className="calendar-upcoming-list">
                  {upcomingEvents.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className="calendar-upcoming-item"
                        onClick={() => setSelectedEvent(e)}
                      >
                        <span
                          className="upcoming-dot"
                          style={{ background: priorityColors[e.resource?.priority] || "#6366f1" }}
                        />
                        <div>
                          <strong>{e.title}</strong>
                          <span>
                            {isToday(e.start) ? "Today" : format(e.start, "MMM d")} •{" "}
                            {STATUSES[e.resource?.status]?.label}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CalendarPage;
