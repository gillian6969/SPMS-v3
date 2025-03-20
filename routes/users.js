const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { send } = require('../scripts/mailer');

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
    const { firstName, lastName, email, teachingYear } = req.body;
    
    // Use req.user._id from auth middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update basic info
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (teachingYear) user.teachingYear = teachingYear;
    
    await user.save();
    
    // Return user without password
    const updatedUser = await User.findById(user._id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Use req.user._id from auth middleware
    const user = await User.findById(req.user._id);
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
    console.error('Error updating password:', error);
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

// Update user password to default
router.put('/profile/password/reset', async (req, res) => {
  try {
    const newPassword = req.body.password;

    const user = await User.find({ _id : req.body._id });
    if (!user.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user[0].password = await bcrypt.hash(newPassword, salt);
    // await user.save();
    await User.updateOne({ _id : user[0]._id }, { password : user[0].password })
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/profile/password/send', async (req, res) => {
  try {
    
    const user = await User.find({ email : req.body.email });
    if (!user.length  ) {
      return res.status(404).json({ message: 'User not found' });
    }

    send(
      req.body.email, 
      `<span><a href="${process.env.resetLink}?student=${user[0]?._id}">Click here to reset your password</a></span>`,
      'Password Reset'
    )
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
})

// Request verification code for password reset
router.post('/profile/password/request-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (15 minutes from now)
    const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    
    // Save code to user document
    user.resetPasswordCode = verificationCode;
    user.resetPasswordExpires = codeExpiry;
    await user.save();
    
    // Send email with verification code
    send(
      email,
      `<div>
        <h2>Password Reset Verification</h2>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 15 minutes.</p>
      </div>`,
      'Password Reset Verification Code'
    );
    
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify code without changing password yet
router.post('/profile/password/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if code exists and is valid
    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Check if code is expired
    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }
    
    res.json({ success: true, message: 'Code verified successfully' });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset password with verification code
router.post('/profile/password/reset-with-code', async (req, res) => {
  try {
    const { email, code, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if code exists and is valid
    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Check if code is expired
    if (user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired' });
    }
    
    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Clear reset code fields
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export class records with date range
router.get('/export/class-records', async (req, res) => {
  try {
    const { teacherId, year, section, subject, startDate, endDate } = req.query;
    
    if (!teacherId || !year || !section || !subject) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find the class record
    const classRecord = await require('mongoose').model('TeacherClassRecord').findOne({
      teacherId,
      year,
      section,
      subject
    }).populate('students.studentId', 'firstName lastName').populate('assessments');
    
    if (!classRecord) {
      return res.status(404).json({ message: 'Class record not found' });
    }
    
    // Find assessments for the class with optional date filter
    const assessmentQuery = {
      teacherId,
      section,
      subject
    };
    
    if (startDate && endDate) {
      assessmentQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const assessments = await require('mongoose').model('Assessment').find(assessmentQuery).sort('date');
    
    // Prepare export data
    const exportData = {
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      year,
      section,
      subject,
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All dates',
      assessments,
      students: classRecord.students.map(student => ({
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        scores: assessments.map(assessment => {
          let score = null;
          
          // Handle different types of score storage
          if (assessment.scores) {
            if (assessment.scores instanceof Map) {
              score = assessment.scores.get(student.studentNumber);
            } else if (typeof assessment.scores === 'object') {
              score = assessment.scores[student.studentNumber];
            }
          }
          
          // Convert score to number if it exists, otherwise keep null
          if (score !== undefined && score !== null) {
            score = Number(score);
            if (isNaN(score)) score = null;
          }
          
          return {
            assessmentId: assessment._id,
            score
          };
        })
      }))
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting class records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export attendance records with date range
router.get('/export/attendance', async (req, res) => {
  try {
    const { teacherId, year, section, subject, startDate, endDate } = req.query;
    
    if (!teacherId || !year || !section || !subject) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find attendance records with date filter
    const attendanceQuery = {
      teacherId,
      section,
      subject
    };
    
    if (startDate && endDate) {
      attendanceQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Find the class record to get student information
    const classRecord = await require('mongoose').model('TeacherClassRecord').findOne({
      teacherId,
      year,
      section,
      subject
    }).populate('students.studentId', 'firstName lastName');
    
    if (!classRecord) {
      return res.status(404).json({ message: 'Class record not found' });
    }
    
    // Find attendance records
    const Attendance = require('mongoose').model('Attendance');
    const attendanceRecords = await Attendance.find(attendanceQuery).sort('date');
    
    // Group attendance by date
    const attendanceByDate = attendanceRecords.reduce((acc, record) => {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(record);
      return acc;
    }, {});
    
    // Prepare export data
    const exportData = {
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      year,
      section,
      subject,
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All dates',
      dates: Object.keys(attendanceByDate).sort(),
      students: classRecord.students.map(student => {
        const studentRecord = {
          studentNumber: student.studentNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          attendance: {}
        };
        
        // Add attendance status for each date
        Object.keys(attendanceByDate).sort().forEach(date => {
          const studentAttendance = attendanceByDate[date].find(
            record => String(record.studentId) === String(student.studentId)
          );
          
          studentRecord.attendance[date] = studentAttendance ? studentAttendance.status : 'none';
        });
        
        return studentRecord;
      })
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting attendance records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student routes

// Get student profile
router.get('/student/profile', auth, async (req, res) => {
  try {
    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const student = await User.findById(req.user._id)
      .select('-password')
      .lean();
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student assessments
router.get('/student/assessments', auth, async (req, res) => {
  try {
    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const studentId = req.user._id;
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find class records that include this student
    const mongoose = require('mongoose');
    const ClassRecord = mongoose.model('TeacherClassRecord');
    const Assessment = mongoose.model('Assessment');
    
    const classRecords = await ClassRecord.find({
      'students.studentId': studentId
    }).populate('teacherId', 'firstName lastName');
    
    const result = [];
    
    // For each class, find related assessments
    for (const classRecord of classRecords) {
      const assessments = await Assessment.find({
        teacherId: classRecord.teacherId._id,
        section: classRecord.section,
        subject: classRecord.subject
      }).sort({ date: -1 });
      
      // Filter assessments to only include ones with scores for this student
      const studentAssessments = assessments.map(assessment => {
        const studentNumber = classRecord.students.find(
          s => s.studentId.toString() === studentId.toString()
        )?.studentNumber;
        
        let score = null;
        if (assessment.scores && studentNumber) {
          if (assessment.scores instanceof Map) {
            score = assessment.scores.get(studentNumber);
          } else if (typeof assessment.scores === 'object') {
            score = assessment.scores[studentNumber];
          }
        }
        
        return {
          _id: assessment._id,
          title: assessment.title,
          type: assessment.type,
          maxScore: assessment.maxScore,
          score: score,
          date: assessment.date,
          subject: assessment.subject,
          section: assessment.section,
          teacherName: `${classRecord.teacherId.firstName} ${classRecord.teacherId.lastName}`
        };
      }).filter(a => a.score !== null && a.score !== undefined);
      
      result.push({
        subject: classRecord.subject,
        section: classRecord.section,
        teacher: `${classRecord.teacherId.firstName} ${classRecord.teacherId.lastName}`,
        assessments: studentAssessments
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student attendance
router.get('/student/attendance', auth, async (req, res) => {
  try {
    // Verify user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const studentId = req.user._id;
    const student = await User.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find class records that include this student
    const mongoose = require('mongoose');
    const ClassRecord = mongoose.model('TeacherClassRecord');
    const Attendance = mongoose.model('Attendance');
    
    const classRecords = await ClassRecord.find({
      'students.studentId': studentId
    }).populate('teacherId', 'firstName lastName');
    
    const result = [];
    
    // For each class, find related attendance records
    for (const classRecord of classRecords) {
      const attendanceRecords = await Attendance.find({
        teacherId: classRecord.teacherId._id,
        section: classRecord.section,
        subject: classRecord.subject,
        studentId: studentId
      }).sort({ date: -1 });
      
      if (attendanceRecords.length > 0) {
        result.push({
          subject: classRecord.subject,
          section: classRecord.section,
          teacher: `${classRecord.teacherId.firstName} ${classRecord.teacherId.lastName}`,
          records: attendanceRecords.map(record => ({
            _id: record._id,
            date: record.date,
            status: record.status,
            remarks: record.remarks
          }))
        });
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 