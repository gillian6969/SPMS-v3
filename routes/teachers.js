const express = require('express')
const router = express.Router()
const User = require('../models/User')
const auth = require('../middleware/auth')
const isCITHead = require('../middleware/isCITHead')

// Get all teachers
router.get('/', auth, isCITHead, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ lastName: 1, firstName: 1 })
    
    res.json(teachers)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    res.status(500).json({ message: 'Server error while fetching teachers' })
  }
})

// Update teacher
router.put('/:id', auth, isCITHead, async (req, res) => {
  try {
    const { firstName, lastName, email, teachingYear, subjects } = req.body
    const teacherId = req.params.id

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: teacherId } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already taken' })
    }

    const teacher = await User.findById(teacherId)
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' })
    }

    teacher.firstName = firstName
    teacher.lastName = lastName
    teacher.email = email
    teacher.teachingYear = teachingYear
    teacher.subjects = subjects

    await teacher.save()

    const updatedTeacher = await User.findById(teacherId).select('-password')
    res.json(updatedTeacher)
  } catch (error) {
    console.error('Error updating teacher:', error)
    res.status(500).json({ message: 'Server error while updating teacher' })
  }
})

// Delete teacher
router.delete('/:id', auth, isCITHead, async (req, res) => {
  try {
    const teacherId = req.params.id
    const teacher = await User.findById(teacherId)

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' })
    }

    await User.findByIdAndDelete(teacherId)
    res.json({ message: 'Teacher deleted successfully' })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    res.status(500).json({ message: 'Server error while deleting teacher' })
  }
})

module.exports = router 