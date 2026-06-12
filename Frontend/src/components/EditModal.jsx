import React from 'react';
import TaskForm from './TaskForm';
import { X } from 'lucide-react';

const EditModal = ({ task, onClose }) => {
  if (!task) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', color: 'var(--text-muted)' }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          {task._id ? 'Edit Task' : 'Add Task'}
        </h2>
        
        <TaskForm initialData={task} onSuccess={onClose} />
      </div>
    </div>
  );
};

export default EditModal;
