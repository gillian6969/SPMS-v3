const express = require('express');
const router = express.Router();
const TeacherClassRecord = require('../models/TeacherClassRecord');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const moment = require('moment-timezone');

// Create class record
router.post('/create', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject, students } = req.body;

    // Validate required fields
    if (!teacherId || !year || !section || !subject || !students) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing record
    const existingRecord = await TeacherClassRecord.findOne({
      teacherId,
      year,
      section,
      subject
    });

    if (existingRecord) {
      return res.status(400).json({ 
        message: 'A class record already exists for this combination',
        existingRecord
      });
    }

    // Create new class record with initialized empty arrays
    const classRecord = new TeacherClassRecord({
      teacherId,
      year,
      section,
      subject,
      students: students.map(student => ({
        ...student,
        scores: {},
        assessments: [],
        attendance: []
      })),
      assessments: []
    });

    await classRecord.save();
    res.status(201).json(classRecord);
  } catch (error) {
    console.error('Error creating class record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get class records for a teacher
router.get('/', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject } = req.query;
    
    const query = {};
    if (teacherId) query.teacherId = teacherId;
    if (year) query.year = year;
    if (section) query.section = section;
    if (subject) query.subject = subject;

    const records = await TeacherClassRecord.find(query)
      .populate('students.studentId', 'firstName lastName studentNumber')
      .sort({ year: 1, section: 1, subject: 1 });

    res.json(records);
  } catch (error) {
    console.error('Error fetching class records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student information across all teacher class records
router.put('/update-all-records', auth, async (req, res) => {
  try {
    const { oldStudentNumber, newStudentNumber, firstName, lastName, year, section, studentId } = req.body;

    // Find all records containing this student
    const records = await TeacherClassRecord.find({
      'students.studentNumber': oldStudentNumber
    });

    // Update each record
    for (const record of records) {
      const studentIndex = record.students.findIndex(s => s.studentNumber === oldStudentNumber);
      if (studentIndex !== -1) {
        record.students[studentIndex] = {
          ...record.students[studentIndex],
          studentId: record.students[studentIndex].studentId, // Preserve the MongoDB ObjectId reference
          studentNumber: newStudentNumber,
          firstName,
          lastName,
          year,
          section
        };
        await record.save();
      }
    }

    res.json({
      success: true,
      message: 'Student information updated in all class records'
    });
  } catch (error) {
    console.error('Error updating student in class records:', error);
    res.status(500).json({
      message: 'Failed to update student in class records',
      error: error.message
    });
  }
});

// Remove student from all teacher class records
router.delete('/remove-all-records/:studentNumber', auth, async (req, res) => {
  try {
    const studentNumber = req.params.studentNumber;

    // Find all records containing this student
    const records = await TeacherClassRecord.find({
      'students.studentNumber': studentNumber
    });

    // Remove student from each record
    for (const record of records) {
      record.students = record.students.filter(s => s.studentNumber !== studentNumber);
      await record.save();
    }

    res.json({
      success: true,
      message: 'Student removed from all class records'
    });
  } catch (error) {
    console.error('Error removing student from class records:', error);
    res.status(500).json({
      message: 'Failed to remove student from class records',
      error: error.message
    });
  }
});

// Add assessment to class record
router.post('/add-assessment', auth, async (req, res) => {
  try {
    const { teacherId, section, subject, assessment } = req.body;

    // Validate required fields
    if (!teacherId || !section || !subject || !assessment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the class record
    const classRecord = await TeacherClassRecord.findOne({
      teacherId,
      section,
      subject
    });

    if (!classRecord) {
      return res.status(404).json({ message: 'Class record not found' });
    }

    // Add the assessment to the class record
    if (!classRecord.assessments) {
      classRecord.assessments = [];
    }

    // Check if assessment already exists
    const existingAssessment = classRecord.assessments.find(a => 
      a.type === assessment.type && 
      a.number === assessment.number
    );

    if (existingAssessment) {
      return res.status(400).json({ 
        message: 'An assessment with this type and number already exists' 
      });
    }

    classRecord.assessments.push(assessment);

    // Initialize scores for all students
    classRecord.students.forEach(student => {
      if (!student.scores) {
        student.scores = {};
      }
      student.scores[assessment.id] = null;
    });

    await classRecord.save();

    res.json(classRecord);
  } catch (error) {
    console.error('Error adding assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get students for attendance
router.get('/students-for-attendance', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject } = req.query;
    
    if (!teacherId || !year || !section || !subject) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const classRecord = await TeacherClassRecord.findOne({
      teacherId,
      year,
      section,
      subject
    });

    if (!classRecord) {
      return res.status(404).json({ message: 'Class record not found' });
    }

    // Map students to the format expected by the attendance page
    const students = classRecord.students.map(student => ({
      studentId: student.studentId || student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber
    }));

    res.json(students);
  } catch (error) {
    console.error('Error fetching students for attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available sections for a teacher and year
router.get('/available-sections', auth, async (req, res) => {
  try {
    const { teacherId, year } = req.query;
    
    if (!teacherId || !year) {
      return res.status(400).json({ message: 'Teacher ID and year are required' });
    }
    
    // Find all class records for this teacher and year
    const records = await TeacherClassRecord.find({ 
      teacherId, 
      year 
    }).select('section').lean();
    
    // Extract unique sections
    const sections = [...new Set(records.map(record => record.section))];
    
    res.json(sections.map(section => ({ section })));
  } catch (error) {
    console.error('Error fetching available sections:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available subjects for a teacher, year, and section
router.get('/available-subjects', auth, async (req, res) => {
  try {
    const { teacherId, year, section } = req.query;
    
    if (!teacherId || !year || !section) {
      return res.status(400).json({ message: 'Teacher ID, year, and section are required' });
    }
    
    // Find all class records for this teacher, year, and section
    const records = await TeacherClassRecord.find({ 
      teacherId, 
      year,
      section
    }).select('subject').lean();
    
    // Extract unique subjects
    const subjects = [...new Set(records.map(record => record.subject))];
    
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching available subjects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get students for a specific class record
router.get('/students', auth, async (req, res) => {
  try {
    const { teacherId, year, section, subject } = req.query;
    
    if (!teacherId || !year || !section || !subject) {
      return res.status(400).json({ message: 'Teacher ID, year, section, and subject are required' });
    }
    
    // Find the class record
    const record = await TeacherClassRecord.findOne({ 
      teacherId, 
      year,
      section,
      subject
    });
    
    if (!record) {
      return res.json([]);
    }
    
    // Return the students array
    res.json(record.students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teacher's sections and subjects
router.get('/sections-subjects/:teacherId', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { year } = req.query;

    const query = { teacherId };
    if (year) query.year = year;

    const records = await TeacherClassRecord.find(query);

    // Extract unique sections and subjects
    const sections = [...new Set(records.map(record => record.section))];
    const subjects = [...new Set(records.map(record => record.subject))];

    res.json({
      sections,
      subjects
    });
  } catch (error) {
    console.error('Error fetching sections and subjects:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get student performance
router.get('/student/:studentId/performance', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const studentId = req.params.studentId;

    // Create date filter using the date field
    let dateFilter = {};
    if (startDate && endDate) {
      const phStartDate = new Date(startDate);
      const phEndDate = new Date(endDate);
      
      // Adjust for Philippine timezone
      phStartDate.setHours(phStartDate.getHours() + 8);
      phEndDate.setHours(phEndDate.getHours() + 8);
      
      dateFilter.date = {
        $gte: phStartDate,
        $lte: phEndDate
      };
    }

    // Get all assessments for this student within the date range
    const assessments = await Assessment.find({
      ...dateFilter,
      'scores.studentId': studentId
    }).sort({ date: -1 }); // Sort by date field

    const response = {
      assessments: assessments.map(assessment => ({
        id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        maxScore: assessment.maxScore,
        date: assessment.date,
        subject: assessment.subject,
        score: assessment.scores.find(s => s.studentId.toString() === studentId)?.score || 0
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching student performance:', error);
    res.status(500).json({ message: 'Failed to fetch student performance' });
  }
});

// Update student attendance
router.put('/:recordId/attendance', auth, async (req, res) => {
  try {
    const { recordId } = req.params;
    const { studentId, date, status } = req.body;

    // Convert date to Philippine timezone
    const phDate = moment(date).tz('Asia/Manila').format('YYYY-MM-DD');

    const record = await TeacherClassRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Class record not found' });
    }

    const student = record.students.find(s => s.studentId.toString() === studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found in class record' });
    }

    // Initialize attendance array if it doesn't exist
    if (!student.attendance) {
      student.attendance = [];
    }

    // Check if attendance for this date already exists
    const existingAttendanceIndex = student.attendance.findIndex(
      a => moment(a.date).tz('Asia/Manila').format('YYYY-MM-DD') === phDate
    );

    if (existingAttendanceIndex !== -1) {
      // Update existing attendance
      student.attendance[existingAttendanceIndex].status = status;
    } else {
      // Add new attendance record
      student.attendance.push({
        date: phDate,
        status,
        lastModified: new Date()
      });
    }

    await record.save();
    res.json({ message: 'Attendance updated successfully', student });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sync student records
router.post('/sync-records', auth, async (req, res) => {
  try {
    const { year, section } = req.body;
    const teacherId = req.user._id;

    if (!year || !section) {
      return res.status(400).json({ message: 'Year and section are required' });
    }

    // Get all class records for this teacher and section
    const classRecords = await TeacherClassRecord.find({
      teacherId,
      year,
      section
    });

    // Get current students in this section
    const currentStudents = await User.find({
      role: 'student',
      year,
      section
    }).select('_id studentId firstName lastName year section');

    // Update each class record
    const updatePromises = classRecords.map(async (record) => {
      // Remove students who are no longer in the section
      record.students = record.students.filter(student => 
        currentStudents.some(cs => cs._id.toString() === student.studentId.toString())
      );

      // Add new students who aren't in the record
      const newStudents = currentStudents.filter(cs => 
        !record.students.some(s => s.studentId.toString() === cs._id.toString())
      );

      record.students.push(...newStudents.map(student => ({
        studentId: student._id,
        studentNumber: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        scores: {},
        assessments: [],
        attendance: []
      })));

      return record.save();
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Student records synchronized successfully',
      recordsUpdated: classRecords.length
    });
  } catch (error) {
    console.error('Error syncing student records:', error);
    res.status(500).json({
      message: 'Failed to sync student records',
      error: error.message
    });
  }
});

// Get available years and sections for a specific teacher
router.get('/available-years-sections', auth, async (req, res) => {
  try {
    const { teacherId } = req.query;
    
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }

    // Find all class records for this teacher
    const records = await TeacherClassRecord.find({ teacherId });
    
    console.log(`Found ${records.length} class records for teacher ${teacherId}`);

    // Extract unique years and sections
    let years = [...new Set(records.map(record => record.year))].filter(Boolean).sort();
    let sections = [...new Set(records.map(record => record.section))].filter(Boolean).sort();
    let subjects = [...new Set(records.map(record => record.subject))].filter(Boolean).sort();

    // Group sections by year
    let sectionsByYear = records.reduce((acc, record) => {
      if (record.year && record.section) {
        if (!acc[record.year]) {
          acc[record.year] = new Set();
        }
        acc[record.year].add(record.section);
      }
      return acc;
    }, {});

    // Convert Sets to sorted arrays
    Object.keys(sectionsByYear).forEach(year => {
      sectionsByYear[year] = [...sectionsByYear[year]].sort();
    });

    // Group subjects by section
    let subjectsBySection = records.reduce((acc, record) => {
      if (record.section && record.subject) {
        if (!acc[record.section]) {
          acc[record.section] = new Set();
        }
        acc[record.section].add(record.subject);
      }
      return acc;
    }, {});

    // Convert Sets to sorted arrays
    Object.keys(subjectsBySection).forEach(section => {
      subjectsBySection[section] = [...subjectsBySection[section]].sort();
    });

    res.json({ 
      years, 
      sections, 
      subjects,
      sectionsByYear,
      subjectsBySection
    });
  } catch (error) {
    console.error('Error fetching available years and sections for teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;