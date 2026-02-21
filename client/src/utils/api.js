import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor - attach JWT
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  changePassword: (data) => API.put('/auth/change-password', data),
};

// Attendance APIs
export const attendanceAPI = {
  checkIn: (data) => API.post('/attendance/checkin', data),
  checkOut: (data) => API.post('/attendance/checkout', data),
  getToday: () => API.get('/attendance/today'),
  getMonthly: (year, month) => API.get(`/attendance/monthly?year=${year}&month=${month}`),
  getHistory: (limit = 10) => API.get(`/attendance/history?limit=${limit}`),
};

// Admin APIs
export const adminAPI = {
  // Employees
  getEmployees: (params = {}) => API.get('/admin/employees', { params }),
  createEmployee: (data) => API.post('/auth/register', data),
  updateEmployee: (id, data) => API.put(`/admin/employees/${id}`, data),
  deleteEmployee: (id) => API.delete(`/admin/employees/${id}`),
  getDepartments: () => API.get('/admin/departments'),

  // Attendance
  getAllAttendance: (params = {}) => API.get('/admin/attendance', { params }),
  getTodayStatus: () => API.get('/admin/attendance/today-status'),
  updateAttendance: (id, data) => API.put(`/admin/attendance/${id}`, data),

  // Dashboard & Export
  getDashboard: () => API.get('/admin/dashboard'),
  exportAttendance: (params = {}) => API.get('/admin/export', {
    params,
    responseType: 'blob'
  }),
};

export default API;