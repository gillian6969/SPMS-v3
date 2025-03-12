const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Assessment = require('../models/Assessment');

// Create a new assessment
router.post('/', auth, async (req, res) => {
  try {
    const { type, number, maxScore, teacherId, section, subject, date } = req.body;
    
    // Validate required fields
    if (!type || !number || !maxScore || !teacherId || !section || !subject) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create new assessment
    const assessment = new Assessment({
      type,
      number,
      maxScore,
      teacherId,
      section,
      subject,
      date: date || new Date()
    });
    
    await assessment.save();
    
    res.status(201).json(assessment);
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assessments for a teacher, section, subject
router.get('/', auth, async (req, res) => {
  try {
    const { teacherId, section, subject, studentId } = req.query;
    
    console.log('Fetching assessments with params:', {
      teacherId,
      section,
      subject,
      studentId
    });
    
    if (!teacherId) {
      return res.status(400).json({ 
        success: false,
        message: 'Teacher ID is required' 
      });
    }
    
    // Build query
    const query = { teacherId };
    if (section) query.section = section;
    if (subject) query.subject = subject;
    
    console.log('Assessment query:', query);
    
    // Find assessments
    const assessments = await Assessment.find(query).sort({ date: -1 });
    
    console.log(`Found ${assessments.length} assessments`);
    
    // Process assessments to include scores
    const processedAssessments = assessments.map(assessment => {
      // Get all current scores
      const scores = assessment.getAllScores();
      
      // Return a processed assessment object
      return {
        _id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        title: assessment.title || `${assessment.type} ${assessment.number}`,
        maxScore: assessment.maxScore,
        teacherId: assessment.teacherId,
        section: assessment.section,
        subject: assessment.subject,
        date: assessment.date,
        scores: scores,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt
      };
    });
    
    // If studentId is provided, filter for assessments that have a score for this student
    if (studentId) {
      const filteredAssessments = processedAssessments.filter(assessment => {
        return assessment.scores && assessment.scores[studentId] !== undefined;
      });
      
      console.log(`Filtered to ${filteredAssessments.length} assessments for student ${studentId}`);
      
      return res.json(filteredAssessments);
    }
    
    res.json(processedAssessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update a student's score for an assessment
router.post('/score', auth, async (req, res) => {
  try {
    const { teacherId, studentNumber, assessmentId, score } = req.body;
    
    console.log('Received score update request:', {
      teacherId,
      studentNumber,
      assessmentId,
      score
    });
    
    // Validate required fields
    if (!teacherId || !studentNumber || !assessmentId) {
      return res.status(400).json({ 
        success: false,
        message: 'Teacher ID, student number, and assessment ID are required' 
      });
    }
    
    // Find the assessment
    const assessment = await Assessment.findOne({ 
      _id: assessmentId,
      teacherId
    });
    
    if (!assessment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assessment not found' 
      });
    }
    
    // Update the score
    if (score === null) {
      // Remove the score
      assessment.removeStudentScore(studentNumber);
      console.log(`Removed score for student ${studentNumber} from assessment ${assessmentId}`);
    } else {
      // Set the score
      assessment.setStudentScore(studentNumber, score);
      console.log(`Set score for student ${studentNumber} to ${score} for assessment ${assessmentId}`);
    }
    
    // Save the assessment
    await assessment.save();
    
    // Get all current scores
    const scores = assessment.getAllScores();
    
    // Return the updated assessment
    res.json({
      success: true,
      message: 'Score updated successfully',
      assessment: {
        _id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        title: assessment.title || `${assessment.type} ${assessment.number}`,
        maxScore: assessment.maxScore,
        teacherId: assessment.teacherId,
        section: assessment.section,
        subject: assessment.subject,
        date: assessment.date,
        scores: scores,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update a student's score for an assessment (using ID in URL)
router.post('/:id/score', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, studentNumber, score } = req.body;
    
    console.log('Received score update request (ID in URL):', {
      assessmentId: id,
      teacherId,
      studentNumber,
      score
    });
    
    // Validate required fields
    if (!teacherId || !studentNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Teacher ID and student number are required' 
      });
    }
    
    // Find the assessment
    const assessment = await Assessment.findOne({ 
      _id: id,
      teacherId
    });
    
    if (!assessment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assessment not found' 
      });
    }
    
    console.log('Found assessment:', {
      id: assessment._id,
      type: assessment.type,
      number: assessment.number,
      hasScores: !!assessment.scores,
      hasStudentScores: !!assessment.studentScores,
      studentScoresLength: assessment.studentScores ? assessment.studentScores.length : 0
    });
    
    // Update the score - handle both storage methods
    if (assessment.scores instanceof Map || typeof assessment.scores === 'object') {
      // Using Map storage method
      console.log('Using Map storage method');
      if (score === null) {
        assessment.scores.delete(studentNumber);
        console.log(`Removed score for student ${studentNumber} from assessment ${id} (Map method)`);
      } else {
        assessment.scores.set(studentNumber, score);
        console.log(`Set score for student ${studentNumber} to ${score} for assessment ${id} (Map method)`);
      }
    } else if (Array.isArray(assessment.studentScores)) {
      // Using Array storage method
      console.log('Using Array storage method');
      if (score === null) {
        assessment.removeStudentScore(studentNumber);
        console.log(`Removed score for student ${studentNumber} from assessment ${id} (Array method)`);
      } else {
        assessment.setStudentScore(studentNumber, score);
        console.log(`Set score for student ${studentNumber} to ${score} for assessment ${id} (Array method)`);
      }
    } else {
      console.log('No recognized score storage method found. Creating studentScores array.');
      // Initialize studentScores if it doesn't exist
      assessment.studentScores = [];
      if (score !== null) {
        assessment.setStudentScore(studentNumber, score);
        console.log(`Set score for student ${studentNumber} to ${score} for assessment ${id} (new Array method)`);
      }
    }
    
    // Save the assessment
    await assessment.save();
    console.log('Assessment saved successfully');
    
    // Get all current scores - handle both storage methods
    let scores;
    if (assessment.scores instanceof Map || typeof assessment.scores === 'object') {
      console.log('Getting scores from Map');
      if (assessment.scores instanceof Map) {
        scores = Object.fromEntries(assessment.scores);
      } else {
        scores = assessment.scores;
      }
    } else if (Array.isArray(assessment.studentScores)) {
      console.log('Getting scores from Array');
      scores = assessment.getAllScores();
    } else {
      console.log('No scores found, returning empty object');
      scores = {};
    }
    
    console.log('Final scores:', scores);
    
    // Return the updated assessment
    res.json({
      success: true,
      message: 'Score updated successfully',
      assessment: {
        _id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        title: assessment.title || `${assessment.type} ${assessment.number}`,
        maxScore: assessment.maxScore,
        teacherId: assessment.teacherId,
        section: assessment.section,
        subject: assessment.subject,
        date: assessment.date,
        scores: scores,
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating score (ID in URL):', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Direct score update - updates the scores object directly
router.put('/:id/update-score', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, studentNumber, score } = req.body;
    
    console.log('Received direct score update request:', {
      assessmentId: id,
      teacherId,
      studentNumber,
      score
    });
    
    // Validate required fields
    if (!teacherId || !studentNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Teacher ID and student number are required' 
      });
    }
    
    // Find the assessment
    const assessment = await Assessment.findOne({ 
      _id: id,
      teacherId
    });
    
    if (!assessment) {
      return res.status(404).json({ 
        success: false,
        message: 'Assessment not found' 
      });
    }
    
    console.log('Found assessment:', {
      id: assessment._id,
      type: assessment.type,
      number: assessment.number
    });
    
    // Initialize scores object if it doesn't exist
    if (!assessment.scores) {
      assessment.scores = {};
    }
    
    // Update or remove the score
    if (score === null) {
      // Remove the score by setting it to undefined
      delete assessment.scores[studentNumber];
      console.log(`Removed score for student ${studentNumber} from assessment ${id}`);
    } else {
      // Set the score
      assessment.scores[studentNumber] = score;
      console.log(`Set score for student ${studentNumber} to ${score} for assessment ${id}`);
    }
    
    // Mark the scores field as modified
    assessment.markModified('scores');
    
    // Save the assessment
    await assessment.save();
    console.log('Assessment saved successfully');
    
    // Return the updated assessment
    res.json({
      success: true,
      message: 'Score updated successfully',
      assessment: {
        _id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        title: assessment.title || `${assessment.type} ${assessment.number}`,
        maxScore: assessment.maxScore,
        teacherId: assessment.teacherId,
        section: assessment.section,
        subject: assessment.subject,
        date: assessment.date,
        scores: assessment.scores || {},
        createdAt: assessment.createdAt,
        updatedAt: assessment.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating score directly:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Delete an assessment
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.query;
    
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required' });
    }
    
    // Find and delete the assessment
    const assessment = await Assessment.findOneAndDelete({ 
      _id: id,
      teacherId
    });
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple endpoint to update a score directly
router.post('/update-score-direct', auth, async (req, res) => {
  try {
    const { assessmentId, teacherId, studentNumber, score } = req.body;
    
    console.log('Direct score update request received:', {
      assessmentId,
      teacherId,
      studentNumber,
      score
    });
    
    // Validate required fields
    if (!assessmentId || !teacherId || !studentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID, teacher ID, and student number are required'
      });
    }
    
    // Find the assessment
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      teacherId
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    console.log('Found assessment:', {
      id: assessment._id,
      type: assessment.type,
      number: assessment.number
    });
    
    // Initialize scores object if it doesn't exist
    if (!assessment.scores) {
      assessment.scores = {};
    }
    
    // Update the score
    if (score === null) {
      // Remove the score
      delete assessment.scores[studentNumber];
      console.log(`Removed score for student ${studentNumber}`);
    } else {
      // Set the score
      assessment.scores[studentNumber] = score;
      console.log(`Set score for student ${studentNumber} to ${score}`);
    }
    
    // Mark the scores field as modified (important for Mongoose to detect changes to the object)
    assessment.markModified('scores');
    
    // Save the assessment
    await assessment.save();
    console.log('Assessment saved successfully');
    
    // Return success response
    res.json({
      success: true,
      message: 'Score updated successfully',
      assessment: {
        _id: assessment._id,
        type: assessment.type,
        number: assessment.number,
        maxScore: assessment.maxScore,
        scores: assessment.scores
      }
    });
  } catch (error) {
    console.error('Error updating score:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 