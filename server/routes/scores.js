const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Assessment = require('../models/Assessment');

// Simple endpoint to update a score
router.post('/update', auth, async (req, res) => {
  try {
    const { assessmentId, teacherId, studentNumber, score } = req.body;
    
    console.log('Score update request received:', {
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