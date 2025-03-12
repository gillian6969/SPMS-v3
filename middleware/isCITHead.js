const User = require('../models/User');

const isCITHead = async (req, res, next) => {
  try {
    // Check if user exists in request
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied. User not authenticated.' });
    }

    // Use the correct user ID from the request
    const userId = req.user._id || req.user.userId;
    
    const user = await User.findById(userId);
    if (!user || user.role !== 'citHead') {
      return res.status(403).json({ message: 'Access denied. Only CIT Head can perform this action.' });
    }
    next();
  } catch (error) {
    console.error('Error checking CIT Head role:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = isCITHead; 