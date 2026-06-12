import React from 'react';
import { Edit2, Trash2, RotateCcw, XCircle, Calendar, Tag, CheckCircle, CheckSquare } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const TaskCard = ({ task, onEdit, onDelete, onRestore, onPermanentDelete, onComplete, isTrash }) => {
    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'high': return <span className="badge badge-priority-high">High</span>;
            case 'medium': return <span className="badge badge-priority-medium">Medium</span>;
            case 'low': return <span className="badge badge-priority-low">Low</span>;
            default: return null;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="badge badge-status-pending">Pending</span>;
            case 'in-progress': return <span className="badge badge-status-in-progress">In Progress</span>;
            case 'completed': return <span className="badge badge-status-completed">Completed</span>;
            default: return null;
        }
    };

    const getDateClass = (dueDate, status) => {
        if (!dueDate || status === 'completed') return 'due-completed';
        const date = new Date(dueDate);
        if (isPast(date) && !isToday(date)) return 'due-overdue';
        if (isToday(date)) return 'due-today';
        return 'due-normal';
    };

    return (
        <div className="task-card">
            <div className="task-card-header">
                <h3 className="task-card-title">{task.title}</h3>
                <div className="task-card-actions">
                    {!isTrash ? (
                        <>
                            {task.status !== 'completed' && onComplete && (
                                <button className="task-action-btn" onClick={() => onComplete(task)} title="Mark as Completed" style={{ color: 'var(--success)' }}>
                                    <CheckCircle size={14} />
                                </button>
                            )}
                            <button className="task-action-btn" onClick={() => onEdit(task)} title="Edit">
                                <Edit2 size={14} />
                            </button>
                            <button className="task-action-btn delete-btn" onClick={() => onDelete(task._id)} title="Move to Trash">
                                <Trash2 size={14} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="task-action-btn restore-btn" onClick={() => onRestore(task._id)} title="Restore">
                                <RotateCcw size={14} />
                            </button>
                            <button className="task-action-btn delete-btn" onClick={() => onPermanentDelete(task._id)} title="Delete Permanently">
                                <XCircle size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="task-card-meta">
                {getPriorityBadge(task.priority)}
                {getStatusBadge(task.status)}
            </div>

            <p className="task-card-desc">
                {task.description || 'No description provided.'}
            </p>

            <div className="task-card-footer">
                {task.subTasks && task.subTasks.length > 0 && (
                    <div className="task-subtasks-progress" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <CheckSquare size={12} />
                        {task.subTasks.filter(st => st.isCompleted).length}/{task.subTasks.length}
                    </div>
                )}
                
                <div className="task-category">
                    <Tag size={12} />
                    {task.category || 'General'}
                </div>

                {task.dueDate && (
                    <div className={`task-date ${getDateClass(task.dueDate, task.status)}`}>
                        <Calendar size={12} />
                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
