const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const User = require('../models/User');
const TeacherClassRecord = require('../models/TeacherClassRecord');
const moment = require('moment');
const Assessment = require('../models/Assessment');

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};
    
    // Filter by year if provided
    if (year) {
      query.year = year;
    }

    // Get total students
    const totalStudents = await Student.countDocuments(query);

    // Get total teachers and advisers
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdvisers = await User.countDocuments({ role: 'adviser' });

    // Get active sections with year information
    const sections = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            section: '$section',
            year: '$year'
          },
          studentCount: { $sum: 1 },
          performance: { $avg: '$averageScore' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id.section',
          year: '$_id.year',
          studentCount: 1,
          performance: { $round: ['$performance', 1] }
        }
      },
      { $sort: { year: 1, name: 1 } }
    ]);

    // Get assessments for performance calculations
    const assessments = await Assessment.find(query).sort({ date: 1 });
    
    // Initialize statistics
    let totalScore = 0;
    let scoreCount = 0;
    let assessmentTypes = {
      Quiz: { count: 0, completed: 0, totalScore: 0, scoreCount: 0 },
      Activity: { count: 0, completed: 0, totalScore: 0, scoreCount: 0 },
      'Performance Task': { count: 0, completed: 0, totalScore: 0, scoreCount: 0 }
    };

    // Process assessments
    const studentScores = new Map(); // Track individual student scores
    
    assessments.forEach(assessment => {
      if (!assessment.scores || !(assessment.scores instanceof Map)) {
        console.warn('Invalid scores for assessment:', assessment._id);
        return;
      }

      const type = assessment.type;
      if (assessmentTypes[type]) {
        assessmentTypes[type].count++;

        // Convert scores Map to array of entries
        Array.from(assessment.scores.entries()).forEach(([studentId, score]) => {
          if (score !== undefined && score !== null) {
            assessmentTypes[type].completed++;
            const scorePercentage = (score / assessment.maxScore) * 100;
            
            // Track individual student scores
            if (!studentScores.has(studentId.toString())) {
              studentScores.set(studentId.toString(), []);
            }
            studentScores.get(studentId.toString()).push({
              score: scorePercentage,
              date: assessment.date,
              type: assessment.type,
              name: assessment.name || type
            });
            
            // Update type statistics
            assessmentTypes[type].totalScore += scorePercentage;
            assessmentTypes[type].scoreCount++;
            
            // Update overall statistics
            totalScore += scorePercentage;
            scoreCount++;
          }
        });
      }
    });

    // Calculate grade distribution
    const gradeDistribution = [0, 0, 0, 0, 0]; // [90-100, 80-89, 70-79, 60-69, <60]
    studentScores.forEach(scores => {
      if (scores.length > 0) {
        const average = scores.reduce((a, b) => a + b.score, 0) / scores.length;
        if (average >= 90) gradeDistribution[0]++;
        else if (average >= 80) gradeDistribution[1]++;
        else if (average >= 70) gradeDistribution[2]++;
        else if (average >= 60) gradeDistribution[3]++;
        else gradeDistribution[4]++;
      }
    });

    // Calculate assessment type distribution with time-based data
    const assessmentTypeData = {};
    assessments.forEach(assessment => {
      const date = new Date(assessment.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!assessmentTypeData[monthYear]) {
        assessmentTypeData[monthYear] = {
          Quiz: 0,
          Activity: 0,
          'Performance Task': 0
        };
      }
      
      if (assessment.type in assessmentTypeData[monthYear]) {
        assessmentTypeData[monthYear][assessment.type]++;
      }
    });

    // Convert to array format for frontend
    const assessmentTypeDistribution = {
      labels: Object.keys(assessmentTypeData).sort((a, b) => new Date(a) - new Date(b)),
      datasets: Object.keys(assessmentTypes).map(type => ({
        type,
        data: Object.keys(assessmentTypeData).sort((a, b) => new Date(a) - new Date(b))
          .map(date => assessmentTypeData[date][type])
      }))
    };

    // Calculate completion rates
    const completionRates = {};
    Object.entries(assessmentTypes).forEach(([type, data]) => {
      const possibleSubmissions = data.count * totalStudents;
      completionRates[type.toLowerCase().replace(' ', '')] = 
        possibleSubmissions > 0 ? (data.completed / possibleSubmissions) * 100 : 0;
    });

    // Calculate performance trends
    const performanceTrends = assessments.map(assessment => {
      if (!assessment.scores || !(assessment.scores instanceof Map)) {
        return {
          date: assessment.date,
          score: 0,
          type: assessment.type,
          name: assessment.name || assessment.type
        };
      }

      const scores = Array.from(assessment.scores.values());
      const validScores = scores.filter(score => 
        score !== undefined && score !== null
      );

      const averageScore = validScores.length > 0
        ? validScores.reduce((sum, score) => sum + ((score / assessment.maxScore) * 100), 0) / validScores.length
        : 0;

      return {
        date: assessment.date,
        score: averageScore,
        type: assessment.type,
        name: assessment.name || assessment.type
      };
    });

    // Sort performance trends by date
    performanceTrends.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      totalStudents,
      totalTeachers,
      totalAdvisers,
      activeSections: sections.length,
      averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      assessmentCompletion: {
        overall: assessments.length > 0 ? 
          (Object.values(assessmentTypes).reduce((sum, type) => sum + type.completed, 0) / 
          (assessments.length * totalStudents)) * 100 : 0,
        byType: completionRates
      },
      performanceDistribution: gradeDistribution,
      assessmentTypeDistribution,
      performanceTrends,
      sections
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics', error: error.message });
  }
});

