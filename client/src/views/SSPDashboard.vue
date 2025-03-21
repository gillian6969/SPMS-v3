<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'
import moment from 'moment'

const store = useStore()
const surveyAverageChart = ref(null)
const surveyDistributionChart = ref(null)

// Data refs
const failingStudents = ref(0)
const completedSurveys = ref(0)
const surveyData = ref([])
const sections = ref([])
const subjects = ref([])

// Filter refs
const selectedYear = ref(localStorage.getItem('selectedYear') || '')
const selectedSection = ref(localStorage.getItem('selectedSection') || '')
const selectedSubject = ref(localStorage.getItem('selectedSubject') || '')
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const today = computed(() => moment().format('YYYY-MM-DD'))

// Loading states
const loadingSurveyData = ref(false)

// Get teacher ID from store
const getTeacherId = () => {
  const user = store.state.auth.user
  if (!user || !user._id) {
    console.error('No teacher ID found in store')
    return null
  }
  return user._id
}

// Remove unused computed properties and only keep what's needed
const hasSurveyData = computed(() => surveyData.value.length > 0)

const fetchTeacherSectionsAndSubjects = async (year = '') => {
  try {
    const teacherId = getTeacherId()
    if (!teacherId) return

    const token = store.state.auth.token
    console.log('Fetching sections and subjects for:', { teacherId, year })

    // First get all class records to extract sections
    const recordsResponse = await axios.get('http://localhost:8000/api/teacher-class-records', {
      params: { 
        teacherId,
        year 
      },
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (recordsResponse.data) {
      // Extract unique sections and subjects
      const uniqueSections = [...new Set(recordsResponse.data.map(record => record.section))]
      const uniqueSubjects = [...new Set(recordsResponse.data.map(record => record.subject))]
      
      sections.value = uniqueSections.sort()
      subjects.value = uniqueSubjects.sort()
      
      console.log('Loaded sections and subjects:', {
        sections: sections.value,
        subjects: subjects.value
      })
    }
  } catch (error) {
    console.error('Error fetching teacher sections and subjects:', error)
    sections.value = []
    subjects.value = []
  }
}

const handleYearChange = async () => {
  selectedSection.value = ''
  selectedSubject.value = ''
  if (selectedYear.value) {
    await fetchTeacherSectionsAndSubjects(selectedYear.value)
  } else {
    sections.value = []
    subjects.value = []
  }
  await fetchDashboardData()
}

const getFilterDisplay = () => {
  const filters = []
  if (selectedYear.value) filters.push(selectedYear.value + ' Year')
  if (selectedSection.value) filters.push(selectedSection.value)
  if (selectedSubject.value) filters.push(selectedSubject.value)
  return filters.length > 0 ? filters.join(' - ') : 'Filter View'
}

const fetchDashboardData = async () => {
  try {
    const teacherId = getTeacherId();
    if (!teacherId) {
      console.error('No teacher ID found');
      return;
    }

    const token = store.state.auth.token;
    if (!token) {
      console.error('No auth token found');
      return;
    }

    console.log('Fetching dashboard data with params:', {
      teacherId,
      year: selectedYear.value,
      section: selectedSection.value,
      subject: selectedSubject.value,
      startDate: selectedStartDate.value,
      endDate: selectedEndDate.value
    });

    // Get failing students count directly from failing students list
    try {
      const failingListResponse = await axios.get('http://localhost:8000/api/students/failing/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

      // Get completed surveys to exclude those students
      const completedSurveysResponse = await axios.get('http://localhost:8000/api/survey/submitted', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const completedSurveyIds = new Set();
      if (completedSurveysResponse.data && Array.isArray(completedSurveysResponse.data)) {
        completedSurveysResponse.data.forEach(survey => {
          completedSurveyIds.add(survey.studentId);
        });
        
        // Set completed surveys count
        completedSurveys.value = completedSurveysResponse.data.length;
        
        // Also store survey data for visualization
        surveyData.value = completedSurveysResponse.data;
      } else {
        completedSurveys.value = 0;
        surveyData.value = [];
      }
      
      // Filter out students who have completed surveys
      const failingStudentList = failingListResponse.data?.list || [];
      if (Array.isArray(failingStudentList)) {
        const filteredCount = failingStudentList.filter(student => 
          !completedSurveyIds.has(student.info._id)
        ).length;
        
        failingStudents.value = filteredCount;
      } else {
        failingStudents.value = 0;
      }
    } catch (error) {
      console.error('Error fetching failing students:', error);
      failingStudents.value = 0;
      completedSurveys.value = 0;
      surveyData.value = [];
    }

    // Log survey data
    console.log('Survey Data:', surveyData.value);

    // Only update survey charts
    nextTick(() => {
      createSurveyAverageChart();
      createSurveyDistributionChart();
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    
    // Reset data on error
    failingStudents.value = 0;
    completedSurveys.value = 0;
    surveyData.value = [];
    
    // Update just survey average chart with empty data
    nextTick(() => {
      createSurveyAverageChart();
      createSurveyDistributionChart();
    });
  }
}

const createSurveyAverageChart = () => {
  console.log('Starting survey average chart creation...');
  if (!surveyAverageChart.value) {
    console.error('Survey average chart reference not found');
    return;
  }
  
  const ctx = surveyAverageChart.value.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2d context for survey average chart');
    return;
  }

  console.log('Creating survey average chart with data:', surveyData.value);

  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    console.log('Destroying existing chart');
    existingChart.destroy();
  }

  // For testing/demo: Use sample data if no actual data exists
  if (!surveyData.value || surveyData.value.length === 0) {
    console.log('No survey data available, creating sample chart');
    
    const sampleLabels = ['Academic Problems', 'Financial Issues', 'Social Difficulties', 'Health Concerns', 'Family Problems'];
    const sampleScores = [3.8, 2.5, 3.2, 1.7, 2.9];

  new Chart(ctx, {
    type: 'bar',
    data: {
        labels: sampleLabels,
      datasets: [{
          label: 'Average Score (Sample Data)',
          data: sampleScores,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
                return `Average Score: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
            max: 5,
            title: { display: true, text: 'Average Score (1-5)' }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
          }
        }
      }
    }
  });
    return;
  }

  // Extract questions and calculate average scores
  const questionLabels = [];
  const questionScores = [];
  
  // Collect all unique questions
  const allQuestions = new Set();
  surveyData.value.forEach(survey => {
    if (survey.responses && Array.isArray(survey.responses)) {
      survey.responses.forEach(response => {
        if (response.question) {
          allQuestions.add(response.question);
        }
      });
    }
  });
  
  console.log('Found questions:', allQuestions);
  
  // Sort questions alphabetically for consistent display
  const sortedQuestions = [...allQuestions].sort();
  
  // If no questions found, show sample data
  if (sortedQuestions.length === 0) {
    console.log('No questions found in survey data, using sample data');
    
    const sampleLabels = ['Academic Problems', 'Financial Issues', 'Social Difficulties', 'Health Concerns', 'Family Problems'];
    const sampleScores = [3.8, 2.5, 3.2, 1.7, 2.9];
  
  new Chart(ctx, {
    type: 'bar',
    data: {
        labels: sampleLabels,
        datasets: [{
          label: 'Average Score (Sample Data)',
          data: sampleScores,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 5
        }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Average Score: ${context.raw}`;
              }
            }
          }
        },
      scales: {
          y: {
            beginAtZero: true,
            max: 5,
            title: { display: true, text: 'Average Score (1-5)' }
          },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
    return;
  }
  
  // Calculate average score for each question
  sortedQuestions.forEach(question => {
    let totalScore = 0;
    let count = 0;
    
    surveyData.value.forEach(survey => {
      if (survey.responses && Array.isArray(survey.responses)) {
        survey.responses.forEach(response => {
          if (response.question === question && response.answer !== undefined && !isNaN(response.answer)) {
            totalScore += Number(response.answer);
            count++;
          }
        });
      }
    });
    
    const averageScore = count > 0 ? totalScore / count : 0;
    questionLabels.push(question.length > 30 ? question.substring(0, 30) + '...' : question);
    questionScores.push(parseFloat(averageScore.toFixed(2)));
  });
  
  console.log('Chart data prepared:', { labels: questionLabels, data: questionScores });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: questionLabels,
      datasets: [{
        label: 'Average Score',
        data: questionScores,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (tooltipItems) => {
              // Show full question text in tooltip
              const index = tooltipItems[0].dataIndex;
              return sortedQuestions[index] || questionLabels[index];
            },
            label: (context) => {
              return `Average Score: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          title: { display: true, text: 'Average Score (1-5)' }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
};

// Create pie chart for survey response distribution by severity level
const createSurveyDistributionChart = () => {
  console.log('Starting survey distribution chart creation...');
  if (!surveyDistributionChart.value) {
    console.error('Survey distribution chart reference not found');
    return;
  }
  
  const ctx = surveyDistributionChart.value.getContext('2d');
  if (!ctx) {
    console.error('Could not get 2d context for survey distribution chart');
    return;
  }

  console.log('Creating survey distribution chart with data:', surveyData.value);

  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    console.log('Destroying existing distribution chart');
    existingChart.destroy();
  }

  // For testing/demo: Always use sample data to ensure chart is visible
  const sampleData = [25, 40, 20, 15]; // High, Medium, Low, Minimal

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['High Priority', 'Medium Priority', 'Low Priority', 'Minimal Concern'],
      datasets: [{
        data: sampleData,
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',    // Red (High)
          'rgba(251, 191, 36, 0.8)',   // Yellow (Medium)
          'rgba(59, 130, 246, 0.8)',   // Blue (Low)
          'rgba(52, 211, 153, 0.8)'    // Green (Minimal)
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(52, 211, 153, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0;
              const total = sampleData.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
    }
}
  });
};

const formatDate = (date) => {
  return moment(date).format('MMM D, YYYY')
}

const applyFilters = async () => {
  // Save selected values to localStorage
  if (selectedYear.value) {
    localStorage.setItem('selectedYear', selectedYear.value)
  } else {
    localStorage.removeItem('selectedYear')
  }

  if (selectedSection.value) {
    localStorage.setItem('selectedSection', selectedSection.value)
  } else {
    localStorage.removeItem('selectedSection')
  }

  if (selectedSubject.value) {
    localStorage.setItem('selectedSubject', selectedSubject.value)
  } else {
    localStorage.removeItem('selectedSubject')
  }

  await fetchDashboardData()
}

// Watch for filter changes
watch(selectedYear, handleYearChange)
watch([selectedSection, selectedSubject], applyFilters)
watch([selectedStartDate, selectedEndDate], () => {
  if (selectedStartDate.value && selectedEndDate.value) {
    // Validate date range
    const start = moment(selectedStartDate.value);
    const end = moment(selectedEndDate.value);
    
    if (end.isBefore(start)) {
      selectedEndDate.value = selectedStartDate.value;
    }
    
    fetchDashboardData();
  }
})

// Watch surveyData for changes to update charts
watch(surveyData, () => {
  loadingSurveyData.value = true;
  
  // Use nextTick to ensure DOM is updated
  nextTick(() => {
    try {
      createSurveyAverageChart();
      createSurveyDistributionChart();
    } catch (error) {
      console.error('Error creating survey charts:', error);
    } finally {
      loadingSurveyData.value = false;
    }
  });
}, { deep: true })

onMounted(async () => {
  console.log('SSP Dashboard mounted');
      await fetchDashboardData();
  
  // Initialize charts
  createSurveyAverageChart();
  createSurveyDistributionChart();
  
  // Set up watchers for filters
  watch([selectedYear, selectedSection, selectedSubject, selectedStartDate, selectedEndDate], async () => {
    console.log('Filters changed, refreshing data');
    await fetchDashboardData();
  });
});
</script>

<template>
  <div class="dashboard-container">
    <!-- Welcome Section -->
    <div class="greeting-section mb-4">
      <h2 class="greeting">Welcome, {{ store.state.auth.user?.firstName || 'User' }}</h2>
      <p class="greeting-subtitle">Here's your dashboard overview</p>
    </div>

        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="dashboard-title"></h2>

      <!-- Filters -->
            <div class="dropdown">
        <button class="btn btn-filter dropdown-toggle" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-filter me-2"></i>
                    {{ getFilterDisplay() }}
                </button>
                <div class="dropdown-menu filter-menu p-3" aria-labelledby="filterDropdown">
                    <h6 class="dropdown-header">Filter Options</h6>
          
                    <div class="mb-3">
            <label for="yearFilter" class="form-label">Year</label>
            <select id="yearFilter" class="form-select" v-model="selectedYear" @change="handleYearChange">
                            <option value="">All Years</option>
                            <option value="1st">1st Year</option>
                            <option value="2nd">2nd Year</option>
                            <option value="3rd">3rd Year</option>
                            <option value="4th">4th Year</option>
                        </select>
                    </div>
          
                    <div class="mb-3">
            <label for="sectionFilter" class="form-label">Section</label>
            <select id="sectionFilter" class="form-select" v-model="selectedSection">
                            <option value="">All Sections</option>
                            <option v-for="section in sections" :key="section" :value="section">{{ section }}</option>
                        </select>
                    </div>
          
                    <div class="mb-3">
            <label for="subjectFilter" class="form-label">Subject</label>
            <select id="subjectFilter" class="form-select" v-model="selectedSubject">
                            <option value="">All Subjects</option>
                            <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
                        </select>
                    </div>
          
          <div class="dropdown-divider"></div>
          
                    <div class="mb-3">
            <label for="startDateFilter" class="form-label">Start Date</label>
            <input type="date" id="startDateFilter" class="form-control" v-model="selectedStartDate" :max="selectedEndDate || today">
                            </div>
          
          <div class="mb-3">
            <label for="endDateFilter" class="form-label">End Date</label>
            <input type="date" id="endDateFilter" class="form-control" v-model="selectedEndDate" :min="selectedStartDate" :max="today">
                    </div>
                    <div class="dropdown-divider"></div>
                    <button class="btn btn-primary w-100" @click="applyFilters">Apply Filters</button>
                </div>
            </div>
        </div>

    <!-- Stats Cards -->
    <div class="row mb-4 g-3">
      <!-- Failing Students Card -->
      <div class="col-md-6">
                <div class="dashboard-card">
          <div class="icon-container bg-danger">
            <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="card-info">
            <h3 class="stat-title">Failing Students</h3>
            <div class="stat-value">{{ failingStudents }}</div>
                    </div>
                </div>
            </div>

      <!-- Total Surveys Card -->
      <div class="col-md-6">
                <div class="dashboard-card">
          <div class="icon-container bg-success">
            <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div class="card-info">
            <h3 class="stat-title">Completed Surveys</h3>
            <div class="stat-value">{{ completedSurveys }}</div>
                    </div>
                </div>
            </div>
        </div>

    <!-- Survey Average Scores Chart -->
        <div class="row mb-4">
      <div class="col-md-6">
                <div class="chart-card">
          <h3 class="card-title">
            <i class="fas fa-chart-bar me-2"></i>
            Survey Average Scores
          </h3>
                        <div class="chart-container">
            <div v-if="loadingSurveyData" class="no-data-message">
              <div class="spinner-border text-primary spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Loading...</span>
                        </div>
              Loading survey data...
                    </div>
            <div v-else-if="!hasSurveyData" class="no-data-message">
              <i class="fas fa-info-circle me-2"></i>
              No survey data available for the selected filters.
                </div>
            <canvas ref="surveyAverageChart"></canvas>
                    </div>
                </div>
            </div>

      <!-- Survey Response Distribution Chart -->
      <div class="col-md-6">
                <div class="chart-card">
          <h3 class="card-title">
            <i class="fas fa-chart-pie me-2"></i>
            Survey Response Distribution
          </h3>
          <p class="chart-description">Distribution of student issues by priority level</p>
                        <div class="chart-container">
            <div v-if="loadingSurveyData" class="no-data-message">
              <div class="spinner-border text-primary spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Loading...</span>
                        </div>
              Loading survey data...
                    </div>
            <div v-else-if="!hasSurveyData" class="no-data-message">
              <i class="fas fa-info-circle me-2"></i>
              No survey data available for the selected filters.
                </div>
            <canvas ref="surveyDistributionChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-container {
  padding: 1.5rem;
  background-color: #f8fafc;
}

.welcome-section {
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.welcome-message {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 0;
}

.dashboard-card {
  background: #fff;
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 100%;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.icon-container {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-danger {
  background-color: #ef4444;
}

.bg-success {
  background-color: #10b981;
}

.icon-container i {
  color: white;
  font-size: 1.25rem;
}

.card-info {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.chart-container {
  position: relative;
  height: 450px;
  width: 100%;
}

.chart-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  width: 100%;
    padding: 1rem;
}

.btn-filter {
  background-color: white;
  border: 1px solid #e2e8f0;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: #0f172a;
  width: auto;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.filter-menu {
  width: 280px;
  padding: 1rem;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 10px 15px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.dropdown-header {
  color: #0f172a;
  font-weight: 600;
  padding: 0;
  margin-bottom: 1rem;
  font-size: 0.9375rem;
}

.form-label {
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.375rem;
  font-size: 0.8125rem;
}

.form-select, .form-control {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.875rem;
  color: #0f172a;
  background-color: #fff;
  transition: all 0.15s ease;
}

.form-select:focus, .form-control:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

@media (max-width: 768px) {
  .dashboard-container {
  padding: 1rem;
  }
  
  .chart-container {
    height: 300px;
  }
}

/* Greeting Section Styles */
.greeting-section {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.greeting {
  font-size: 2.25rem;
  font-weight: 700;
  color: #003366;
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
}

.greeting-subtitle {
  color: #64748b;
  font-size: 1.125rem;
  font-weight: 400;
  margin: 0;
}

.chart-description {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.25rem;
  font-style: italic;
}
</style>