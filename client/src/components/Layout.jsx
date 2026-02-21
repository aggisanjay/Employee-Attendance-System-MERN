import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  LayoutDashboard, Clock, CalendarDays,
  Building2, ShieldCheck, LogOut,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/attendance', icon: Clock, label: 'Mark Attendance' },
  { path: '/calendar', icon: CalendarDays, label: 'My Calendar' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon"><Building2 size={18} color="white" /></div>
            <div>
              <div className="logo-text">ShiftTrack</div>
              <div className="logo-sub">v2.0.0 — Employee</div>
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-name">{user?.name}</div>
          <div className="user-role">● {user?.role}</div>
          <div className="user-id">{user?.employeeId} · {user?.department}</div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {user?.shift?.type} · {user?.shift?.startTime}–{user?.shift?.endTime}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(({ path, icon:Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {user?.role === 'admin' && (
            <button
              className="nav-item"
              style={{ width: '100%', border: 'none', marginBottom: '0.5rem', background: 'rgba(79,142,247,0.05)', color: 'var(--accent)' }}
              onClick={() => navigate('/admin')}
            >
              <ShieldCheck size={16} className="nav-icon" />
              Admin Panel
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}