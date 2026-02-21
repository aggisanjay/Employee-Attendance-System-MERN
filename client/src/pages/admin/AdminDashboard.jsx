import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Users, UserCheck, UserX, AlarmClock, BarChart3, RefreshCw,
  LogIn,
} from 'lucide-react';

const STATUS_COLORS = {
  present: '#22c55e', late: '#f59e0b', absent: '#ef4444',
  'half-day': '#a855f7', 'on-leave': '#818cf8'
};

function statusBadge(status) {
  const map = { 'checked-in': 'badge-present', 'checked-out': 'badge-late', 'absent': 'badge-absent' };
  return <span className={`badge ${map[status] || 'badge-absent'}`}>{status.replace('-', ' ')}</span>;
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, todayRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getTodayStatus()
      ]);
      setDashboard(dashRes.data.data);
      setTodayStatus(todayRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="loader-ring" /></div>;

  const { overview, monthlyStats, recentActivity } = dashboard || {};

  const pieData = (monthlyStats || []).map(s => ({
    name: s._id, value: s.count, color: STATUS_COLORS[s._id] || '#4f8ef7'
  }));

  return (
    <div className="page-container" style={{ animation: 'slideIn 0.3s ease' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Admin Dashboard</div>
          <div className="page-subtitle">Real-time attendance monitoring · {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-secondary btn-sm" onClick={fetchData}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Employees', val: overview.totalEmployees,  Icon: Users,       color: 'blue',   sub: `${overview.activeEmployees} active` },
            { label: 'Present Today',   val: overview.presentToday,    Icon: UserCheck,   color: 'green',  sub: `${Math.round((overview.presentToday / overview.activeEmployees) * 100) || 0}% attendance` },
            { label: 'Absent Today',    val: overview.absentToday,     Icon: UserX,       color: 'red',    sub: 'Not checked in' },
            { label: 'Late Today',      val: overview.lateToday,       Icon: AlarmClock,  color: 'yellow', sub: 'Late arrivals' },
            { label: 'Monthly Records', val: overview.monthlyRecords,  Icon: BarChart3,   color: 'purple', sub: 'This month' },
          ].map(({ label, val, Icon, color, sub }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className="stat-icon"><Icon size={22} /></div>
              <div className="stat-value">{val}</div>
              <div className="stat-label">{label}</div>
              <div className="stat-sub">{sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Monthly Status Pie */}
        <div className="card">
          <div className="card-header"><div className="card-title">Monthly Status Distribution</div></div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={11}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><div className="empty-icon">📊</div><div>No data this month</div></div>}
        </div>

        {/* Today Breakdown Bar */}
        <div className="card">
          <div className="card-header"><div className="card-title">Today's Overview</div></div>
          {todayStatus && (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: 'Checked In', val: todayStatus.summary?.checkedIn || 0, fill: '#22c55e' },
                  { name: 'Checked Out', val: todayStatus.summary?.checkedOut || 0, fill: '#f59e0b' },
                  { name: 'Absent', val: todayStatus.summary?.absent || 0, fill: '#ef4444' },
                ]}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {[{ fill: '#22c55e' }, { fill: '#f59e0b' }, { fill: '#ef4444' }].map((c, i) => (
                      <Cell key={i} fill={c.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
                {[
                  { label: 'Checked In', val: todayStatus.summary?.checkedIn || 0, color: 'var(--success)' },
                  { label: 'Checked Out', val: todayStatus.summary?.checkedOut || 0, color: 'var(--warning)' },
                  { label: 'Absent', val: todayStatus.summary?.absent || 0, color: 'var(--danger)' },
                ].map(i => (
                  <div key={i.label} style={{ textAlign: 'center', flex: 1, padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <div className="font-mono" style={{ fontWeight: 800, fontSize: '1.2rem', color: i.color }}>{i.val}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{i.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Today's Live Status Table */}
      {todayStatus && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div><div className="card-title">Live Employee Status</div><div className="card-subtitle">Today's check-in status · {todayStatus.date}</div></div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>Employee</th><th>ID</th><th>Department</th>
                <th>Status</th><th>Check In</th><th>Check Out</th>
              </tr></thead>
              <tbody>
                {todayStatus.data?.slice(0, 15).map(item => (
                  <tr key={item.employee._id}>
                    <td style={{ fontWeight: 500 }}>{item.employee.name}</td>
                    <td className="font-mono text-accent" style={{ fontSize: '0.8rem' }}>{item.employee.employeeId}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.employee.department}</td>
                    <td>{statusBadge(item.status)}</td>
                    <td className="font-mono text-success" style={{ fontSize: '0.8rem' }}>
                      {item.attendance?.checkIn?.time ? new Date(item.attendance.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="font-mono text-danger" style={{ fontSize: '0.8rem' }}>
                      {item.attendance?.checkOut?.time ? new Date(item.attendance.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Check-ins Today</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentActivity.map(r => (
              <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.8rem', flexShrink: 0 }}>
                  {r.employee?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.employee?.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.employee?.department} · {r.employee?.employeeId}</div>
                </div>
                <div className="font-mono text-success" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <LogIn size={13} color="var(--success)" />
                  {r.checkIn?.time ? new Date(r.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}