import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../../utils/api';
import { UserPlus, Search, RefreshCw, Pencil, Ban } from 'lucide-react';

const SHIFT_OPTIONS = [
  { value: 'morning', label: '🌅 Morning (9AM - 6PM)' },
  { value: 'afternoon', label: '☀️ Afternoon (1PM - 10PM)' },
  { value: 'night', label: '🌙 Night (10PM - 7AM)' },
  { value: 'flexible', label: '🔄 Flexible' },
];

const SHIFT_DEFAULTS = {
  morning: { startTime: '09:00', endTime: '18:00' },
  afternoon: { startTime: '13:00', endTime: '22:00' },
  night: { startTime: '22:00', endTime: '07:00' },
  flexible: { startTime: '08:00', endTime: '17:00' },
};

function EmployeeModal({ employee, onClose, onSave, isCreate = false }) {
  const [form, setForm] = useState(employee || {
    name: '', email: '', password: '', employeeId: '',
    department: '', designation: 'Staff', phone: '', role: 'employee',
    shift: { type: 'morning', startTime: '09:00', endTime: '18:00' }
  });
  const [saving, setSaving] = useState(false);

  const handleShiftTypeChange = (type) => {
    setForm(f => ({ ...f, shift: { type, ...SHIFT_DEFAULTS[type] } }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.department) return toast.error('Name, email and department are required');
    if (isCreate && (!form.password || !form.employeeId)) return toast.error('Password and Employee ID required');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isCreate ? '➕ Add New Employee' : '✏️ Edit Employee'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Employee ID *</label>
            <input className="form-input" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} placeholder="EMP001" disabled={!isCreate} style={{ opacity: !isCreate ? 0.5 : 1 }} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" disabled={!isCreate} style={{ opacity: !isCreate ? 0.5 : 1 }} />
        </div>
        {isCreate && (
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" />
          </div>
        )}
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Department *</label>
            <input className="form-input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="Engineering" />
          </div>
          <div className="form-group">
            <label className="form-label">Designation</label>
            <input className="form-input" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Developer" />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Shift Type</label>
          <select className="form-select" value={form.shift?.type || 'morning'} onChange={e => handleShiftTypeChange(e.target.value)}>
            {SHIFT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Shift Start</label>
            <input className="form-input" type="time" value={form.shift?.startTime || '09:00'} onChange={e => setForm(f => ({ ...f, shift: { ...f.shift, startTime: e.target.value } }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Shift End</label>
            <input className="form-input" type="time" value={form.shift?.endTime || '18:00'} onChange={e => setForm(f => ({ ...f, shift: { ...f.shift, endTime: e.target.value } }))} />
          </div>
        </div>
        {!isCreate && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isActive !== false} onChange={e => set('isActive', e.target.checked)} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Account Active</span>
            </label>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? '⏳ Saving...' : isCreate ? <><UserPlus size={14}/> Add Employee</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [departments, setDepartments] = useState([]);
  const [modal, setModal] = useState(null); // null | 'create' | employee object
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15 };
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await adminAPI.getEmployees(params);
      setEmployees(data.data);
      setPagination(data.pagination);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter, pagination.page]);

  useEffect(() => {
    adminAPI.getDepartments().then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleCreate = async (form) => {
    await adminAPI.createEmployee(form);
    toast.success('Employee added successfully!');
    fetchEmployees();
  };

  const handleUpdate = async (form) => {
    await adminAPI.updateEmployee(modal._id, form);
    toast.success('Employee updated!');
    fetchEmployees();
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Deactivate ${name}? They won't be able to login.`)) return;
    await adminAPI.deleteEmployee(id);
    toast.success('Employee deactivated');
    fetchEmployees();
  };

  return (
    <div className="page-container" style={{ animation: 'slideIn 0.3s ease' }}>
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="page-title">👥 Employee Management</div>
          <div className="page-subtitle">{pagination.total} total employees</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}><UserPlus size={15} /> Add Employee</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2', minWidth: 200 }}>
            <label className="form-label">Search</label>
            <input className="form-input" placeholder="Name, ID or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: '1', minWidth: 150 }}>
            <label className="form-label">Department</label>
            <select className="form-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: 130 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={fetchEmployees}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-spinner"><div className="loader-ring" /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">👥</div><div>No employees found</div></div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr>
                  <th>Employee</th><th>ID</th><th>Department</th>
                  <th>Shift</th><th>Role</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.75rem', flexShrink: 0 }}>
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{emp.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-accent" style={{ fontSize: '0.8rem' }}>{emp.employeeId}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <div>{emp.department}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        <div>{emp.shift?.type}</div>
                        <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{emp.shift?.startTime}–{emp.shift?.endTime}</div>
                      </td>
                      <td><span className={`badge badge-${emp.role}`}>{emp.role}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.5rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 600, background: emp.isActive ? 'var(--success-glow)' : 'var(--danger-glow)', color: emp.isActive ? 'var(--success)' : 'var(--danger)' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(emp)}><Pencil size={13} /></button>
                          {emp.isActive && <button className="btn btn-sm" style={{ background: 'var(--danger-glow)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => handleDeactivate(emp._id, emp.name)}><Ban size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                {Array.from({ length: pagination.pages }).map((_, i) => (
                  <button key={i} className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modal === 'create' && <EmployeeModal isCreate onClose={() => setModal(null)} onSave={handleCreate} />}
      {modal && modal !== 'create' && <EmployeeModal employee={modal} onClose={() => setModal(null)} onSave={handleUpdate} />}
    </div>
  );
}