// Get active sections
router.get('/sections', auth, async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};
    
    if (year) {
      query.year = year;
    }

    // Get unique sections
    const sections = await Student.distinct('section', query);

    // Get performance data for each section
    const sectionsData = await Promise.all(
      sections.map(async (section) => {
        const students = await Student.find({ section, ...query });
        return {
          name: section,
          studentCount: students.length,
          performance: 0 // This will be implemented when Assessment model is ready
        };
      })
    );

    res.json(sectionsData);

  } catch (error) {
    console.error('Sections fetch error:', error);
    res.status(500).json({ message: 'Error fetching sections data', error: error.message });
  }
});

// Get teacher dashboard statistics
router.get('/teacher/:teacherId/stats', auth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { year, section, subject, startDate, endDate } = req.query;

    // Build query based on filters
    let query = { teacherId };
    if (year) query.year = year;
    if (section) query.section = section;
    if (subject) query.subject = subject;

    // Date filter for assessments
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {
        date: {}
      };
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.date.$lte = end;
      }
    }

    console.log('Date filter:', dateFilter);

    // Get class records for the teacher
    const classRecords = await TeacherClassRecord.find(query);
    
    // Get unique students, sections, and subjects
    const uniqueStudents = new Set();
    const uniqueSections = new Set();
    const uniqueSubjects = new Set();
    
    classRecords.forEach(record => {
      record.students.forEach(student => uniqueStudents.add(student.studentId));
      uniqueSections.add(record.section);
      uniqueSubjects.add(record.subject);
    });

    // Get assessments with date filter
    const assessments = await Assessment.find({
      teacherId,
      ...(subject ? { subject } : {}),
      ...dateFilter
    }).sort({ date: 1 });

    console.log('Found assessments:', assessments.length);

    // Initialize statistics
    let totalScore = 0;
    let scoreCount = 0;
    let assessmentTypes = {
      Quiz: { count: 0, completed: 0, totalScore: 0, scoreCount: 0 },
      Activity: { count: 0, completed: 0, totalScore: 0, scoreCount: 0 },
      'Performance Task': { count: 0, completed: 0, totalScore: 0, scoreCount: 0 }
    };

    // Process assessments
    const studentScores = new Map(); // Track individual student scores
    
    assessments.forEach(assessment => {
      if (!assessment.scores || !(assessment.scores instanceof Map)) {
        console.warn('Invalid scores for assessment:', assessment._id);
        return;
      }

      const type = assessment.type;
      if (assessmentTypes[type]) {
        assessmentTypes[type].count++;

        // Convert scores Map to array of entries
        Array.from(assessment.scores.entries()).forEach(([studentId, score]) => {
          if (score !== undefined && score !== null && uniqueStudents.has(studentId.toString())) {
            assessmentTypes[type].completed++;
            const scorePercentage = (score / assessment.maxScore) * 100;
            
            // Track individual student scores
            if (!studentScores.has(studentId.toString())) {
              studentScores.set(studentId.toString(), []);
            }
            studentScores.get(studentId.toString()).push({
              score: scorePercentage,
              date: assessment.date,
              type: assessment.type,
              name: assessment.name || type
            });
            
            // Update type statistics
            assessmentTypes[type].totalScore += scorePercentage;
            assessmentTypes[type].scoreCount++;
            
            // Update overall statistics
            totalScore += scorePercentage;
            scoreCount++;
          }
        });
      }
    });

    // Calculate grade distribution
    const gradeDistribution = [0, 0, 0, 0, 0]; // [90-100, 80-89, 70-79, 60-69, <60]
    studentScores.forEach(scores => {
      if (scores.length > 0) {
        const average = scores.reduce((a, b) => a + b.score, 0) / scores.length;
        if (average >= 90) gradeDistribution[0]++;
        else if (average >= 80) gradeDistribution[1]++;
        else if (average >= 70) gradeDistribution[2]++;
        else if (average >= 60) gradeDistribution[3]++;
        else gradeDistribution[4]++;
      }
    });

    // Calculate assessment type distribution with time-based data
    const assessmentTypeData = {};
    assessments.forEach(assessment => {
      const date = new Date(assessment.date);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      if (!assessmentTypeData[monthYear]) {
        assessmentTypeData[monthYear] = {
          Quiz: 0,
          Activity: 0,
          'Performance Task': 0
        };
      }
      
      if (assessment.type in assessmentTypeData[monthYear]) {
        assessmentTypeData[monthYear][assessment.type]++;
      }
    });

    // Convert to array format for frontend
    const assessmentTypeDistribution = {
      labels: Object.keys(assessmentTypeData).sort((a, b) => new Date(a) - new Date(b)),
      datasets: Object.keys(assessmentTypes).map(type => ({
        type,
        data: Object.keys(assessmentTypeData).sort((a, b) => new Date(a) - new Date(b))
          .map(date => assessmentTypeData[date][type])
      }))
    };

    // Calculate completion rates
    const completionRates = {};
    Object.entries(assessmentTypes).forEach(([type, data]) => {
      const possibleSubmissions = data.count * uniqueStudents.size;
      completionRates[type.toLowerCase().replace(' ', '')] = 
        possibleSubmissions > 0 ? (data.completed / possibleSubmissions) * 100 : 0;
    });

    // Calculate performance trends
    const performanceTrends = assessments.map(assessment => {
      if (!assessment.scores || !(assessment.scores instanceof Map)) {
        return {
          date: assessment.date,
          score: 0,
          type: assessment.type,
          name: assessment.name || assessment.type
        };
      }

      const scores = Array.from(assessment.scores.values());
      const validScores = scores.filter(score => 
        score !== undefined && score !== null
      );

      const averageScore = validScores.length > 0
        ? validScores.reduce((sum, score) => sum + ((score / assessment.maxScore) * 100), 0) / validScores.length
        : 0;

      return {
        date: assessment.date,
        score: averageScore,
        type: assessment.type,
        name: assessment.name || assessment.type
      };
    });

    // Sort performance trends by date
    performanceTrends.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare response
    const response = {
      totalStudents: uniqueStudents.size,
      totalSections: uniqueSections.size,
      totalSubjects: uniqueSubjects.size,
      averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      assessmentCompletion: {
        overall: assessments.length > 0 ? 
          (Object.values(assessmentTypes).reduce((sum, type) => sum + type.completed, 0) / 
          (assessments.length * uniqueStudents.size)) * 100 : 0,
        byType: completionRates
      },
      performanceDistribution: gradeDistribution,
      assessmentTypeDistribution,
      performanceTrends,
      recentActivities: assessments
        .slice(-10)
        .map(assessment => ({
          id: assessment._id,
          date: assessment.date,
          type: assessment.name || assessment.type,
          details: assessment.subject
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    };

    res.json(response);
  } catch (error) {
    console.error('Teacher dashboard stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching teacher dashboard statistics', 
      error: error.message 
    });
  }
});

module.exports = router; 