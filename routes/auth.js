const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const axios = require('axios');

// Middleware to check if user is CITHead
const isCITHead = (req, res, next) => {
  if (req.user && req.user.role === 'citHead') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Only CIT Head can register new users.' });
  }
};

// Verify reCAPTCHA token
const verifyRecaptcha = async (token) => {
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    );
    return response.data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
};

// Register Teacher/SSP (CITHead only)
router.post('/register', auth, isCITHead, async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, teachingYear, role, subjects } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate role (only allow teacher and ssp roles)
    if (!['teacher', 'ssp'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only teacher and SSP roles are allowed.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate subjects for teachers
    if (role === 'teacher' && (!subjects || subjects.length === 0)) {
      return res.status(400).json({ message: 'At least one subject is required for teachers' });
    }

    // Create new user (password will be hashed by the pre-save middleware)
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      teachingYear,
      subjects: role === 'teacher' ? subjects : undefined
    });

    await user.save();

    // Log user registration details
    console.log('Registering user:', { firstName, lastName, email, role, teachingYear, subjects });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teachingYear: user.teachingYear,
        subjects: user.subjects
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login for all users
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginType, recaptchaToken } = req.body;
    console.log('Login attempt details:', { 
      email, 
      loginType,
      timestamp: new Date().toISOString()
    });

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).json({
        message: 'reCAPTCHA verification failed. Please try again.',
        error: 'recaptcha_failed'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', {
        attemptedEmail: email,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'user_not_found'
      });
    }

    console.log('User found during login:', { id: user._id, role: user.role, email: user.email });

    // Validate password
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', {
        email,
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ 
        message: 'Invalid credentials',
        error: 'invalid_password'
      });
    }
    console.log('Password validation successful for:', email);

    // Validate login type
    console.log('Validating login type:', {
      providedType: loginType,
      userRole: user.role,
      timestamp: new Date().toISOString()
    });

    if (loginType === 'citHead' && user.role !== 'citHead') {
      console.log('Access denied: Non-CIT Head trying to use CIT Head login');
      return res.status(403).json({ 
        message: 'Access denied. Please use the Teacher/Student login.',
        error: 'invalid_login_type'
      });
    }

    if (loginType === 'user' && user.role === 'citHead') {
      console.log('Access denied: CIT Head trying to use regular login');
      return res.status(403).json({ 
        message: 'Access denied. Please use the CIT Head login.',
        error: 'invalid_login_type'
      });
    }

    console.log('Login type validation successful');

    // Generate authentication token
    const token = jwt.sign(
      { userId: user._id },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return response with user data
    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teachingYear: user.teachingYear,
        subjects: user.subjects
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login process',
      error: error.message 
    });
  }
});

module.exports = router; 