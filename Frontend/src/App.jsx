import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddTask from './pages/AddTask';
import Tasks from './pages/Tasks';
import Trash from './pages/Trash';
import CompletedTasks from './pages/CompletedTasks';
import Kanban from './pages/Kanban';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="add-task" element={<AddTask />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="completed" element={<CompletedTasks />} />
            <Route path="trash" element={<Trash />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;