import React from 'react';
import TaskForm from '../components/TaskForm';

const AddTask = () => {
  return (
    <div className="add-task-page">
      <div className="page-header">
        <h1 className="page-title">Add New Task</h1>
        <p className="page-subtitle">Create a new task to keep track of your work.</p>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <TaskForm />
      </div>
    </div>
  );
};

export default AddTask;
