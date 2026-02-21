import express from 'express';
import * as XLSX from 'xlsx';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ─── EMPLOYEE MANAGEMENT ───────────────────────────────────────────────────────

// @GET /api/admin/employees - Get all employees
router.get('/employees', async (req, res) => {
  try {
    const { department, status, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (department) query.department = { $regex: department, $options: 'i' };
    if (status === 'active') query.isActive = true;
    else if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: employees,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @PUT /api/admin/employees/:id - Update employee
router.put('/employees/:id', async (req, res) => {
  try {
    const { name, department, designation, phone, role, shift, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, department, designation, phone, role, shift, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });

    res.json({ success: true, message: 'Employee updated successfully', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @DELETE /api/admin/employees/:id - Deactivate employee
router.delete('/employees/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, message: 'Employee deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/admin/departments - Get unique departments
router.get('/departments', async (req, res) => {
  try {
    const departments = await User.distinct('department');
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ATTENDANCE MANAGEMENT ─────────────────────────────────────────────────────

// @GET /api/admin/attendance - Get all attendance with filters
router.get('/attendance', async (req, res) => {
  try {
    const { date, month, year, employeeId, department, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (date) {
      query.dateString = date;
    } else if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (status) query.status = status;
    
    // If department filter, first get employee ids from that dept
    if (department) {
      const deptEmployees = await User.find({ department: { $regex: department, $options: 'i' } }).select('_id');
      query.employee = { $in: deptEmployees.map(e => e._id) };
    }
    
    if (employeeId) {
      const emp = await User.findOne({ employeeId: employeeId.toUpperCase() });
      if (emp) query.employee = emp._id;
    }

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('employee', 'name employeeId department designation shift')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: records,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/admin/attendance/today-status - Today's status for all employees
router.get('/attendance/today-status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allEmployees = await User.find({ isActive: true, role: 'employee' }).select('name employeeId department shift');
    const todayRecords = await Attendance.find({ dateString: today });

    const recordMap = {};
    todayRecords.forEach(r => { recordMap[r.employee.toString()] = r; });

    const statusList = allEmployees.map(emp => ({
      employee: emp,
      attendance: recordMap[emp._id.toString()] || null,
      status: recordMap[emp._id.toString()]
        ? (recordMap[emp._id.toString()].checkOut.time ? 'checked-out' : 'checked-in')
        : 'absent'
    }));

    const summary = {
      total: allEmployees.length,
      checkedIn: statusList.filter(s => s.status === 'checked-in').length,
      checkedOut: statusList.filter(s => s.status === 'checked-out').length,
      absent: statusList.filter(s => s.status === 'absent').length
    };

    res.json({ success: true, data: statusList, summary, date: today });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @PUT /api/admin/attendance/:id - Edit attendance record
router.put('/attendance/:id', async (req, res) => {
  try {
    const { checkIn, checkOut, status, remarks } = req.body;
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { checkIn, checkOut, status, remarks },
      { new: true }
    ).populate('employee', 'name employeeId');

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, message: 'Attendance updated', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DASHBOARD & STATS ─────────────────────────────────────────────────────────

// @GET /api/admin/dashboard - Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEmployees, activeEmployees, todayRecords,
      monthlyRecords, lateToday
    ] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', isActive: true }),
      Attendance.countDocuments({ dateString: today }),
      Attendance.countDocuments({ date: { $gte: startOfMonth } }),
      Attendance.countDocuments({ dateString: today, isLate: true })
    ]);

    const todayAbsent = activeEmployees - todayRecords;
    
    // Monthly stats
    const monthlyStats = await Attendance.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgWorkingHours: { $avg: '$workingHours' }
      }}
    ]);

    // Recent activity (last 10 check-ins)
    const recentActivity = await Attendance.find({ dateString: today })
      .populate('employee', 'name employeeId department')
      .sort({ 'checkIn.time': -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalEmployees, activeEmployees,
          presentToday: todayRecords,
          absentToday: Math.max(0, todayAbsent),
          lateToday, monthlyRecords
        },
        monthlyStats,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── EXPORT ────────────────────────────────────────────────────────────────────

// @GET /api/admin/export - Export attendance to Excel
router.get('/export', async (req, res) => {
  try {
    const { month, year, department, employeeId } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    let query = { date: { $gte: startDate, $lte: endDate } };

    if (department) {
      const deptEmployees = await User.find({ department: { $regex: department, $options: 'i' } }).select('_id');
      query.employee = { $in: deptEmployees.map(e => e._id) };
    }
    if (employeeId) {
      const emp = await User.findOne({ employeeId: employeeId.toUpperCase() });
      if (emp) query.employee = emp._id;
    }

    const records = await Attendance.find(query)
      .populate('employee', 'name employeeId department designation shift')
      .sort({ 'employee.name': 1, date: 1 });

    // Build Excel data
    const excelData = records.map(r => ({
      'Employee ID': r.employeeId,
      'Name': r.employee?.name || 'N/A',
      'Department': r.employee?.department || 'N/A',
      'Designation': r.employee?.designation || 'N/A',
      'Date': r.dateString,
      'Day': new Date(r.date).toLocaleDateString('en', { weekday: 'long' }),
      'Shift Type': r.shift?.type || 'N/A',
      'Shift Start': r.shift?.scheduledStart || 'N/A',
      'Shift End': r.shift?.scheduledEnd || 'N/A',
      'Check In': r.checkIn?.time ? new Date(r.checkIn.time).toLocaleTimeString() : '—',
      'Check Out': r.checkOut?.time ? new Date(r.checkOut.time).toLocaleTimeString() : '—',
      'Status': r.status.toUpperCase(),
      'Working Hours': r.workingHours ? `${Math.floor(r.workingHours / 60)}h ${r.workingHours % 60}m` : '—',
      'Overtime': r.overtime ? `${Math.floor(r.overtime / 60)}h ${r.overtime % 60}m` : '—',
      'Late': r.isLate ? `Yes (${r.lateByMinutes} min)` : 'No',
      'Early Leave': r.earlyLeave ? `Yes (${r.earlyLeaveByMinutes} min)` : 'No',
      'Remarks': r.remarks || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Column widths
    worksheet['!cols'] = [
      { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Summary sheet
    const statusCounts = {};
    records.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });
    const summaryData = [
      { Metric: 'Month/Year', Value: `${targetMonth}/${targetYear}` },
      { Metric: 'Total Records', Value: records.length },
      ...Object.entries(statusCounts).map(([k, v]) => ({ Metric: k.toUpperCase(), Value: v }))
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const monthName = new Date(targetYear, targetMonth - 1).toLocaleString('en', { month: 'long' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Attendance_${monthName}_${targetYear}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
});

export default router;