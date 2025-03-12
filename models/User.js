const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['citHead', 'teacher', 'ssp', 'student'],
    required: true,
  },
  // Student specific fields
  studentId: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: function() {
      return this.role === 'student';
    }
  },
  year: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th'],
    required: function() {
      return this.role === 'student';
    }
  },
  section: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  // Teacher specific fields
  teachingYear: {
    type: String,
    enum: ['1st', '2nd', '3rd', '4th'],
    required: function() {
      return this.role === 'teacher' || this.role === 'ssp';
    }
  },
  subjects: {
    type: [String],
    required: function() {
      return this.role === 'teacher';
    },
    validate: {
      validator: function(subjects) {
        return this.role !== 'teacher' || (subjects && subjects.length > 0);
      },
      message: 'At least one subject is required for teachers'
    }
  },
  sections: [{
    year: String,
    section: String,
    subject: String
  }],
  // User preferences for storing UI state
  preferences: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving only if it's not already hashed
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check if the password is already hashed
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
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcryptjs.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;