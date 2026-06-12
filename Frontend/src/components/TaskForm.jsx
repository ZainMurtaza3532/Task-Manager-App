import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useNavigate } from 'react-router-dom';

const TaskForm = ({ initialData = null, onSuccess = null }) => {
  const { addTask, editTask } = useTasks();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    dueDate: '',
    category: '',
    subTasks: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        status: initialData.status || 'pending',
        dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        category: initialData.category || '',
        subTasks: initialData.subTasks || []
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubTaskChange = (index, value) => {
    const updatedSubTasks = [...formData.subTasks];
    updatedSubTasks[index].title = value;
    setFormData(prev => ({ ...prev, subTasks: updatedSubTasks }));
  };

  const addSubTask = () => {
    setFormData(prev => ({ ...prev, subTasks: [...prev.subTasks, { title: '', isCompleted: false }] }));
  };

  const removeSubTask = (index) => {
    const updatedSubTasks = formData.subTasks.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, subTasks: updatedSubTasks }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (initialData && initialData._id) {
        await editTask(initialData._id, formData);
      } else {
        await addTask(formData);
        if (!onSuccess) navigate('/tasks');
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-group">
        <label className="form-label">Task Title <span className="required">*</span></label>
        <input 
          type="text" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          className="form-input" 
          placeholder="Enter task title" 
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          className="form-textarea" 
          placeholder="Enter task description" 
          rows="4" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select name="priority" value={formData.priority} onChange={handleChange} className="form-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="form-select">
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input 
            type="date" 
            name="dueDate" 
            value={formData.dueDate} 
            onChange={handleChange} 
            className="form-input" 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <input 
            type="text" 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            className="form-input" 
            placeholder="e.g., Work, Personal" 
          />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ margin: 0 }}>Sub-tasks (Checklist)</label>
          <button 
            type="button" 
            onClick={addSubTask}
            style={{ fontSize: '13px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
          >
            + Add Item
          </button>
        </div>
        {formData.subTasks.map((st, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={st.isCompleted}
              onChange={(e) => {
                const updatedSubTasks = [...formData.subTasks];
                updatedSubTasks[index].isCompleted = e.target.checked;
                setFormData(prev => ({ ...prev, subTasks: updatedSubTasks }));
              }}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <input 
              type="text" 
              value={st.title}
              onChange={(e) => handleSubTaskChange(index, e.target.value)}
              className="form-input" 
              placeholder="Sub-task title"
              style={{ flex: 1, textDecoration: st.isCompleted ? 'line-through' : 'none', color: st.isCompleted ? 'var(--text-muted)' : 'inherit' }}
              required
            />
            <button 
              type="button" 
              onClick={() => removeSubTask(index)}
              style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', height: '100%' }}
            >
              ✕
            </button>
          </div>
        ))}
        {formData.subTasks.length === 0 && (
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No sub-tasks added.</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px 24px', background: 'var(--accent)', color: 'white', 
            borderRadius: '8px', fontWeight: 'bold', opacity: loading ? 0.7 : 1 
          }}
        >
          {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Add Task')}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
