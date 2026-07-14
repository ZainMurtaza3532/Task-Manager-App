import React, { useEffect, useState, useMemo } from "react";
import { useTasks } from "../context/TaskContext";
import {
  Loader,
  Search,
  Plus,
  LayoutGrid,
  Clock,
  PlayCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import KanbanCard from "../components/KanbanCard";
import EditModal from "../components/EditModal";

const COLUMNS = [
  {
    id: "pending",
    title: "To Do",
    subtitle: "Not started yet",
    icon: Clock,
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.12)",
  },
  {
    id: "in-progress",
    title: "In Progress",
    subtitle: "Currently working",
    icon: PlayCircle,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  {
    id: "completed",
    title: "Done",
    subtitle: "Completed tasks",
    icon: CheckCircle2,
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
  },
];

const DroppableColumn = ({ column, tasks, setEditingTask, setAddingTask, handleTrash, handleComplete }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const Icon = column.icon;

  return (
    <div className={`kanban-column kanban-column-${column.id} ${isOver ? "drag-over" : ""}`} ref={setNodeRef}>
      <div className="kanban-column-header" style={{ borderColor: column.color }}>
        <div className="kanban-column-title-wrap">
          <span className="kanban-column-icon" style={{ background: column.bg, color: column.color }}>
            <Icon size={18} />
          </span>
          <div>
            <h3 className="kanban-column-title">{column.title}</h3>
            <span className="kanban-column-subtitle">{column.subtitle}</span>
          </div>
        </div>
        <div className="kanban-column-header-right">
          <span className="kanban-count" style={{ background: column.bg, color: column.color }}>
            {tasks.length}
          </span>
          <button
            type="button"
            className="kanban-add-btn"
            onClick={() => setAddingTask({ status: column.id, priority: "medium" })}
            title={`Add to ${column.title}`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="kanban-column-content">
        {tasks.length === 0 ? (
          <div className="kanban-empty-column">
            <Icon size={28} style={{ color: column.color, opacity: 0.5 }} />
            <p>No tasks here</p>
            <button
              type="button"
              className="kanban-empty-add"
              onClick={() => setAddingTask({ status: column.id, priority: "medium" })}
            >
              <Plus size={14} /> Add task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTask
              key={task._id}
              task={task}
              setEditingTask={setEditingTask}
              handleTrash={handleTrash}
              handleComplete={handleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
};

const DraggableTask = React.memo(({ task, setEditingTask, handleTrash, handleComplete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task },
  });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isDragging ? 999 : 1,
    }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={`kanban-draggable ${isDragging ? "is-dragging" : ""}`}>
      <div className="kanban-drag-area" {...listeners} {...attributes}>
        <KanbanCard
          task={task}
          onEdit={setEditingTask}
          onDelete={handleTrash}
          onComplete={handleComplete}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
});

const Kanban = () => {
  const { tasks, fetchAllTasks, loading, trashTask, editTask } = useTasks();
  const [editingTask, setEditingTask] = useState(null);
  const [addingTask, setAddingTask] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t._id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.data.current) {
      const taskId = active.id;
      const newStatus = over.id;
      const task = active.data.current.task;

      if (task.status !== newStatus) {
        await editTask(taskId, { ...task, status: newStatus });
      }
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        task.assignee?.name?.toLowerCase().includes(q);
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const columnTasks = useMemo(
    () => ({
      pending: filteredTasks.filter((t) => t.status === "pending"),
      "in-progress": filteredTasks.filter((t) => t.status === "in-progress"),
      completed: filteredTasks.filter((t) => t.status === "completed"),
    }),
    [filteredTasks]
  );

  const totalActive = columnTasks.pending.length + columnTasks["in-progress"].length;

  if (loading && tasks.length === 0) {
    return (
      <div className="kanban-loading">
        <Loader className="animate-spin" size={32} />
        <p>Loading board...</p>
      </div>
    );
  }

  return (
    <div className="page kanban-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <LayoutGrid size={28} /> Kanban Board
          </h1>
          <p className="page-subtitle">Drag tasks between columns to update status. Click a card to edit or assign.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setAddingTask({ status: "pending", priority: "medium" })}
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="kanban-stats-row">
        <div className="kanban-stat-card">
          <span className="kanban-stat-value">{tasks.length}</span>
          <span className="kanban-stat-label">Total</span>
        </div>
        <div className="kanban-stat-card pending">
          <span className="kanban-stat-value">{columnTasks.pending.length}</span>
          <span className="kanban-stat-label">To Do</span>
        </div>
        <div className="kanban-stat-card progress">
          <span className="kanban-stat-value">{columnTasks["in-progress"].length}</span>
          <span className="kanban-stat-label">In Progress</span>
        </div>
        <div className="kanban-stat-card done">
          <span className="kanban-stat-value">{columnTasks.completed.length}</span>
          <span className="kanban-stat-label">Done</span>
        </div>
        <div className="kanban-stat-card accent">
          <span className="kanban-stat-value">{totalActive}</span>
          <span className="kanban-stat-label">Active</span>
        </div>
      </div>

      <div className="kanban-toolbar">
        <div className="kanban-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tasks or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="kanban-search-clear" onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="kanban-filter-pills">
          {["all", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              type="button"
              className={`kanban-filter-pill ${priorityFilter === p ? "active" : ""} ${p !== "all" ? p : ""}`}
              onClick={() => setPriorityFilter(p)}
            >
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.id}
              column={col}
              tasks={columnTasks[col.id]}
              setEditingTask={setEditingTask}
              setAddingTask={setAddingTask}
              handleTrash={trashTask}
              handleComplete={(t) =>
                editTask(t._id, { ...t, status: t.status === "completed" ? "pending" : "completed" })
              }
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeTask ? (
            <div className="kanban-drag-overlay">
              <KanbanCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {(editingTask || addingTask) && (
        <EditModal
          task={editingTask || addingTask}
          onClose={() => {
            setEditingTask(null);
            setAddingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default Kanban;
