import React, { useEffect, useState } from 'react';
import TaskCard from '../components/TaskCard';
import EditModal from '../components/EditModal';
import { Loader } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import * as api from '../services/api';
import { useToast } from '../context/ToastContext';

const CompletedTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState(null);
    const { editTask: contextEditTask, trashTask: contextTrashTask } = useTasks();
    const { addToast } = useToast();

    const fetchCompletedTasks = async () => {
        setLoading(true);
        try {
            const response = await api.fetchTasks({ status: 'completed' });
            setTasks(response.data || []);
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to fetch completed tasks", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompletedTasks();
    }, []);

    const handleTrash = async (id) => {
        const success = await contextTrashTask(id);
        if (success) fetchCompletedTasks();
    };

    const handleComplete = async (task) => {
        // In this view tasks are already completed, but we add this handler just in case
        // We could also toggle it back to pending if clicked again
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        const success = await contextEditTask(task._id, { ...task, status: newStatus });
        if (success) fetchCompletedTasks();
    }

    return (
        <div className="tasks-page">
            <div className="page-header">
                <h1 className="page-title">Completed Tasks</h1>
                <p className="page-subtitle">A list of all tasks you have finished.</p>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <Loader className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
                </div>
            ) : tasks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>No completed tasks</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't completed any tasks yet.</p>
                </div>
            ) : (
                <div className="tasks-grid">
                    {tasks.map(task => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={setEditingTask}
                            onDelete={handleTrash}
                            onComplete={handleComplete}
                            isTrash={false}
                        />
                    ))}
                </div>
            )}

            {editingTask && (
                <EditModal
                    task={editingTask}
                    onClose={() => {
                        setEditingTask(null);
                        fetchCompletedTasks();
                    }}
                />
            )}
        </div>
    );
};

export default CompletedTasks;
