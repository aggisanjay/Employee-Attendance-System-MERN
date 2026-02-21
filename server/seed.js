import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Attendance from './models/Attendance.js';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Attendance.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin
    const admin = await User.create({
      employeeId: 'ADMIN001',
      name: 'System Administrator',
      email: 'admin@company.com',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
      designation: 'System Admin',
      shift: { type: 'morning', startTime: '09:00', endTime: '18:00' }
    });

    // Create sample employees
    const employees = await User.create([
      {
        employeeId: 'EMP001',
        name: 'Rajesh Kumar',
        email: 'rajesh@company.com',
        password: 'emp123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Senior Developer',
        phone: '9876543210',
        shift: { type: 'morning', startTime: '09:00', endTime: '18:00' }
      },
      {
        employeeId: 'EMP002',
        name: 'Priya Sharma',
        email: 'priya@company.com',
        password: 'emp123',
        role: 'employee',
        department: 'Design',
        designation: 'UI/UX Designer',
        phone: '9876543211',
        shift: { type: 'morning', startTime: '10:00', endTime: '19:00' }
      },
      {
        employeeId: 'EMP003',
        name: 'Mohammed Ali',
        email: 'mohammed@company.com',
        password: 'emp123',
        role: 'employee',
        department: 'Engineering',
        designation: 'Junior Developer',
        phone: '9876543212',
        shift: { type: 'afternoon', startTime: '13:00', endTime: '22:00' }
      },
      {
        employeeId: 'EMP004',
        name: 'Ananya Patel',
        email: 'ananya@company.com',
        password: 'emp123',
        role: 'employee',
        department: 'HR',
        designation: 'HR Manager',
        phone: '9876543213',
        shift: { type: 'morning', startTime: '09:00', endTime: '17:00' }
      },
      {
        employeeId: 'EMP005',
        name: 'Vikram Singh',
        email: 'vikram@company.com',
        password: 'emp123',
        role: 'employee',
        department: 'Sales',
        designation: 'Sales Executive',
        phone: '9876543214',
        shift: { type: 'flexible', startTime: '08:00', endTime: '17:00' }
      }
    ]);

    // Seed attendance for current month
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    for (const emp of employees) {
      for (let day = 1; day <= today.getDate() - 1; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

        const isAbsent = Math.random() < 0.1; // 10% absence
        if (isAbsent) continue;

        const [sh, sm] = emp.shift.startTime.split(':').map(Number);
        const lateMinutes = Math.random() < 0.2 ? Math.floor(Math.random() * 30) : 0; // 20% late
        
        const checkIn = new Date(year, month, day, sh, sm + lateMinutes);
        const workMinutes = 480 + Math.floor(Math.random() * 60); // 8-9 hours
        const checkOut = new Date(checkIn.getTime() + workMinutes * 60000);

        await Attendance.create({
          employee: emp._id,
          employeeId: emp.employeeId,
          date,
          dateString: date.toISOString().split('T')[0],
          checkIn: { time: checkIn, location: 'Office' },
          checkOut: { time: checkOut, location: 'Office' },
          shift: { type: emp.shift.type, scheduledStart: emp.shift.startTime, scheduledEnd: emp.shift.endTime },
          status: lateMinutes > 0 ? 'late' : 'present',
          workingHours: workMinutes,
          isLate: lateMinutes > 0,
          lateByMinutes: lateMinutes,
          overtime: Math.max(0, workMinutes - 480)
        });
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 ADMIN LOGIN:');
    console.log('   Email:    admin@company.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👥 EMPLOYEE LOGIN (any of these):');
    console.log('   Email:    rajesh@company.com  | Password: emp123');
    console.log('   Email:    priya@company.com   | Password: emp123');
    console.log('   Email:    mohammed@company.com | Password: emp123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();