import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  designation: {
    type: String,
    trim: true,
    default: 'Staff'
  },
  phone: {
    type: String,
    trim: true
  },
  shift: {
    type: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'flexible'],
      default: 'morning'
    },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '18:00' }
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full shift display
userSchema.virtual('shiftDisplay').get(function() {
  const types = { morning: '🌅 Morning', afternoon: '☀️ Afternoon', night: '🌙 Night', flexible: '🔄 Flexible' };
  return `${types[this.shift.type]} (${this.shift.startTime} - ${this.shift.endTime})`;
});

export default mongoose.model('User', userSchema);