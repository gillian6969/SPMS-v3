// Get user preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.query.userId;
    
    // Verify the user is requesting their own preferences
    if (req.user.id !== userId) {
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
    res.status(500).json({ message: 'Server error' });
  }
});

// Save user preferences
router.post('/preferences', auth, async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    
    // Verify the user is updating their own preferences
    if (req.user.id !== userId) {
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
    res.status(500).json({ message: 'Server error' });
  }
}); 