const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentNumber: {
    type: String,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'none'],
    default: 'none'
  },
  section: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  year: {
    type: String
  },
  notes: {
    type: String
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index for unique attendance records
attendanceSchema.index(
  { studentId: 1, date: 1, subject: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);