const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    studentId : {
        type: String,
        required: [true, 'Student ID is required'],
    },
    form : {
        type : Object,
        required : [true, 'Survey Form is required'],
        default : []
    },
    submitted : {
        type : Boolean,
        default : false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const Survey = mongoose.model('Survey', surveySchema);

module.exports = Survey;