import express from 'express';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper: get date string YYYY-MM-DD
const getDateString = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// @POST /api/attendance/checkin - Employee Check In
router.post('/checkin', protect, async (req, res) => {
  try {
    const today = new Date();
    const dateString = getDateString(today);
    const user = await User.findById(req.user._id);

    // Check if already checked in today
    let record = await Attendance.findOne({
      employee: req.user._id,
      dateString
    });

    if (record) {
      if (record.checkIn.time) {
        return res.status(400).json({
          success: false,
          message: `Already checked in at ${new Date(record.checkIn.time).toLocaleTimeString()}`
        });
      }
    }

    const checkInData = {
      employee: req.user._id,
      employeeId: user.employeeId,
      date: today,
      dateString,
      checkIn: {
        time: today,
        location: req.body.location || 'Office',
        note: req.body.note || ''
      },
      shift: {
        type: user.shift.type,
        scheduledStart: user.shift.startTime,
        scheduledEnd: user.shift.endTime
      },
      status: 'present'
    };

    // Check if late
    const [sh, sm] = user.shift.startTime.split(':').map(Number);
    const scheduledStart = new Date(today);
    scheduledStart.setHours(sh, sm, 0, 0);

    if (today > scheduledStart) {
      checkInData.isLate = true;
      checkInData.lateByMinutes = Math.round((today - scheduledStart) / 60000);
      checkInData.status = 'late';
    }

    if (record) {
      record.set(checkInData);
      await record.save();
    } else {
      record = await Attendance.create(checkInData);
    }

    res.status(201).json({
      success: true,
      message: `✅ Checked In at ${today.toLocaleTimeString()}${checkInData.isLate ? ` (${checkInData.lateByMinutes} min late)` : ''}`,
      data: record
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ success: false, message: 'Server error during check-in' });
  }
});

// @POST /api/attendance/checkout - Employee Check Out
router.post('/checkout', protect, async (req, res) => {
  try {
    const today = new Date();
    const dateString = getDateString(today);
    const user = await User.findById(req.user._id);

    const record = await Attendance.findOne({ employee: req.user._id, dateString });

    if (!record || !record.checkIn.time) {
      return res.status(400).json({ success: false, message: 'Please check in first before checking out' });
    }

    if (record.checkOut.time) {
      return res.status(400).json({
        success: false,
        message: `Already checked out at ${new Date(record.checkOut.time).toLocaleTimeString()}`
      });
    }

    record.checkOut = {
      time: today,
      location: req.body.location || 'Office',
      note: req.body.note || ''
    };

    // Calculate metrics
    record.calculateMetrics(user.shift.startTime, user.shift.endTime);
    record.remarks = req.body.remarks || '';

    await record.save();

    const hours = Math.floor(record.workingHours / 60);
    const mins = record.workingHours % 60;

    res.json({
      success: true,
      message: `✅ Checked Out at ${today.toLocaleTimeString()} | Working: ${hours}h ${mins}m${record.overtime > 0 ? ` | OT: ${Math.floor(record.overtime / 60)}h ${record.overtime % 60}m` : ''}`,
      data: record
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ success: false, message: 'Server error during check-out' });
  }
});

// @GET /api/attendance/today - Today's attendance status
router.get('/today', protect, async (req, res) => {
  try {
    const dateString = getDateString();
    const record = await Attendance.findOne({ employee: req.user._id, dateString });
    res.json({ success: true, data: record || null });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/attendance/monthly?year=2024&month=1 - Monthly attendance
router.get('/monthly', protect, async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const records = await Attendance.find({
      employee: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate summary
    const summary = {
      totalDays: endDate.getDate(),
      present: 0, absent: 0, late: 0, halfDay: 0,
      onLeave: 0, totalWorkingHours: 0, totalOvertime: 0
    };

    records.forEach(r => {
      if (r.status === 'present') summary.present++;
      else if (r.status === 'absent') summary.absent++;
      else if (r.status === 'late') { summary.late++; summary.present++; }
      else if (r.status === 'half-day') summary.halfDay++;
      else if (r.status === 'on-leave') summary.onLeave++;
      summary.totalWorkingHours += r.workingHours || 0;
      summary.totalOvertime += r.overtime || 0;
    });

    res.json({
      success: true,
      data: records,
      summary,
      month: targetMonth,
      year: targetYear
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @GET /api/attendance/history - Recent attendance history
router.get('/history', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const records = await Attendance.find({ employee: req.user._id })
      .sort({ date: -1 })
      .limit(limit);
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;