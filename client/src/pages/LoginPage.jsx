import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Building2, Clock, CalendarDays, BarChart3, Download, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const features = [
  { icon: Clock,        title: 'Real-time IN/OUT',    text: 'Mark attendance with auto shift calculation' },
  { icon: CalendarDays, title: 'Monthly Calendar',    text: 'Visual attendance overview for the whole month' },
  { icon: BarChart3,    title: 'Admin Dashboard',     text: 'Manage employees, view reports & export data' },
  { icon: Download,     title: 'Excel Export',        text: 'Download detailed attendance sheets instantly' },
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    if (type === 'admin') setForm({ email: 'admin@company.com', password: 'admin123' });
    else setForm({ email: 'rajesh@company.com', password: 'emp123' });
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-grid" />
        <div className="login-bg-glow" />
      </div>
      <div className="login-container">
        {/* Left Panel */}
        <div className="login-left">
          <div className="login-brand">
            <div className="login-brand-logo"><Building2 size={28} color="white" /></div>
            <div className="login-brand-name">Shift<span>Track</span></div>
            <div className="login-brand-tagline">Enterprise Attendance & Shift Management</div>
          </div>
          <div className="login-features">
            {features.map(({ icon: Icon, title, text }) => (
              <div className="login-feature" key={title}>
                <div className="login-feature-icon"><Icon size={22} color="var(--accent)" /></div>
                <div>
                  <div className="login-feature-title">{title}</div>
                  <div className="login-feature-text">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-right">
          <div className="login-form-card">
            <div className="login-form-title">Welcome Back</div>
            <div className="login-form-subtitle">Sign in to your account to continue</div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                  : <><ArrowRight size={16} /> Sign In</>
                }
              </button>
            </form>

            <div className="demo-credentials">
              <div className="demo-title">Demo Credentials</div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('admin')}>Fill Admin</button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => fillDemo('employee')}>Fill Employee</button>
              </div>
              <div className="demo-row"><span className="demo-label">Admin:</span><span className="demo-value">admin@company.com / admin123</span></div>
              <div className="demo-row"><span className="demo-label">Employee:</span><span className="demo-value">rajesh@company.com / emp123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}