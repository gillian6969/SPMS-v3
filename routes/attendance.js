const express = require('express');
const router = express.Router();
const TeacherClassRecord = require('../models/TeacherClassRecord');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const moment = require('moment-timezone');

// Create or update attendance
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, date, subject, status, section, createdAt } = req.body;
    const teacherId = req.user._id;

    if (!studentId || !date || !subject || !status || !section) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Convert date to Philippine timezone start of day
    const phDate = moment(date).tz('Asia/Manila').startOf('day').toDate();

    // Find or create attendance record
    let attendance = await Attendance.findOne({
      studentId,
      date: phDate,
      subject
    });

    if (attendance) {
      // Update existing record
      attendance.status = status;
      
      // Use provided createdAt or current time
      if (createdAt) {
        attendance.lastModified = new Date(createdAt);
      } else {
        attendance.lastModified = moment().tz('Asia/Manila').toDate();
      }
    } else {
      // Create new record
      attendance = new Attendance({
        studentId,
        teacherId,
        date: phDate,
        subject,
        section,
        status,
        lastModified: createdAt ? new Date(createdAt) : moment().tz('Asia/Manila').toDate()
      });
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const { section, subject, teacherId } = req.query;

    console.log('Fetching attendance for date:', date, 'section:', section, 'subject:', subject, 'teacherId:', teacherId);

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Build query
    const query = {};
    
    // Convert date to Philippine timezone start of day
    const phDate = moment(date).tz('Asia/Manila').startOf('day').toDate();
    query.date = phDate;
    
    // Add optional filters
    if (section) query.section = section;
    if (subject) query.subject = subject;
    if (teacherId) query.teacherId = teacherId;

    console.log('Attendance query:', query);

    const attendanceRecords = await Attendance.find(query)
      .populate('studentId', 'firstName lastName studentNumber')
      .sort({ lastModified: -1 }); // Sort by lastModified in descending order

    console.log('Attendance records found:', attendanceRecords.length);

    // Map the records to include createdAt for the frontend
    const mappedRecords = attendanceRecords.map(record => {
      const recordObj = record.toObject();
      return {
        ...recordObj,
        createdAt: record.lastModified || record.createdAt || record.updatedAt
      };
    });

    res.json(mappedRecords);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance history for a student
router.get('/:studentId/history', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subject, startDate, endDate } = req.query;

    const query = { studentId, subject };

    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).tz('Asia/Manila').startOf('day').toDate(),
        $lte: moment(endDate).tz('Asia/Manila').endOf('day').toDate()
      };
    }

    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('studentId', 'firstName lastName studentNumber')
      .lean();

    // Calculate attendance statistics
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;

    res.json({
      records: attendanceRecords,
      statistics: {
        total,
        present,
        absent,
        late,
        presentPercentage: (present / total) * 100 || 0,
        absentPercentage: (absent / total) * 100 || 0,
        latePercentage: (late / total) * 100 || 0
      }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student attendance status for a specific date
router.get('/status', auth, async (req, res) => {
  try {
    const { teacherId, date, section, subject } = req.query;

    if (!teacherId || !date || !section || !subject) {
      return res.status(400).json({ message: 'All parameters are required' });
    }

    const phDate = moment(date).tz('Asia/Manila').startOf('day').toDate();

    const attendanceRecords = await Attendance.find({
      teacherId,
      date: phDate,
      section,
      subject
    }).populate('studentId', 'firstName lastName studentNumber');

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;