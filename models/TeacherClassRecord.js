const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
});

const studentRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentNumber: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  scores: {
    type: Map,
    of: Number,
    default: new Map()
  },
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }],
  attendance: [attendanceSchema]
});

const teacherClassRecordSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  students: [studentRecordSchema],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment'
  }]
}, {
  timestamps: true
});

// Create compound index for unique combination
teacherClassRecordSchema.index(
  { teacherId: 1, year: 1, section: 1, subject: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('TeacherClassRecord', teacherClassRecordSchema);