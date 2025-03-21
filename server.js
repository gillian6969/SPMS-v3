const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const teacherClassRecordsRoutes = require('./routes/teacherClassRecords');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const assessmentRoutes = require('./routes/assessments');
const dashboardRoutes = require('./routes/dashboard');
const teacherRoutes = require('./routes/teachers');
const attendanceRoutes = require('./routes/attendance');
const surveyRoutes = require('./routes/survey');
const { send } = require('./scripts/mailer');
const { getFailingStudents, main } = require('./scripts/emailStudents');

// Load environment variables
dotenv.config();

// Verify required environment variables
const requiredEnvVars = ['RECAPTCHA_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/Student-Monitoring-Capstone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teacher-class-records', teacherClassRecordsRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/survey', surveyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, async() => {
  main();
  console.log(`Server running on port ${PORT}`);
}); 