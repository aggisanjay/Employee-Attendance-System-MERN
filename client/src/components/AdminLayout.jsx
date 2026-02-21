import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const adminNav = [
  { path: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { path: '/admin/employees', icon: '👥', label: 'Employees' },
  { path: '/admin/attendance', icon: '🗓️', label: 'Attendance Records' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">🛡️</div>
            <div>
              <div className="logo-text">ShiftTrack</div>
              <div className="logo-sub" style={{ color: 'var(--accent)' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #ef4444, #7c3aed)' }}>{initials}</div>
          <div className="user-name">{user?.name}</div>
          <div className="user-role" style={{ color: 'var(--danger)' }}>● Administrator</div>
          <div className="user-id">{user?.employeeId} · {user?.department}</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Admin Navigation</div>
          {adminNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" style={{ width: '100%', border: 'none', marginBottom: '0.5rem', background: 'rgba(34,197,94,0.05)', color: 'var(--success)' }} onClick={() => navigate('/dashboard')}>
            <span className="nav-icon">👤</span>
            Employee View
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}