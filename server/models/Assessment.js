const mongoose = require('mongoose');

// Define a schema for individual scores
const ScoreSchema = new mongoose.Schema({
  studentNumber: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main Assessment Schema
const AssessmentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Quiz', 'Activity', 'Performance Task']
  },
  number: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: function() {
      return `${this.type} ${this.number}`;
    }
  },
  maxScore: {
    type: Number,
    required: true
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
  // Store scores as an object where keys are student numbers and values are scores
  scores: {
    type: Object,
    default: {}
  },
  // Also keep the array-based storage for backward compatibility
  studentScores: [ScoreSchema]
}, { 
  timestamps: true 
});

// Add a method to get a student's score
AssessmentSchema.methods.getStudentScore = function(studentNumber) {
  // First check if the score exists in the scores object
  if (this.scores && this.scores[studentNumber] !== undefined) {
    return this.scores[studentNumber];
  }
  
  // Fall back to the studentScores array if needed
  if (!this.studentScores || !this.studentScores.length) return null;
  
  // Find the most recent score for this student
  const studentScores = this.studentScores
    .filter(score => score.studentNumber === studentNumber)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return studentScores.length > 0 ? studentScores[0].score : null;
};

// Add a method to set a student's score
AssessmentSchema.methods.setStudentScore = function(studentNumber, score) {
  // Initialize scores object if it doesn't exist
  if (!this.scores) {
    this.scores = {};
  }
  
  // Set the score in the scores object
  this.scores[studentNumber] = score;
  
  // Mark the scores field as modified
  this.markModified('scores');
  
  // Also update the studentScores array for backward compatibility
  if (!this.studentScores) {
    this.studentScores = [];
  }
  
  // Add the new score to the array
  this.studentScores.push({
    studentNumber,
    score,
    createdAt: new Date()
  });
  
  return this;
};

// Add a method to remove a student's score
AssessmentSchema.methods.removeStudentScore = function(studentNumber) {
  // Initialize scores object if it doesn't exist
  if (!this.scores) {
    this.scores = {};
  }
  
  // Remove the score from the scores object
  delete this.scores[studentNumber];
  
  // Mark the scores field as modified
  this.markModified('scores');
  
  // Also update the studentScores array for backward compatibility
  if (!this.studentScores || !this.studentScores.length) return this;
  
  // Add a "removal" entry with null score
  this.studentScores.push({
    studentNumber,
    score: null,
    createdAt: new Date()
  });
  
  return this;
};

// Add a method to get all current scores
AssessmentSchema.methods.getAllScores = function() {
  // If we have scores in the scores object, return that
  if (this.scores && Object.keys(this.scores).length > 0) {
    return this.scores;
  }
  
  // Fall back to the studentScores array if needed
  if (!this.studentScores || !this.studentScores.length) return {};
  
  const scoreMap = {};
  
  // Group scores by student number
  const scoresByStudent = {};
  this.studentScores.forEach(score => {
    if (!scoresByStudent[score.studentNumber]) {
      scoresByStudent[score.studentNumber] = [];
    }
    scoresByStudent[score.studentNumber].push(score);
  });
  
  // For each student, get the most recent score
  Object.keys(scoresByStudent).forEach(studentNumber => {
    const studentScores = scoresByStudent[studentNumber]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Only include the score if it's not null (null means removed)
    if (studentScores[0].score !== null) {
      scoreMap[studentNumber] = studentScores[0].score;
    }
  });
  
  return scoreMap;
};

module.exports = mongoose.model('Assessment', AssessmentSchema); 