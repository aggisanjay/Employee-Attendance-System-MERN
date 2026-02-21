import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../utils/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function formatMins(mins) {
  if (!mins) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getMonthly(year, month);
      setRecords(data.data);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const recordMap = {};
  records.forEach(r => { recordMap[r.dateString] = r; });

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    const cy = now.getFullYear(), cm = now.getMonth() + 1;
    if (year === cy && month === cm) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const getDayClass = (dateStr, dayOfWeek) => {
    const today = now.toISOString().split('T')[0];
    if (dateStr === today) return 'today';
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';
    const rec = recordMap[dateStr];
    if (!rec) {
      if (dateStr < today) return 'absent';
      return '';
    }
    return rec.status === 'late' ? 'late' : rec.status === 'half-day' ? 'half-day' : rec.status === 'on-leave' ? 'on-leave' : 'present';
  };

  const selectedRecord = selected ? recordMap[selected] : null;

  return (
    <div className="page-container" style={{ animation: 'slideIn 0.3s ease' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">Attendance Calendar</div>
          <div className="page-subtitle">Monthly overview of your attendance</div>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={prevMonth}>← Prev</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{MONTHS[month - 1]} {year}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={nextMonth} disabled={year === now.getFullYear() && month === now.getMonth() + 1}>
            Next →
          </button>
        </div>

        {/* Day Headers */}
        <div className="calendar-grid" style={{ marginBottom: '0.5rem' }}>
          {DAYS.map(d => <div key={d} className="cal-header">{d}</div>)}
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="loading-spinner"><div className="loader-ring" /></div>
        ) : (
          <div className="calendar-grid">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="cal-day empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month - 1, day);
              const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const dayClass = getDayClass(dateStr, date.getDay());
              const rec = recordMap[dateStr];
              return (
                <div
                  key={day}
                  className={`cal-day ${dayClass}`}
                  style={{ cursor: rec ? 'pointer' : 'default' }}
                  onClick={() => rec && setSelected(selected === dateStr ? null : dateStr)}
                  title={rec ? `${rec.status} - ${rec.checkIn?.time ? new Date(rec.checkIn.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}` : ''}
                >
                  <div className="cal-day-num">{day}</div>
                  {rec && <div className="cal-dot" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { cls: 'present', label: 'Present' },
            { cls: 'late', label: 'Late' },
            { cls: 'absent', label: 'Absent' },
            { cls: 'half-day', label: 'Half Day' },
            { cls: 'weekend', label: 'Weekend' },
            { cls: 'today', label: 'Today' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div className={`cal-day ${l.cls}`} style={{ width: 16, height: 16, borderRadius: 4, aspectRatio: 'unset', padding: 0 }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedRecord && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)', animation: 'slideUp 0.2s ease' }}>
          <div className="card-header">
            <div className="card-title">📅 {selected}</div>
            <span className={`badge badge-${selectedRecord.status}`}>{selectedRecord.status}</span>
          </div>
          <div className="grid-2">
            {[
              { label: 'Check In', val: selectedRecord.checkIn?.time ? new Date(selectedRecord.checkIn.time).toLocaleTimeString() : '—', icon: '🟢' },
              { label: 'Check Out', val: selectedRecord.checkOut?.time ? new Date(selectedRecord.checkOut.time).toLocaleTimeString() : '—', icon: '🔴' },
              { label: 'Working Hours', val: formatMins(selectedRecord.workingHours), icon: '⏱️' },
              { label: 'Overtime', val: formatMins(selectedRecord.overtime), icon: '🔥' },
            ].map(i => (
              <div key={i.label} style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{i.icon} {i.label}</div>
                <div className="font-mono" style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{i.val}</div>
              </div>
            ))}
          </div>
          {selectedRecord.isLate && (
            <div style={{ marginTop: '0.75rem', padding: '0.625rem 1rem', background: 'var(--warning-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--warning)', fontSize: '0.85rem' }}>
              ⚠️ Late by {selectedRecord.lateByMinutes} minutes
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      {summary && (
        <div className="card">
          <div className="card-header"><div className="card-title">Monthly Summary</div></div>
          <div className="stats-grid">
            {[
              { label: 'Present Days', val: summary.present, color: 'var(--success)' },
              { label: 'Late Arrivals', val: summary.late, color: 'var(--warning)' },
              { label: 'Absent', val: summary.absent, color: 'var(--danger)' },
              { label: 'Half Days', val: summary.halfDay, color: 'var(--purple)' },
              { label: 'On Leave', val: summary.onLeave, color: 'var(--accent)' },
              { label: 'Total Hours', val: formatMins(summary.totalWorkingHours), color: 'var(--text-primary)' },
              { label: 'Total Overtime', val: formatMins(summary.totalOvertime), color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}