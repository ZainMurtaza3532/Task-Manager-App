import React, { useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import FilterPanel from '../components/FilterPanel';
import EditModal from '../components/EditModal';
import { Loader } from 'lucide-react';

const Tasks = () => {
    const { tasks, fetchAllTasks, loading, trashTask, editTask, searchQuery, filters } = useTasks();
    const [editingTask, setEditingTask] = useState(null);

    useEffect(() => {
        fetchAllTasks();
    }, [fetchAllTasks, searchQuery, filters]);

    return (
        <div className="tasks-page">
            <div className="page-header">
                <h1 className="page-title">All Tasks</h1>
                <p className="page-subtitle">Manage and organize all your active tasks here.</p>
            </div>

            <FilterPanel />

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
                </div>
            ) : tasks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>No tasks found</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters, or add a new task.</p>
                </div>
            ) : (
                <div className="tasks-grid">
                    {tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={setEditingTask}
                            onDelete={trashTask}
                            onComplete={(t) => editTask(t._id, { ...t, status: 'completed' })}
                            isTrash={false}
                        />
                    ))}
                </div>
            )}

            {editingTask && (
                <EditModal
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </div>
    );
};

export default Tasks;
