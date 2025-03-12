const mongoose = require('mongoose');
const moment = require('moment-timezone');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    set: function(val) {
      // Ensure date is stored as start of day in Philippine timezone
      return moment(val).tz('Asia/Manila').startOf('day').toDate();
    }
  },
  subject: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  lastModified: {
    type: Date,
    default: () => moment().tz('Asia/Manila').toDate()
  }
}, {
  timestamps: true
});

// Create compound index for unique attendance records per student per day per subject
attendanceSchema.index(
  { studentId: 1, date: 1, subject: 1 }, 
  { unique: true }
);

// Pre-save middleware to ensure proper date formatting
attendanceSchema.pre('save', function(next) {
  if (this.isModified('date')) {
    this.date = moment(this.date).tz('Asia/Manila').startOf('day').toDate();
  }
  if (this.isModified('lastModified')) {
    this.lastModified = moment(this.lastModified).tz('Asia/Manila').toDate();
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;