const express = require('express');
const router = express.Router();
const TeacherClassRecord = require('../models/TeacherClassRecord');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const moment = require('moment-timezone');
const User = require('../models/User');
const Student = require('../models/Student');

// Create or update attendance
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, studentNumber, date, subject, status, section, year, createdAt } = req.body;
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
      attendance.studentNumber = studentNumber;
      attendance.section = section;
      attendance.year = year;
      
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
        studentNumber,
        teacherId,
        date: phDate,
        subject,
        section,
        year,
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
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
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

// Export attendance data for date range
router.get('/export', auth, async (req, res) => {
  try {
    const { 
      teacherId, 
      year, 
      section, 
      subject, 
      startDate, 
      endDate, 
      includeTeacherInfo, 
      includeClassInfo 
    } = req.query;

    console.log('Export request received with params:', {
      teacherId, year, section, subject, startDate, endDate
    });

    // Validate required parameters
    if (!teacherId || !year || !section || !subject || !startDate || !endDate) {
      console.error('Missing required parameters:', { teacherId, year, section, subject, startDate, endDate });
      return res.status(400).json({ 
        message: 'Missing required parameters', 
        details: { teacherId: !teacherId, year: !year, section: !section, subject: !subject, startDate: !startDate, endDate: !endDate }
      });
    }

    // Fetch teacher info if requested
    let teacherName = 'Not specified';
    if (includeTeacherInfo === 'true') {
      const teacher = await User.findById(teacherId);
      if (teacher) {
        teacherName = `${teacher.firstName} ${teacher.lastName}`;
      }
    }

    // Get all students in the class
    const students = await Student.find({
      year: year,
      section: section
    }).sort({ lastName: 1, firstName: 1 });

    console.log(`Found ${students?.length || 0} students for year ${year}, section ${section}`);
    
    if (!students || students.length === 0) {
      return res.status(404).json({ 
        message: 'No students found for this class',
        details: { year, section }
      });
    }

    // Generate list of all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    // Ensure dates are in the correct order
    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD format
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch all attendance records for the date range
    const attendanceRecords = await Attendance.find({
      teacherId: teacherId,
      subject: subject,
      section: section,
      year: year, // Added explicit year filter
      date: {
        $gte: start,
        $lte: end
      }
    }).lean();

    console.log(`Found ${attendanceRecords.length} attendance records for export`);
    if (attendanceRecords.length > 0) {
      console.log('Sample record:', attendanceRecords[0]);
    }

    // Group attendance records by student and date
    const attendanceByStudent = {};
    
    attendanceRecords.forEach(record => {
      if (!record.studentId) {
        console.log('Record missing studentId:', record);
        return;
      }
      
      const studentId = record.studentId.toString();
      const date = moment(record.date).format('YYYY-MM-DD');
      
      if (!attendanceByStudent[studentId]) {
        attendanceByStudent[studentId] = {};
      }
      
      // Use the most recent record for each date (based on lastModified)
      if (!attendanceByStudent[studentId][date] || 
          new Date(record.lastModified || record.createdAt) > 
          new Date(attendanceByStudent[studentId][date].lastModified || attendanceByStudent[studentId][date].createdAt)) {
        attendanceByStudent[studentId][date] = record;
      }
    });

    // Prepare student data with attendance
    const studentsWithAttendance = students.map(student => {
      const studentId = student._id.toString();
      const attendance = {};
      
      // Initialize all dates with 'none' status
      dates.forEach(date => {
        attendance[date] = 'none';
      });
      
      // Fill in actual attendance if available
      if (attendanceByStudent[studentId]) {
        Object.keys(attendanceByStudent[studentId]).forEach(date => {
          const record = attendanceByStudent[studentId][date];
          if (record && record.status) {
            attendance[date] = record.status;
            console.log(`Student ${student.studentNumber} on ${date}: ${record.status}`);
          }
        });
      }
      
      return {
        studentId,
        studentNumber: student.studentNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        attendance
      };
    });

    console.log('Sample attendance data:', Object.keys(attendanceByStudent).length ? 
      Object.values(attendanceByStudent)[0] : 'No attendance records found');
    console.log('First student attendance:', studentsWithAttendance.length ? 
      studentsWithAttendance[0].attendance : 'No students with attendance');

    // Return export data
    res.json({
      teacherName,
      year,
      section,
      subject,
      dateRange: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      dates,
      students: studentsWithAttendance
    });
  } catch (error) {
    console.error('Error exporting attendance data:', error);
    res.status(500).json({ message: 'Server error exporting attendance data' });
  }
});

