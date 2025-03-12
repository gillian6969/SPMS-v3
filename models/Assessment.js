const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Quiz', 'Activity', 'Performance Task']
  },
  number: {
    type: Number,
    required: true
  },
  maxScore: {
    type: Number,
    required: true,
    min: 0
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  date: {
    type: Date,
    default: Date.now
  },
  scores: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Create a compound index for unique assessments per teacher, section, subject, type, and number
assessmentSchema.index(
  { teacherId: 1, section: 1, subject: 1, type: 1, number: 1 },
  { unique: true }
);

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment; 