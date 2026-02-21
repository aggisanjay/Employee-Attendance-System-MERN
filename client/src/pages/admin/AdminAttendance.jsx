import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../utils/api';
import { Download, RefreshCw, RotateCcw, LogIn, LogOut } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function statusBadge(status) {
  const map = { present: 'badge-present', late: 'badge-late', absent: 'badge-absent', 'half-day': 'badge-half-day', 'on-leave': 'badge-on-leave', weekend: 'badge-weekend' };
  return <span className={`badge ${map[status] || 'badge-absent'}`}>{status?.replace('-', ' ') || '—'}</span>;
}

function formatMins(mins) {
  if (!mins) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function AdminAttendance() {
  const now = new Date();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [departments, setDepartments] = useState([]);

  // Filters
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        month: filterMonth, year: filterYear, page: pagination.page, limit: 25
      };
      if (filterDept) params.department = filterDept;
      if (filterStatus) params.status = filterStatus;
      if (filterEmployeeId) params.employeeId = filterEmployeeId;
      const { data } = await adminAPI.getAllAttendance(params);
      setRecords(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterDept, filterStatus, filterEmployeeId, pagination.page]);

  useEffect(() => {
    adminAPI.getDepartments().then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { month: filterMonth, year: filterYear };
      if (filterDept) params.department = filterDept;
      if (filterEmployeeId) params.employeeId = filterEmployeeId;

      const response = await adminAPI.exportAttendance(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_${MONTHS[filterMonth - 1]}_${filterYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('📥 Excel exported successfully!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="page-container" style={{ animation: 'slideIn 0.3s ease' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">🗓️ Attendance Records</div>
          <div className="page-subtitle">{pagination.total} records · {MONTHS[filterMonth - 1]} {filterYear}</div>
        </div>
        <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
          {exporting ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Exporting...</> : <><Download size={14} /> Export Excel</>}
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 140 }}>
            <label className="form-label">Month</label>
            <select className="form-select" value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <label className="form-label">Year</label>
            <select className="form-select" value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="form-label">Department</label>
            <select className="form-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 140 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half-day">Half Day</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="form-label">Employee ID</label>
            <input className="form-input" placeholder="EMP001" value={filterEmployeeId} onChange={e => setFilterEmployeeId(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => { setFilterDept(''); setFilterStatus(''); setFilterEmployeeId(''); }}><RotateCcw size={13} /> Reset</button>
          <button className="btn btn-primary" onClick={fetchRecords}><RefreshCw size={13} /> Apply</button>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="loader-ring" /></div>
        ) : records.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🗓️</div><div>No attendance records found</div><div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Try changing the filters</div></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>Employee</th><th>Date</th><th>Shift</th>
                  <th>Check In</th><th>Check Out</th>
                  <th>Working Hrs</th><th>OT</th>
                  <th>Status</th><th>Late</th>
                </tr></thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{r.employee?.name || '—'}</div>
                        <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>{r.employee?.employeeId} · {r.employee?.department}</div>
                      </td>
                      <td className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        <div>{r.dateString}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(r.date).toLocaleDateString('en', { weekday: 'short' })}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        <div style={{ textTransform: 'capitalize' }}>{r.shift?.type || '—'}</div>
                        <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{r.shift?.scheduledStart}–{r.shift?.scheduledEnd}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <LogIn size={12} color="var(--success)" />
                          <span className="font-mono text-success">{r.checkIn?.time ? new Date(r.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <LogOut size={12} color="var(--danger)" />
                          <span className="font-mono text-danger">{r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.85rem' }}>{formatMins(r.workingHours)}</td>
                      <td className="font-mono" style={{ fontSize: '0.85rem', color: r.overtime > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {formatMins(r.overtime)}
                      </td>
                      <td>{statusBadge(r.status)}</td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {r.isLate
                          ? <span style={{ color: 'var(--warning)' }}>+{r.lateByMinutes}m</span>
                          : <span style={{ color: 'var(--success)' }}>✓</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1}>← Prev</button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {pagination.page} of {pagination.pages}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))} disabled={pagination.page === pagination.pages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Info */}
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Download size={24} color="var(--accent)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Export to Excel</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Export attendance for {MONTHS[filterMonth - 1]} {filterYear}{filterDept ? ` · ${filterDept}` : ''} as a detailed Excel spreadsheet with working hours, overtime, shift compliance and summary.
          </div>
        </div>
        <button className="btn btn-success btn-sm" onClick={handleExport} disabled={exporting} style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {exporting ? <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <><Download size={13} /> Export</>}
        </button>
      </div>
    </div>
  );
}