// Get attendance records for a date range
router.get('/date-range', auth, async (req, res) => {
  try {
    const { 
      teacherId, 
      year, 
      section, 
      subject, 
      startDate, 
      endDate 
    } = req.query;
    
    // Validate required parameters
    if (!teacherId || !year || !section || !subject || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Convert dates to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }
    
    // Find all attendance records for this teacher, subject, section, year in the date range
    const attendanceRecords = await Attendance.find({
      teacherId: teacherId,
      subject: subject,
      section: section,
      year: year,
      date: {
        $gte: start,
        $lte: end
      }
    }).lean();
    
    console.log(`Found ${attendanceRecords.length} attendance records for date range: ${startDate} to ${endDate}`);
    
    // Group records by date and studentId to get the latest status for each student on each date
    const recordsByDateAndStudent = {};
    
    attendanceRecords.forEach(record => {
      const dateString = new Date(record.date).toISOString().split('T')[0]; // YYYY-MM-DD
      const studentId = record.studentId.toString();
      
      // Create nested structure if it doesn't exist
      if (!recordsByDateAndStudent[dateString]) {
        recordsByDateAndStudent[dateString] = {};
      }
      
      // Use only the most recent record for each student on each date
      if (!recordsByDateAndStudent[dateString][studentId] || 
          new Date(record.lastModified || record.createdAt) > 
          new Date(recordsByDateAndStudent[dateString][studentId].lastModified || 
                  recordsByDateAndStudent[dateString][studentId].createdAt)) {
        recordsByDateAndStudent[dateString][studentId] = record;
      }
    });
    
    // Convert the grouped records back to a flat array
    const processedRecords = [];
    
    Object.keys(recordsByDateAndStudent).forEach(dateString => {
      Object.keys(recordsByDateAndStudent[dateString]).forEach(studentId => {
        const record = recordsByDateAndStudent[dateString][studentId];
        processedRecords.push({
          studentId: record.studentId,
          studentNumber: record.studentNumber,
          date: record.date,
          status: record.status,
          subject: record.subject,
          section: record.section,
          year: record.year
        });
      });
    });
    
    return res.json(processedRecords);
  } catch (error) {
    console.error('Error fetching attendance records for date range:', error);
    return res.status(500).json({ message: 'Server error fetching attendance records' });
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

    // const attendanceRecords = await Attendance.find(query)
    //   .populate('studentId', 'firstName lastName studentNumber')
    //   .sort({ lastModified: -1 }); // Sort by lastModified in descending order

    const attendanceRecords = await Attendance.aggregate([
      {
        $lookup:
          {
            from: 'students',
            localField: 'studentId',
            foreignField: '_id',
            as: 'students_data',
            pipeline: [
              {
                $project: {
                  status: 0,
                }
              },
            ]
          }
          
     },
     {
      "$match": { "date" : { "$eq" : query.date } }
     }
    ]).sort({ lastModified: -1 }); // Sort by lastModified in descending order

    console.log('Attendance records found:', attendanceRecords.length);

    // Map the records to include createdAt for the frontend
    const mappedRecords = attendanceRecords.map(record => {
      // const recordObj = record.toObject();
      return {
        // ...recordObj,
        ...record,
        createdAt: record.lastModified || record.createdAt || record.updatedAt
      };
    });
    // console.log(mappedRecords)
    res.json(mappedRecords);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance history for a student
router.get('/:studentId/history', auth, async (req, res) => {
  try {
    const allAttendance = req.query?.all || false;
    const { studentId } = req.params;
    const { subject, startDate, endDate } = req.query;

    const query = { studentId, subject };
    let attendanceRecords = [];

    // Add date range filter if provided
    if (startDate && endDate) {
      query.date = {
        $gte: moment(startDate).tz('Asia/Manila').startOf('day').toDate(),
        $lte: moment(endDate).tz('Asia/Manila').endOf('day').toDate()
      };
    }
    attendanceRecords = await Attendance.find(query)
    .sort({ date: -1 })
    .populate('studentId', 'firstName lastName studentNumber')
    .lean();

    if(allAttendance){
      delete query.subject;
      attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('studentId', 'firstName lastName studentNumber')
      .lean();
    }
    

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

// Get attendance statistics for analytics
router.get('/stats', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject, startDate, endDate } = req.query;

    // Validate required parameters
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Build query
    const query = { teacherId };
    
    // Add optional filters
    if (year) query.year = year;
    if (section) query.section = section;
    if (subject) query.subject = subject;
    
    // Add date range if provided
    if (startDate && endDate) {
      const start = moment(startDate).tz('Asia/Manila').startOf('day').toDate();
      const end = moment(endDate).tz('Asia/Manila').endOf('day').toDate();
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }

    console.log('Attendance stats query:', query);

    // Fetch attendance records matching query
    const attendanceRecords = await Attendance.find(query).lean();
    
    console.log(`Found ${attendanceRecords.length} attendance records for stats`);

    // Count different attendance statuses
    const stats = {
      present: 0,
      late: 0,
      absent: 0,
      excused: 0,
      total: attendanceRecords.length
    };
    
    // Group attendance records by studentId and date to get latest status for each student on each day
    const uniqueAttendance = {};
    
    attendanceRecords.forEach(record => {
      const key = `${record.studentId}-${moment(record.date).format('YYYY-MM-DD')}`;
      
      // Keep only the most recent record for a student on a given day
      if (!uniqueAttendance[key] || 
         (record.lastModified && 
          (!uniqueAttendance[key].lastModified || 
           new Date(record.lastModified) > new Date(uniqueAttendance[key].lastModified)))) {
        uniqueAttendance[key] = record;
      }
    });
    
    // Count the statuses from the unique attendance records
    Object.values(uniqueAttendance).forEach(record => {
      if (record.status === 'present') {
        stats.present++;
      } else if (record.status === 'late') {
        stats.late++;
      } else if (record.status === 'absent') {
        stats.absent++;
      } else if (record.status === 'excused') {
        stats.excused++;
      }
    });
    
    stats.total = Object.keys(uniqueAttendance).length;
    
    console.log('Attendance statistics:', stats);
    
    // Add percentage calculations
    if (stats.total > 0) {
      stats.presentPercentage = (stats.present / stats.total * 100).toFixed(1);
      stats.latePercentage = (stats.late / stats.total * 100).toFixed(1);
      stats.absentPercentage = (stats.absent / stats.total * 100).toFixed(1);
      stats.excusedPercentage = (stats.excused / stats.total * 100).toFixed(1);
    } else {
      stats.presentPercentage = 0;
      stats.latePercentage = 0;
      stats.absentPercentage = 0;
      stats.excusedPercentage = 0;
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;