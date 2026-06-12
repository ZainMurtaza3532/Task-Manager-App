import React, { useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import { Loader, AlertTriangle } from 'lucide-react';

const Trash = () => {
  const { trashedTasks, fetchAllTrashedTasks, loading, restoreFromTrash, deleteForever, clearTrash } = useTasks();

  useEffect(() => {
    fetchAllTrashedTasks();
  }, [fetchAllTrashedTasks]);

  const handleEmptyTrash = () => {
    if (window.confirm("Are you sure you want to empty the trash? This cannot be undone.")) {
      clearTrash();
    }
  };

  return (
    <div className="trash-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Deleted tasks are kept here until you permanently delete them.</p>
        </div>
        {trashedTasks.length > 0 && (
          <button 
            onClick={handleEmptyTrash}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 16px', background: 'var(--danger-bg)', 
              color: 'var(--danger)', borderRadius: '8px', fontWeight: 'bold' 
            }}
          >
            <AlertTriangle size={16} />
            Empty Trash
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader className="animate-spin" size={32} style={{ color: 'var(--danger)' }} />
        </div>
      ) : trashedTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Trash is empty</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No deleted tasks found.</p>
        </div>
      ) : (
        <div className="tasks-grid">
          {trashedTasks.map(task => (
            <TaskCard 
              key={task._id} 
              task={task} 
              onRestore={restoreFromTrash}
              onPermanentDelete={deleteForever}
              isTrash={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;
