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

router.get('/stats', async (req, res) => {
    try {

        const _id = req.query._id;
        const student = await Student.find({ _id : _id });
        const studentSurvey = await Survey.find({ studentId : _id });

        // Array 1 => Array of List of problems
        // Array 2 => List of questions of problems
        // Inside of Array 2 => Object of id, desc, type, rate
        // If student skip the specific question, rate property will not be present in the Object

        // TODO: Get the average rate of specific student from survey questionnaire
 
        const mySurvey = [];

        // Iterate Array 1
        studentSurvey.map((problems) => {
            // Iterate Array 2
            problems.form.map((prob) => {
                mySurvey.push({
                    type : prob.map(p => p.type)[0], // Get type of Problem, only index 0
                    problems : prob,
                    average : getSurveyAverage(prob)
                })
            })
        })

        res.status(200).json(mySurvey);
    } catch (error) {
        console.error('Error fetching survey:', error)
        res.status(500).json({ message: 'Error fetching survey' })
    }
})

// Get all submitted Survey
router.get('/stats/all', async (req, res) => {
    try {
        const surveys = await Survey.find({ submitted : true });

        // Array 1 => Array of List of problems
        // Array 2 => List of questions of problems
        // Inside of Array 2 => Object of id, desc, type, rate
        // If student skip the specific question, rate property will not be present in the Object
 
        const allSurveys = [];
        let problems = [];
        const output = [];
        surveys.map((survey) => {
            survey.form.map((problem) => {
                // Push all type of problems
                problems.push(problem.map(p => p.type)[0])
                // Get All unique problems
                problems = Array.from(new Set(problems))
            })
            
        })
        problems.map((initProb) => {
            surveys.map((survey) => {
                survey.form.map((problem) => {
                    if(problem.filter(p => p.type === initProb).length){
                        allSurveys.push({
                            type : problem.map(p => p.type)[0],
                            form : problem.filter(p => p.type === initProb)
                        })
                    }
                })
            })
        })

        const combinedForms = allSurveys.flatMap(item => 
            item.form.map(formEntry => ({ ...formEntry, type: item.type }))
        );
        
        // Step 2: Segregate by type and calculate the average
        const groupedData = combinedForms.reduce((acc, curr) => {
            let existing = acc.find(item => item.type === curr.type);
        
            if (existing) {
                existing.forms.push(curr);
            } else {
                // acc.push({ type: curr.type, forms: [curr] });
                acc.push({ type: curr.type, forms: [curr] });
            }
        
            return acc;
        }, []);
        
        // Step 3: Calculate the average rate for each type
        groupedData.forEach(group => {
            const totalRate = group.forms.reduce((sum, form) => sum + form.rate, 0);
            group.average = (totalRate / group.forms.length).toFixed(2); // Keeping 2 decimal places
        });

        res.status(200).json(groupedData);
    } catch (error) {
        console.error('Error fetching survey:', error)
        res.status(500).json({ message: 'Error fetching survey' })
    }
})

function getSurveyAverage(problem = []){
    try {
        
        return problem.reduce((n, {rate}) => n + rate, 0) / problem.length || 0

    } catch (error) {
        console.log(error)
    }
}

module.exports = router;