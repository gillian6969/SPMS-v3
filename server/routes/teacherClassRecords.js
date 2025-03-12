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
    
    res.json(records);
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
    }).populate('students').lean();
    
    if (!record) {
      return res.json([]);
    }
    
    res.json(record.students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error' });
  }
}); 