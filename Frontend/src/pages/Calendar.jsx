import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { enUS } from "date-fns/locale";
import { Search } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { fetchCalendarTasks, scheduleTask } from "../services/api";
import { useToast } from "../context/ToastContext";
import { PRIORITIES, STATUSES } from "../utils/constants";

const DnDCalendar = withDragAndDrop(BigCalendar);
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };

const CalendarPage = () => {
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

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
      setEvents((res.data?.events || []).map((e) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })));
    } catch {
      addToast("Failed to load calendar", "error");
    } finally {
      setLoading(false);
    }
  }, [date, search, statusFilter, priorityFilter, addToast]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: priorityColors[event.resource?.priority] || "#6366f1",
      borderRadius: "4px",
      border: "none",
      color: "#fff",
      fontSize: "12px",
      opacity: event.resource?.status === "completed" ? 0.6 : 1,
    },
  });

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

  return (
    <div className="page calendar-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Schedule and visualize your tasks</p>
        </div>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-filters">
          <div className="search-input-wrap">
            <Search size={16} />
            <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="calendar-view-toggle">
          {views.map((v) => (
            <button key={v} className={`btn btn-sm ${view === v ? "btn-primary" : "btn-secondary"}`} onClick={() => setView(v)}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={`calendar-container ${loading ? "loading" : ""}`}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          views={views}
          style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}
          eventPropGetter={eventStyleGetter}
          onEventDrop={handleEventDrop}
          draggableAccessor={() => true}
          resizable={false}
          popup
        />
      </div>

      <div className="calendar-legend">
        {Object.entries(priorityColors).map(([p, color]) => (
          <span key={p} className="legend-item">
            <span className="legend-dot" style={{ background: color }} /> {PRIORITIES[p]?.label || p}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
