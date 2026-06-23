import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Menu, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import TimerWidget from './TimerWidget';

const Header = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { searchQuery, setSearchQuery } = useTasks();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <WorkspaceSwitcher />
        <div className="header-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="header-right">
        <TimerWidget compact />
        <NotificationCenter />
        <button className="header-btn" onClick={toggleTheme} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user && (
          <div className="user-profile" ref={dropdownRef} style={{ position: 'relative', marginLeft: '12px' }}>
            <button
              className="user-profile-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="user-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
              </div>
              <span className="user-name" style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', display: 'block', maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name || 'User'}
              </span>
            </button>

            {showDropdown && (
              <div className="user-dropdown" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', minWidth: '160px', zIndex: 1000, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email || ''}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '14px', fontWeight: '500', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
