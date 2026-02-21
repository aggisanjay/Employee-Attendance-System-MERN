import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { attendanceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle,
  Timer, Flame, Zap, RefreshCw, CalendarDays, ClipboardList,
} from 'lucide-react';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div className="time-display">{time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      <div className="date-display">{time.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  );
}

function formatMins(mins) {
  if (!mins) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function statusBadge(status) {
  const map = { present: 'badge-present', late: 'badge-late', absent: 'badge-absent', 'half-day': 'badge-half-day', 'on-leave': 'badge-on-leave', weekend: 'badge-weekend' };
  return <span className={`badge ${map[status] || 'badge-absent'}`}>{status || 'N/A'}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const now = new Date();
      const [todayRes, monthlyRes, historyRes] = await Promise.all([
        attendanceAPI.getToday(),
        attendanceAPI.getMonthly(now.getFullYear(), now.getMonth() + 1),
        attendanceAPI.getHistory(7)
      ]);
      setTodayRecord(todayRes.data.data);
      setMonthlySummary(monthlyRes.data.summary);
      setRecentHistory(historyRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkedIn = todayRecord?.checkIn?.time;
  const checkedOut = todayRecord?.checkOut?.time;

  if (loading) return <div className="loading-spinner"><div className="loader-ring" /></div>;

  return (
    <div className="page-container" style={{ animation: 'slideIn 0.3s ease' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋</div>
          <div className="page-subtitle">{user?.designation} · {user?.department}</div>
        </div>
        <div className="page-actions">
          <Link to="/attendance" className="btn btn-primary"><Clock size={15} /> Mark Attendance</Link>
          <Link to="/calendar" className="btn btn-secondary"><CalendarDays size={15} /> View Calendar</Link>
        </div>
      </div>

      {/* Live Clock + Today Status */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <LiveClock />
          <div className="divider" />
          <div className="flex items-center gap-2">
            <div className={`punch-status ${checkedIn ? 'in' : 'out'}`}>
              <div className="pulse-dot" />
              {checkedIn && !checkedOut ? 'Currently Working' : checkedIn && checkedOut ? 'Shift Complete' : 'Not Checked In'}
            </div>
          </div>
          {checkedIn && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <CheckCircle2 size={14} color="var(--success)" />
              <span>In: {new Date(todayRecord.checkIn.time).toLocaleTimeString()}</span>
              {checkedOut && <>
                <XCircle size={14} color="var(--danger)" style={{ marginLeft: '0.5rem' }} />
                <span>Out: {new Date(todayRecord.checkOut.time).toLocaleTimeString()}</span>
              </>}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Today's Summary</div><div className="card-subtitle">{new Date().toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</div></div>
            {todayRecord && statusBadge(todayRecord.status)}
          </div>
          <div className="grid-2">
            {[
              { label: 'Working Hours', val: formatMins(todayRecord?.workingHours), Icon: Timer },
              { label: 'Overtime',      val: formatMins(todayRecord?.overtime),     Icon: Flame },
              { label: 'Late By',       val: todayRecord?.isLate ? `${todayRecord.lateByMinutes}m` : 'On Time', Icon: Zap },
              { label: 'Shift',         val: user?.shift?.type || '—',              Icon: RefreshCw },
            ].map(({ label, val, Icon }) => (
              <div key={label} style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <Icon size={18} color="var(--accent)" style={{ marginBottom: '0.4rem' }} />
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      {monthlySummary && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Present',      value: monthlySummary.present,                         Icon: CheckCircle2, color: 'green'  },
            { label: 'Late Arrivals',value: monthlySummary.late,                            Icon: AlertTriangle,color: 'yellow' },
            { label: 'Absent',       value: monthlySummary.absent,                          Icon: XCircle,      color: 'red'    },
            { label: 'Half Days',    value: monthlySummary.halfDay,                         Icon: ClipboardList, color: 'purple' },
            { label: 'Total Hours',  value: formatMins(monthlySummary.totalWorkingHours),   Icon: Clock,        color: 'blue'   },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className="stat-icon"><Icon size={22} /></div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
              <div className="stat-sub">This Month</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent History */}
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Recent Attendance</div><div className="card-subtitle">Last 7 records</div></div>
          <Link to="/calendar" className="btn btn-secondary btn-sm"><CalendarDays size={13} /> View All</Link>
        </div>
        {recentHistory.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📋</div><div>No attendance records yet</div></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr>
                <th>Date</th><th>Check In</th><th>Check Out</th>
                <th>Working Hrs</th><th>Status</th><th>Late</th>
              </tr></thead>
              <tbody>
                {recentHistory.map(r => (
                  <tr key={r._id}>
                    <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>{r.dateString}</td>
                    <td className="font-mono text-success">{r.checkIn?.time ? new Date(r.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="font-mono text-danger">{r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="font-mono">{formatMins(r.workingHours)}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td style={{ color: r.isLate ? 'var(--warning)' : 'var(--success)', fontSize: '0.8rem' }}>
                      {r.isLate ? `+${r.lateByMinutes}m` : '✓ On time'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}