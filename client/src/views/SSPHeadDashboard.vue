<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import AllSurveyStat from '../components/AllSurveyStat.vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'
import moment from 'moment'
import ExportGraphsModal from '@/components/ExportGraphsModal.vue'

const store = useStore()
const performanceChart = ref(null)
const attendanceChart = ref(null)
const assessmentTypeChart = ref(null)
const performanceTrendChart = ref(null)
const quizzesChart = ref(null)
const assessmentTypePerformanceChart = ref(null)

// Chart references for PDF export
const chartRefs = ref({})

// Data refs
const totalStudents = ref(0)
const totalSections = ref(0)
const totalSubjects = ref(0)
const totalSSPAdvisers = ref(0)
const failingStudents = ref(0)
const completedSurveys = ref(0)
const averageScore = ref(0)
const assessmentCompletion = ref(0)
const recentActivities = ref([])
const sections = ref([])
const subjects = ref([])
const quizzesGrades = ref([]);

// Filter refs
const selectedYear = ref(localStorage.getItem('selectedYear') || '')
const selectedSection = ref(localStorage.getItem('selectedSection') || '')
const selectedSubject = ref(localStorage.getItem('selectedSubject') || '')
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const today = computed(() => moment().format('YYYY-MM-DD'))

// Get teacher ID from store
const getTeacherId = () => {
  const user = store.state.auth.user
  if (!user || !user._id) {
    console.error('No teacher ID found in store')
    return null
  }
  return user._id
}

// Computed properties for data availability
const hasPerformanceData = computed(() => averageScore.value > 0)
const hasAssessmentData = computed(() => assessmentCompletion.value > 0)
const hasActivity = computed(() => recentActivities.value.length > 0)

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

    // Get dashboard stats
    const response = await axios.get(`http://localhost:8000/api/dashboard/stats`, {
      params: {
        year: selectedYear.value,
        section: selectedSection.value,
        subject: selectedSubject.value,
        startDate: selectedStartDate.value,
        endDate: selectedEndDate.value
      },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Dashboard data received:', response.data);

    if (response.data) {
      // Update stats
      totalStudents.value = response.data.totalStudents || 0;
      totalSections.value = response.data.totalSections || 0;
      totalSubjects.value = response.data.totalSubjects || 0;
      totalSSPAdvisers.value = response.data.totalSSPAdvisers || 0;
      averageScore.value = response.data.averageScore || 0;
      assessmentCompletion.value = response.data.assessmentCompletion?.overall || 0;
      recentActivities.value = response.data.recentActivities || [];
    }
    
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
      }
      
      // Count completed surveys
      completedSurveys.value = completedSurveysResponse.data?.length || 0;
      
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
    }

    // Log data before updating charts
    console.log('Performance Distribution:', response.data.performanceDistribution);
    console.log('Assessment Type Distribution:', response.data.assessmentTypeDistribution);
    console.log('Performance Trends:', response.data.performanceTrends);
    console.log('Assessment Completion by Type:', response.data.assessmentCompletion?.byType);

    // Update charts with new data
    if (Array.isArray(response.data.performanceDistribution)) {
      updatePerformanceChart(response.data);
    } else {
      console.warn('Invalid performance distribution data:', response.data.performanceDistribution);
      updatePerformanceChart({
        performanceDistribution: [0, 0, 0, 0, 0]
      });
    }

    if (response.data.assessmentTypeDistribution){
      updateAssessmentTypeChart(response.data.assessmentTypeDistribution);
    } else {
      console.warn('Invalid assessment type distribution data:', response.data.assessmentTypeDistribution);
      updateAssessmentTypeChart([
        { type: 'Quiz', percentage: 0 },
        { type: 'Activity', percentage: 0 },
        { type: 'Performance Task', percentage: 0 }
      ]);
    }

    if (Array.isArray(response.data.performanceTrends)) {
      updatePerformanceTrendChart(response.data.performanceTrends);
    } else {
      console.warn('Invalid performance trends data:', response.data.performanceTrends);
      updatePerformanceTrendChart([]);
    }

    if (response.data.assessmentCompletion?.byType) {
      updateAssessmentTypePerformanceChart(response.data);
    } else {
      console.warn('Invalid assessment completion data:', response.data.assessmentCompletion);
      updateAssessmentTypePerformanceChart({
        assessmentCompletion: {
          byType: {
            quiz: 0,
            activity: 0,
            performancetask: 0
          }
        }
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    
    // Reset data on error
    totalStudents.value = 0;
    totalSections.value = 0;
    totalSubjects.value = 0;
    totalSSPAdvisers.value = 0;
    failingStudents.value = 0;
    completedSurveys.value = 0;
    averageScore.value = 0;
    assessmentCompletion.value = 0;
    recentActivities.value = [];
    
    // Update charts with empty data
    updatePerformanceChart({
      performanceDistribution: [0, 0, 0, 0, 0]
    });
    updateAssessmentTypeChart([
      { type: 'Quiz', percentage: 0 },
      { type: 'Activity', percentage: 0 },
      { type: 'Performance Task', percentage: 0 }
    ]);
    updatePerformanceTrendChart([]);
    updateAssessmentTypePerformanceChart({
      assessmentCompletion: {
        byType: {
          quiz: 0,
          activity: 0,
          performancetask: 0
        }
      }
    });
  }
}

const updatePerformanceChart = (data) => {
  if (!performanceChart.value) return;
  
  const ctx = performanceChart.value.getContext('2d');
  if (!ctx) return;

  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  // Process performance distribution data
  const performanceData = Array.isArray(data.performanceDistribution) 
    ? data.performanceDistribution 
    : [0, 0, 0, 0, 0];
  
  console.log('Performance distribution data:', performanceData);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['90-100', '80-89', '70-79', '60-69', 'Below 60'],
      datasets: [{
        label: 'Number of Students',
        data: performanceData,
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',  // Green for highest
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(251, 191, 36, 0.8)',  // Yellow
          'rgba(251, 146, 60, 0.8)',  // Orange
          'rgba(239, 68, 68, 0.8)'    // Red for lowest
        ],
        borderWidth: 1,
        borderRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0;
              const total = performanceData.reduce((a, b) => a + (b || 0), 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${value} students (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          },
          title: {
            display: true,
            text: 'Number of Students'
          }
        }
      }
    }
  });
  
  // After chart creation, store the reference
  chartRefs.value.performanceChart = performanceChart.value;
};

