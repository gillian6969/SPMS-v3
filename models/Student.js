const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  middleName: {
    type: String,
    required: [true, 'Middle name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1st', '2nd', '3rd', '4th']
  },
  section: {
    type: String,
    enum: ['South 1', 'South 2', 'South 3'],
    required: false
  },
  academicYears: {
    startYear: {
      type: Number,
      required: true
    },
    endYear: {
      type: Number,
      required: true
    }
  },
  attendance: [{
    date: Date,
    subject: String,
    status: {
      type: String,
      enum: ['present', 'absent']
    }
  }],
  assessments: [{
    type: {
      type: String,
      enum: ['Quiz', 'Activity', 'Performance Task']
    },
    subject: String,
    number: Number,
    score: Number,
    maxScore: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check if password is already hashed
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next();
    }
    
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
studentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Index for efficient querying
studentSchema.index({ year: 1, section: 1 });
studentSchema.index({ studentId: 1 });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student; 