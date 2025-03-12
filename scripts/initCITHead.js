const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');

// CIT Head credentials
const citHeadData = {
  firstName: 'CIT',
  lastName: 'Head',
  email: 'cithead@admin.com',
  password: 'cithead123',
  role: 'citHead'
};

async function initCITHead() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/Student-Monitoring-Capstone', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Check if CIT Head already exists
    console.log('Checking for existing CIT Head account...');
    const existingCITHead = await User.findOne({ role: 'citHead' });
    if (existingCITHead) {
      console.log('Found existing CIT Head account:', existingCITHead.email);
      console.log('Removing existing account...');
      await User.deleteOne({ role: 'citHead' });
      console.log('Existing account removed');
    }

    // Create CIT Head account
    console.log('Creating new CIT Head account...');
    const citHead = new User(citHeadData);
    await citHead.save();
    console.log('CIT Head account saved to database');

    // Verify the account
    console.log('\nVerifying account...');
    const verifyUser = await User.findOne({ email: citHeadData.email });
    console.log('Retrieved user from database:', verifyUser.email);
    
    // Test password comparison
    const verifyPassword = await verifyUser.comparePassword(citHeadData.password);
    console.log('Stored hashed password:', verifyUser.password);
    console.log('Password comparison result:', verifyPassword);

    console.log('\nAccount Details:');
    console.log('Email:', citHeadData.email);
    console.log('Password:', citHeadData.password);
    console.log('Account verification:', verifyPassword ? 'PASSED' : 'FAILED');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
initCITHead(); 