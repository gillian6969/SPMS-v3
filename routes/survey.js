const express = require('express')
const router = express.Router()
const Survey = require('../models/Survey')
const auth = require('../middleware/auth')
const Student = require('../models/Student')

// Check if student id is valid
router.get('/', async (req, res) => {
  try {
    const _id = req.query._id;
    const student = await Student.find({ _id : _id });
    const studentSurvey = await Survey.find({ studentId : _id });

    if(student.length && studentSurvey.length){
        res.status(200).send({student, studentSurvey});
    }else{
        res.sendStatus(404);
    }

  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ message: 'Server error while fetching data' })
  }
})

router.post('/create', async (req, res) => {
    try {
        const data = req.body;
        const payload = {
            studentId : data.studentId,
            form : data.form,
            submitted : true
        }

        const survey = await Survey.find({ studentId : data.studentId });
        if (!survey) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await Survey.updateOne({ studentId : data.studentId }, { $set: payload});

        // survey.form = data.form;
        // survey.submitted = true;
        // await survey.save();
        res.sendStatus(200);

    } catch (error) {
        console.error('Error submitting survey:', error)
        res.status(500).json({ message: 'Error submitting survey' })
    }
})


module.exports = router;