import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  dateString: {
    type: String, // YYYY-MM-DD format for easy querying
    required: true
  },
  checkIn: {
    time: { type: Date },
    location: { type: String, default: 'Office' },
    note: { type: String }
  },
  checkOut: {
    time: { type: Date },
    location: { type: String, default: 'Office' },
    note: { type: String }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave', 'holiday', 'weekend'],
    default: 'present'
  },
  shift: {
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'flexible'],
      default: 'morning'
    },
    scheduledStart: { type: String },
    scheduledEnd: { type: String }
  },
  workingHours: {
    type: Number,
    default: 0 // in minutes
  },
  overtime: {
    type: Number,
    default: 0 // in minutes
  },
  isLate: {
    type: Boolean,
    default: false
  },
  lateByMinutes: {
    type: Number,
    default: 0
  },
  earlyLeave: {
    type: Boolean,
    default: false
  },
  earlyLeaveByMinutes: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employee: 1, dateString: 1 }, { unique: true });

// Method to calculate working hours and shift compliance
attendanceSchema.methods.calculateMetrics = function(shiftStart, shiftEnd) {
  if (this.checkIn.time && this.checkOut.time) {
    // Working hours in minutes
    const diffMs = new Date(this.checkOut.time) - new Date(this.checkIn.time);
    this.workingHours = Math.round(diffMs / 60000);

    // Check if late
    if (shiftStart) {
      const [sh, sm] = shiftStart.split(':').map(Number);
      const schedStart = new Date(this.date);
      schedStart.setHours(sh, sm, 0, 0);
      
      const checkInTime = new Date(this.checkIn.time);
      if (checkInTime > schedStart) {
        this.isLate = true;
        this.lateByMinutes = Math.round((checkInTime - schedStart) / 60000);
      }
    }

    // Check early leave & overtime
    if (shiftEnd) {
      const [eh, em] = shiftEnd.split(':').map(Number);
      const schedEnd = new Date(this.date);
      schedEnd.setHours(eh, em, 0, 0);
      
      const checkOutTime = new Date(this.checkOut.time);
      if (checkOutTime < schedEnd) {
        this.earlyLeave = true;
        this.earlyLeaveByMinutes = Math.round((schedEnd - checkOutTime) / 60000);
      } else if (checkOutTime > schedEnd) {
        this.overtime = Math.round((checkOutTime - schedEnd) / 60000);
      }
    }

    // Determine status
    if (this.workingHours < 240) { // Less than 4 hours
      this.status = 'half-day';
    } else if (this.isLate) {
      this.status = 'late';
    } else {
      this.status = 'present';
    }
  }
};

export default mongoose.model('Attendance', attendanceSchema);