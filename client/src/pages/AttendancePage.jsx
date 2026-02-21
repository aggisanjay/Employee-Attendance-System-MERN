import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { attendanceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  LogIn, LogOut, CheckCircle2, XCircle, Timer,
  Flame, Zap, RefreshCw, MapPin, Clock,
} from 'lucide-react';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="time-display" style={{ fontSize: '4rem', textAlign: 'center' }}>
        {time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="date-display" style={{ textAlign: 'center', fontSize: '0.95rem', marginTop: '0.5rem' }}>
        {time.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

function formatMins(mins) {
  if (!mins) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState('');

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await attendanceAPI.getToday();
      setTodayRecord(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const { data } = await attendanceAPI.checkIn({ note, location: 'Office' });
      toast.success(data.message);
      setNote('');
      fetchToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const { data } = await attendanceAPI.checkOut({ note, location: 'Office' });
      toast.success(data.message);
      setNote('');
      fetchToday();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const checkedIn = todayRecord?.checkIn?.time;
  const checkedOut = todayRecord?.checkOut?.time;
  const isComplete = checkedIn && checkedOut;

  if (loading) return <div className="loading-spinner"><div className="loader-ring" /></div>;

  return (
    <div className="page-container" style={{ animation: 'slideIn 0.3s ease', maxWidth: '800px' }}>
      <div className="page-header">
        <div className="page-title">Mark Attendance</div>
        <div className="page-subtitle">Record your daily check-in and check-out</div>
      </div>

      {/* Main Punch Card */}
      <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className={`punch-status ${checkedIn ? 'in' : 'out'}`} style={{ margin: '0 auto 1.5rem', display: 'inline-flex' }}>
            <div className="pulse-dot" />
            {isComplete ? '✅ Shift Complete' : checkedIn ? '🟢 Currently Working' : '⭕ Not Checked In'}
          </div>
          <LiveClock />
        </div>

        {/* Shift info */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Your Shift', val: `${user?.shift?.type?.toUpperCase() || '—'}` },
            { label: 'Start Time', val: user?.shift?.startTime || '—' },
            { label: 'End Time', val: user?.shift?.endTime || '—' },
            { label: 'Department', val: user?.department || '—' },
          ].map(i => (
            <div key={i.label} style={{ padding: '0.625rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)' }}>{i.val}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{i.label}</div>
            </div>
          ))}
        </div>

        {/* Note input */}
        {!isComplete && (
          <div style={{ maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Optional note (e.g., working from home)"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ textAlign: 'center' }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!checkedIn && (
            <button
              className="btn btn-success btn-lg"
              onClick={handleCheckIn}
              disabled={actionLoading}
              style={{ minWidth: '180px', fontSize: '1rem' }}
            >
              {actionLoading
                ? <div className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <><LogIn size={18} /> CHECK IN</>
              }
            </button>
          )}
          {checkedIn && !checkedOut && (
            <button
              className="btn btn-danger btn-lg"
              onClick={handleCheckOut}
              disabled={actionLoading}
              style={{ minWidth: '180px', fontSize: '1rem' }}
            >
              {actionLoading
                ? <div className="loader-ring" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : <><LogOut size={18} /> CHECK OUT</>
              }
            </button>
          )}
          {isComplete && (
            <div style={{ padding: '1rem', background: 'var(--success-glow)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> You have completed your shift for today!
            </div>
          )}
        </div>
      </div>

      {/* Today's Detail */}
      {todayRecord && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Today's Detail</div>
            <span className={`badge badge-${todayRecord.status}`}>{todayRecord.status}</span>
          </div>
          <div className="grid-2" style={{ gap: '1rem' }}>
            {[
              { label: 'Check In Time',  val: checkedIn ? new Date(todayRecord.checkIn.time).toLocaleTimeString() : '—',  Icon: LogIn,       iconColor: 'var(--success)' },
              { label: 'Check Out Time', val: checkedOut ? new Date(todayRecord.checkOut.time).toLocaleTimeString() : 'Pending', Icon: LogOut, iconColor: 'var(--danger)'  },
              { label: 'Working Hours',  val: formatMins(todayRecord.workingHours),  Icon: Timer,      iconColor: 'var(--accent)'  },
              { label: 'Overtime',       val: formatMins(todayRecord.overtime),      Icon: Flame,      iconColor: 'var(--warning)' },
              { label: 'Late Status',    val: todayRecord.isLate ? `${todayRecord.lateByMinutes} min late` : 'On Time', Icon: Zap, iconColor: todayRecord.isLate ? 'var(--warning)' : 'var(--success)', color: todayRecord.isLate ? 'var(--warning)' : 'var(--success)' },
              { label: 'Early Leave',    val: todayRecord.earlyLeave ? `${todayRecord.earlyLeaveByMinutes} min early` : 'No', Icon: Clock, iconColor: todayRecord.earlyLeave ? 'var(--danger)' : 'var(--success)', color: todayRecord.earlyLeave ? 'var(--danger)' : 'var(--success)' },
            ].map(({ label, val, Icon, iconColor, color }) => (
              <div key={label} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <Icon size={14} color={iconColor} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 600, color: color || 'var(--text-primary)' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}