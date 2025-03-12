const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    console.log('Fetching user profile for ID:', req.user._id);
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user:', { id: user._id, role: user.role });
    res.json({
      ...user,
      role: user.role || null,
      teachingYear: user.teachingYear || null,
      subjects: user.subjects || []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, teachingYear, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update basic info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (teachingYear) user.teachingYear = teachingYear;
    
    // Update password if provided
    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }
    
    await user.save();
    
    // Return user without password
    const updatedUser = await User.findById(user.id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user password
router.put('/profile/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.query.userId;
    
    // Verify the user is requesting their own preferences
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to user preferences' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return preferences or empty object if none exist
    res.json({ preferences: user.preferences || {} });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Save user preferences
router.post('/preferences', auth, async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    // Verify the user is updating their own preferences
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to user preferences' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user preferences
    user.preferences = preferences;
    await user.save();
    
    res.json({ message: 'Preferences saved successfully', preferences: user.preferences });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 