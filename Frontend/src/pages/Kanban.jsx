import React, { useEffect, useState, useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { Loader, Search, Plus, Filter } from 'lucide-react';
import { DndContext, closestCenter, DragOverlay, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import TaskCard from '../components/TaskCard';
import EditModal from '../components/EditModal';

const DroppableColumn = ({ id, title, tasks, setEditingTask, setAddingTask, handleTrash, handleComplete }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div className="kanban-column" ref={setNodeRef}>
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">
          {title} <span className="badge badge-priority-low">{tasks.length}</span>
        </h3>
        <button 
          className="kanban-add-btn" 
          onClick={() => setAddingTask({ status: id, priority: 'medium' })}
          title={`Add ${title} Task`}
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="kanban-column-content">
        {tasks.map(task => (
          <DraggableTask key={task._id} task={task} setEditingTask={setEditingTask} handleTrash={handleTrash} handleComplete={handleComplete} />
        ))}
      </div>
    </div>
  );
};

const DraggableTask = React.memo(({ task, setEditingTask, handleTrash, handleComplete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
    position: 'relative'
  } : {};

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
        <TaskCard 
          task={task} 
          onEdit={setEditingTask} 
          onDelete={handleTrash} 
          onComplete={handleComplete} 
          isTrash={false} 
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
  
  // Local filters for Kanban
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.data.current) {
      const taskId = active.id;
      const newStatus = over.id; // 'pending', 'in-progress', 'completed'
      const task = active.data.current.task;

      if (task.status !== newStatus) {
        await editTask(taskId, { ...task, status: newStatus });
      }
    }
  };

  // Memoized and filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const pendingTasks = useMemo(() => filteredTasks.filter(t => t.status === 'pending'), [filteredTasks]);
  const inProgressTasks = useMemo(() => filteredTasks.filter(t => t.status === 'in-progress'), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'completed'), [filteredTasks]);

  if (loading && tasks.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Loader className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="kanban-page">
      <div className="page-header">
        <h1 className="page-title">Kanban Board</h1>
        <p className="page-subtitle">Drag and drop tasks to update their status visually.</p>
      </div>

      <div className="kanban-controls">
        <div className="kanban-search">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
          <select 
            className="form-select" 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ padding: '8px 16px' }}
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          <DroppableColumn 
            id="pending" 
            title="Pending" 
            tasks={pendingTasks} 
            setEditingTask={setEditingTask}
            setAddingTask={setAddingTask}
            handleTrash={trashTask}
            handleComplete={(t) => editTask(t._id, { ...t, status: 'completed' })}
          />
          <DroppableColumn 
            id="in-progress" 
            title="In Progress" 
            tasks={inProgressTasks} 
            setEditingTask={setEditingTask}
            setAddingTask={setAddingTask}
            handleTrash={trashTask}
            handleComplete={(t) => editTask(t._id, { ...t, status: 'completed' })}
          />
          <DroppableColumn 
            id="completed" 
            title="Completed" 
            tasks={completedTasks} 
            setEditingTask={setEditingTask}
            setAddingTask={setAddingTask}
            handleTrash={trashTask}
            handleComplete={(t) => editTask(t._id, { ...t, status: 'pending' })}
          />
        </div>
        <DragOverlay>
          {activeTask ? (
            <div style={{ opacity: 0.9, cursor: 'grabbing', transform: 'scale(1.02)' }}>
              <TaskCard 
                task={activeTask} 
                onEdit={() => {}} 
                onDelete={() => {}} 
                onComplete={() => {}} 
                isTrash={false} 
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {(editingTask || addingTask) && (
        <EditModal
            task={editingTask || addingTask}
            onClose={() => { setEditingTask(null); setAddingTask(null); }}
        />
      )}
    </div>
  );
};

export default Kanban;