const updateAssessmentTypeChart = (data) => {
  if (!assessmentTypeChart.value) return;
  
  const ctx = assessmentTypeChart.value.getContext('2d');
  if (!ctx) return;

  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  // Process the assessment type distribution data
  const labels = data.labels || [];
  const datasets = data.datasets || [];
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets.map((dataset, index) => ({
        label: dataset.type,
        data: dataset.data,
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',  // Green
          'rgba(59, 130, 246, 0.8)',  // Blue
          'rgba(251, 191, 36, 0.8)'   // Yellow
        ][index],
        borderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Assessments'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.raw || 0} assessments`
          }
        }
      }
    }
  });
  
  // After chart creation, store the reference
  chartRefs.value.assessmentTypeChart = assessmentTypeChart.value;
};

const updatePerformanceTrendChart = (data) => {
  if (!performanceTrendChart.value) {
    console.warn('Performance trend chart reference not found');
    return;
  }
  
  const ctx = performanceTrendChart.value.getContext('2d');
  if (!ctx) {
    console.warn('Could not get 2d context for performance trend chart');
    return;
  }

  const existingChart = Chart.getChart(ctx);
  if (existingChart) {
    existingChart.destroy();
  }

  // Ensure data is valid
  const validData = Array.isArray(data) ? data : [];
  console.log('Creating performance trend chart with data:', validData);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: validData.map(d => moment(d.date).format('MMM D, YYYY')),
      datasets: [{
        label: 'Average Score',
        data: validData.map(d => Number(d.score) || 0),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const dataPoint = validData[context.dataIndex];
              return `${dataPoint.name}: ${(context.raw || 0).toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Average Score (%)',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 12
            },
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
  
  // After chart creation, store the reference
  chartRefs.value.performanceTrendChart = performanceTrendChart.value;
};

const updateAssessmentTypePerformanceChart = (data) => {
  if (!assessmentTypePerformanceChart.value) return;
  
  const ctx = assessmentTypePerformanceChart.value.getContext('2d');
  if (!ctx) return;

  const existingChart = Chart.getChart(ctx);
  if (existingChart) existingChart.destroy();

  // Process the performance trends data by assessment type
  const trendsByType = {
    Quiz: [],
    Activity: [],
    'Performance Task': []
  };

  // Process performance trends data
  if (Array.isArray(data.performanceTrends)) {
    data.performanceTrends.forEach(trend => {
      const type = trend.type || trend.name;
      if (type in trendsByType) {
        trendsByType[type].push({
          date: new Date(trend.date),
          score: parseFloat(trend.score) || 0
        });
      }
    });
  }

  // Sort data points by date for each type
  Object.keys(trendsByType).forEach(type => {
    trendsByType[type].sort((a, b) => a.date - b.date);
  });

  // Get unique dates across all types
  const allDates = [...new Set(
    Object.values(trendsByType)
      .flat()
      .map(item => item.date)
  )].sort((a, b) => a - b);

  // Create datasets
  const datasets = Object.entries(trendsByType).map(([type, data], index) => {
    const colors = [
      'rgb(52, 211, 153)',   // Green for Quiz
      'rgb(59, 130, 246)',   // Blue for Activity
      'rgb(251, 191, 36)'    // Yellow for Performance Task
    ];
    const color = colors[index];

    return {
      label: type,
      data: allDates.map(date => {
        const point = data.find(d => d.date.getTime() === date.getTime());
        return point ? point.score : null;
      }),
      borderColor: color,
      backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      spanGaps: true // This will connect points even if there are null values
    };
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: allDates.map(date => moment(date).format('MMM D, YYYY')),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw !== null ? context.raw.toFixed(1) : 'N/A';
              return `${context.dataset.label}: ${value}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Score (%)'
          }
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
  
  // After chart creation, store the reference
  chartRefs.value.assessmentTypePerformanceChart = assessmentTypePerformanceChart.value;
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

onMounted(async () => {
  if (store.state.auth.user?._id && store.state.auth.token) {
    console.log('Component mounted, initializing...');
    
    // Wait for the next tick to ensure DOM elements are rendered
    await nextTick();
    
    try {
      // Initialize empty charts first
      console.log('Initializing empty charts...');
      
      updatePerformanceChart({
        performanceDistribution: [0, 0, 0, 0, 0]
      });
      updateAssessmentTypeChart([
        { type: 'Quiz', percentage: 0 },
        { type: 'Activity', percentage: 0 },
        { type: 'Performance Task', percentage: 0 }
      ]);
      updatePerformanceTrendChart([]);
      updateAssessmentTypePerformanceChart({
        assessmentCompletion: {
          byType: {
            quiz: 0,
            activity: 0,
            performancetask: 0
          }
        }
      });
      
      console.log('Empty charts initialized');
      
      // Fetch sections and subjects
      await fetchTeacherSectionsAndSubjects(selectedYear.value);
      console.log('Sections and subjects fetched');
      
      // Fetch actual dashboard data
      await fetchDashboardData();
      console.log('Initial data fetch completed');

      // After charts are initialized, store references
      nextTick(() => {
        chartRefs.value = {
          performanceChart: performanceChart.value,
          assessmentTypeChart: assessmentTypeChart.value,
          performanceTrendChart: performanceTrendChart.value,
          assessmentTypePerformanceChart: assessmentTypePerformanceChart.value
        };
      });

      // Fetch Grades
      const grades = await axios.get('http://localhost:8000/api/dashboard/failing/analytics',);
      const quizzes = grades.data.filter(a => a.type === 'Quiz') || [];
      
      const activity = grades.data.filter(a => a.type === 'Activity') || [];
      const performanceTask = grades.data.filter(a => a.type === 'Performance Task') || [];

      quizzes[0].data.map((datas) => {
        // console.log(datas.scores);
        let temp = 0
        let counter = 0;
        Object.entries(datas.scores).forEach(([id, score]) => {
          if(score <= 50){
            temp = temp + score;
            counter++;
          }
        })
        quizzesGrades.value.push({average : Number((temp / counter).toFixed(2)) || 0, subject : datas.subject});
      });
      
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  } else {
    console.error('No user ID or token found');
  }
})
</script>

<template>
    <div class="dashboard">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="dashboard-title"></h2>

            <div class="d-flex gap-2 align-items-center">
                <!-- Combined Filter Dropdown -->
                <div class="dropdown">
                    <button class="btn btn-filter dropdown-toggle" type="button" id="filterDropdown"
                        data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-filter me-2"></i>
                        {{ getFilterDisplay() }}
                    </button>
                    <div class="dropdown-menu filter-menu p-3" aria-labelledby="filterDropdown">
                        <h6 class="dropdown-header">Filter Options</h6>
                        <div class="mb-3">
                            <label class="form-label">Academic Year</label>
                            <select class="form-select mb-2" v-model="selectedYear" @change="handleYearChange">
                                <option value="">All Years</option>
                                <option value="1st">1st Year</option>
                                <option value="2nd">2nd Year</option>
                                <option value="3rd">3rd Year</option>
                                <option value="4th">4th Year</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Section</label>
                            <select class="form-select mb-2" v-model="selectedSection" :disabled="!selectedYear">
                                <option value="">All Sections</option>
                                <option v-for="section in sections" :key="section" :value="section">{{ section }}</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Subject</label>
                            <select class="form-select mb-2" v-model="selectedSubject" :disabled="!selectedYear">
                                <option value="">All Subjects</option>
                                <option v-for="subject in subjects" :key="subject" :value="subject">{{ subject }}</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Date Range</label>
                            <div class="row g-2">
                                <div class="col">
                                    <input type="date" class="form-control form-control-sm" v-model="selectedStartDate"
                                        :max="today">
                                </div>
                                <div class="col">
                                    <input type="date" class="form-control form-control-sm" v-model="selectedEndDate"
                                        :min="selectedStartDate" :max="today">
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary w-100" @click="applyFilters">Apply Filters</button>
                    </div>
                </div>
                
                <!-- Export Graphs Button -->
                <button class="btn btn-outline-primary" type="button" data-bs-toggle="modal" data-bs-target="#exportGraphsModal">
                    <i class="fas fa-file-export me-2"></i>
                    Export Graphs
                </button>
            </div>
        </div>

        <!-- Analytics Cards -->
        <div class="row g-4">
            <!-- Total SSP Advisers Card -->
            <div class="col-md-4">
                <div class="dashboard-card">
                    <div class="icon-container">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div class="card-info">
                        <h3 class="stat-title">SSP Advisers</h3>
                        <div class="stat-value">{{ totalSSPAdvisers }}</div>
                    </div>
                </div>
            </div>
            
            <!-- Failing Students Card -->
            <div class="col-md-4">
                <div class="dashboard-card">
                    <div class="icon-container">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="card-info">
                        <h3 class="stat-title">Failing Students</h3>
                        <div class="stat-value">{{ failingStudents }}</div>
                    </div>
                </div>
            </div>

            <!-- Completed Surveys Card -->
            <div class="col-md-4">
                <div class="dashboard-card">
                    <div class="icon-container">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div class="card-info">
                        <h3 class="stat-title">Completed Surveys</h3>
                        <div class="stat-value">{{ completedSurveys }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Survey Stats -->
        <div class="row mt-4">
            <div class="col-12">
                <div class="chart-card">
                    <div class="card-body">
                        <h5 class="card-title">
                            <i class="fas fa-poll me-2"></i>
                            Survey Statistics
                        </h5>
                        <AllSurveyStat />
                    </div>
                </div>
            </div>
        </div>

        <!-- Export Graphs Modal -->
        <ExportGraphsModal 
            dashboardType="ssphead"
            :chartRefs="chartRefs"
            :filterInfo="{
                year: selectedYear,
                section: selectedSection,
                subject: selectedSubject,
                startDate: selectedStartDate,
                endDate: selectedEndDate
            }"
        />
    </div>
</template>

<style scoped>
.dashboard {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  letter-spacing: -0.5px;
}

.dashboard-card {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  height: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.icon-container {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background-color: #003366;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.dashboard-card:hover .icon-container {
  transform: scale(1.05);
}

.icon-container i {
  color: white;
  font-size: 1.5rem;
}

.card-info {
  flex: 1;
}

.stat-title {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.875rem;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  margin-bottom: 1rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  padding: 1.5rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  letter-spacing: -0.3px;
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
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  color: #1e293b;
  min-width: 220px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-filter:hover {
  background-color: #f8fafc;
  border-color: #003366;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filter-menu {
  width: 320px;
  padding: 1.25rem;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
}

.dropdown-header {
  color: #003366;
  font-weight: 700;
  padding: 0;
  margin-bottom: 1.25rem;
  font-size: 1rem;
}

.form-label {
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-select, .form-control {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.625rem;
  font-size: 0.9rem;
  color: #1e293b;
  background-color: #fff;
  transition: all 0.2s ease;
}

.form-select:hover, .form-control:hover {
  border-color: #003366;
}

.form-select:focus, .form-control:focus {
  border-color: #003366;
  box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.1);
}

.form-select:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
  opacity: 0.7;
}

.dropdown-divider {
  margin: 1.25rem 0;
  border-top: 1px solid #e2e8f0;
}

.table {
  margin-bottom: 0;
}

.table th {
  font-weight: 600;
  color: #475569;
  border-bottom-width: 1px;
  padding: 1rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  padding: 1rem;
  color: #1e293b;
  vertical-align: middle;
  font-size: 0.9rem;
  border-bottom: 1px solid #e2e8f0;
}

.table tr:last-child td {
  border-bottom: none;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-card {
    margin-bottom: 1rem;
  }

  .filter-menu {
    width: 100%;
    max-width: 320px;
  }

  .btn-filter {
    min-width: auto;
    width: 100%;
  }
}
</style>