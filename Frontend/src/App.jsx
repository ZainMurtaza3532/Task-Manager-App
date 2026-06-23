import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddTask = lazy(() => import('./pages/AddTask'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Trash = lazy(() => import('./pages/Trash'));
const CompletedTasks = lazy(() => import('./pages/CompletedTasks'));
const Kanban = lazy(() => import('./pages/Kanban'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Settings = lazy(() => import('./pages/Settings'));
const Calendar = lazy(() => import('./pages/Calendar'));
const TimeTracking = lazy(() => import('./pages/TimeTracking'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Teams = lazy(() => import('./pages/Teams'));
const TeamDashboard = lazy(() => import('./pages/TeamDashboard'));
const JoinTeam = lazy(() => import('./pages/JoinTeam'));
const Notifications = lazy(() => import('./pages/Notifications'));

const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner" />
    <p>Loading...</p>
  </div>
);

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/join-team" element={<JoinTeam />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="add-task" element={<AddTask />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="kanban" element={<Kanban />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="time-tracking" element={<TimeTracking />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="teams" element={<Teams />} />
                <Route path="teams/:id" element={<TeamDashboard />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="completed" element={<CompletedTasks />} />
                <Route path="trash" element={<Trash />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
