// Function returns the date of the "last Monday" from

const Assessment = require("../models/Assessment");
const Student = require("../models/Student");
const Survey = require("../models/Survey");
const { send } = require("./mailer");

// the given input date.
function getLastMonday(dt) {

  let n = null; // last Monday conversion

  switch (dt.getDay()) {
      case 0: n = -5; break;
      case 1: n = -6; break;
      case 2: n = 0; break;
      case 3: n = -1; break;
      case 4: n = -2; break;
      case 5: n = -3; break;
      case 6: n = -4; break;
      default: "This never happens";
  }

  let today_date = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  let last_monday_date = today_date.setDate(today_date.getDate() + n );

  return last_monday_date;
}

var d = new Date()   // -or- any date like ISODate("2019-11-26T00:00:00Z")
var LAST_MONDAY = getLastMonday(d);

const getBeginningOfTheWeek = (now) => {
    const days = (now.getDay() + 7 - 1) % 7;
    now.setDate(now.getDate() - days);
    now.setHours(0, 0, 0, 0);
    return now;
};

async function getFailingStudents(){
    // Per Assessments
    const assessmentTypes = ['Quiz', 'Activity', 'Performance Task'];
    const today = new Date();
    let analytics = []
    // const assessmentData = await Assessment.find({ "$expr": { "$eq": [{ "$month": "$date" }, today.getMonth() + 1] } });
    const assessmentData = await Assessment.aggregate([
        { 
            $match: {
              date: { $gte: getBeginningOfTheWeek(new Date()), $lt: new Date() }
            }
          },
          { 
            $project: { created_at: 0 } 
          }
    ]);
    // assessmentTypes.forEach(async (type) => {
    //   analytics.push(
    //     {
    //       type : type,
    //       data : assessmentData.filter(a => a.type === type)
    //     }
    //   )
    // })

    const Students = await Student.find({});
    let numberOfAssessment = 0;
    let myTotalScore = 0;
    let totalMaxScore = 0;
    let myAverage = 0;

    assessmentData.map((assess) => {
      Object.entries(assess.scores).forEach(([id, score]) => {
        numberOfAssessment = 0;
        myTotalScore = 0;
        totalMaxScore = 0;
        myAverage = 0;
        if(Students.filter(st => st.studentId === id).length){

          numberOfAssessment++;
          myTotalScore= myTotalScore + score;
          totalMaxScore = totalMaxScore + assess.maxScore;
          myAverage = myTotalScore / numberOfAssessment;

          // Get only failed students
          if((assess.maxScore/2) > score){
            if(!analytics.filter(a => a.info.studentId === id).length){
              analytics.push(
                {
                  info : Students.filter(st => st.studentId === id )[0],
                  average : myAverage,
                  totalMaxScore : totalMaxScore,
                  date : assess.date,
                  totalScore : myTotalScore
                }
              )
            }else{
              // This will update current student record
              analytics.filter(a => a.info.studentId === id)[0].average = myAverage;
              analytics.filter(a => a.info.studentId === id)[0].totalMaxScore+= totalMaxScore;
              analytics.filter(a => a.info.studentId === id)[0].totalScore+= myTotalScore;
              analytics.filter(a => a.info.studentId === id)[0].date = assess.date;
            }
          }
          
        }
        
      })
    })

    return analytics;
}

async function isSubmitted(studentId){
    const submitted = await Survey.find({ studentId : studentId }) || [];

    return submitted[0] || false;

}

async function sendEmail(){
    const students = await getFailingStudents();

    if(students){
        students.map(async (stud) => {
            const insertedSurveyId = await insertSurveyForm(stud?.info?._id);
            const submitted = await isSubmitted(stud?.info?._id);
            // Check if already submitted the survey form
            if(!submitted?.submitted && insertedSurveyId){
                console.log('Student without survey found!', stud?.info?.studentId)
                send(stud?.info?.email, 
                    `<div>
                        <p>Hi<b> ${stud?.info?.firstName} ${stud?.info?.middleName} ${stud?.info?.lastName}</b>,</p>

                        <p>This email contains a survey designed to address the challenges students face while studying at PHINMA Araullo University. By participating in this survey, you can help us better understand and support your academic journey.</p>

                        <p>Rest assured that your information will remain confidential. We highly value your honest responses, as they will contribute to improving our services.</p>

                        <p>Thank you for your time, and have a wonderful day!</p>
                        <p>SPMS</p>

                        <p>Click the link below to answer the survey:</p>
                        <span><a href="${process.env.link}?student=${stud?.info?._id}&survey=${insertedSurveyId}">SURVEY FORM</a></span>
                    </div>`, 
                    'Survey Form'
                );
                
                
            }else{
                console.log('Student has survey!', stud?.info?.studentId)
            }
            
        });
    }
}

// Current process : Kapag nag submit ng survey ang student, isang beses lang sya makaka receive non. 
// TODO : mag isip kung pano makakapag survey sa next week if failing student ulit sya
async function exists(studentId){
    const exists = await Survey.find({ studentId : studentId, submitted : true })
    return exists.length;
}

async function deleteSurvey(studentId) {
  await Survey.deleteOne({ studentId : studentId })
}

async function insertSurveyForm(studentId){
    const payload = {
        studentId : studentId,
        form : {},
    }
    const surveyFormExists = await exists(studentId);
    // Check if survey exists and submitted
    if(!surveyFormExists){
      await deleteSurvey(studentId)
      const survey = new Survey(payload);
      const data = await survey.save(); 
      return data._id;
    }
    return false;
}

async function main(){
    var today = new Date();
    // RUN Every MONDAY, every 1hr duration on PRODUCTION
    // setInterval(async() => {
    //     console.log('Checking for failing students - ', today.toDateString())
        
    // }, 10000);
    // RUN ONCE FOR TESTING PURPOSES
    // await sendEmail();
}

module.exports = { main }
