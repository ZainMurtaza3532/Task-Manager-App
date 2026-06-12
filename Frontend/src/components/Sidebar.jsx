import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, PlusSquare, Trash2, X, CheckCircle, Columns, Settings as SettingsIcon } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { stats } = useTasks();

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <CheckSquare size={24} />
                    </div>
                    <div className="sidebar-logo-text">Task<span>Flow</span></div>
                </div>
                <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-label">Main Menu</div>

                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink to="/add-task" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <PlusSquare size={20} />
                    <span>Add Task</span>
                </NavLink>

                <NavLink to="/kanban" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <Columns size={20} />
                    <span>Kanban Board</span>
                </NavLink>

                <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <CheckSquare size={20} />
                    <span>All Tasks</span>
                    {stats.pending + stats.inProgress > 0 && (
                        <span className="nav-badge">{stats.pending + stats.inProgress}</span>
                    )}
                </NavLink>

                <NavLink to="/completed" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <CheckCircle size={20} />
                    <span>Completed Tasks</span>
                    {stats.completed > 0 && (
                        <span className="nav-badge" style={{ background: 'var(--success)' }}>{stats.completed}</span>
                    )}
                </NavLink>

                <div className="nav-label" style={{ marginTop: '16px' }}>Management</div>

                <NavLink to="/trash" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <Trash2 size={20} />
                    <span>Trash</span>
                    {stats.trashedCount > 0 && (
                        <span className="nav-badge" style={{ background: 'var(--text-muted)' }}>{stats.trashedCount}</span>
                    )}
                </NavLink>

                <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                    <SettingsIcon size={20} />
                    <span>Settings</span>
                </NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;