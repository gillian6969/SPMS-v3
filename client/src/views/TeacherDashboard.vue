<template>
  <div class="dashboard">
    <!-- Greeting Section -->
    <div class="greeting-section mb-4">
      <h2 class="greeting">Welcome, {{ userName }}</h2>
      <p class="greeting-subtitle">Here's your dashboard overview</p>
    </div>
    
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="dashboard-title"></h2>
      
      <!-- Combined Filter Dropdown -->
      <div class="dropdown">
        <button class="btn btn-filter dropdown-toggle" type="button" id="filterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fas fa-filter me-2"></i>
          {{ getFilterDisplay() }}
        </button>
        <div class="dropdown-menu filter-menu p-3" aria-labelledby="filterDropdown">
          <h6 class="dropdown-header">Filter Options</h6>
          <div class="mb-3">
            <label class="form-label">Academic Year</label>
            <select class="form-select mb-2" v-model="selectedYear" @change="handleYearChange">
              <option value="">All Years</option>
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
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
            <div class="d-flex gap-2">
              <div class="flex-grow-1">
                <label class="small text-muted">From</label>
                <input 
                  type="date" 
                  class="form-control form-control-sm" 
                  v-model="selectedStartDate"
                  :max="selectedEndDate || today"
                >
              </div>
              <div class="flex-grow-1">
                <label class="small text-muted">To</label>
                <input 
                  type="date" 
                  class="form-control form-control-sm" 
                  v-model="selectedEndDate"
                  :min="selectedStartDate"
                  :max="today"
                >
              </div>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="btn btn-primary w-100" @click="applyFilters" :disabled="loading">
            <span v-if="loading"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</span>
            <span v-else>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div class="row g-4 mb-4">
      <!-- Total Students Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-user-graduate"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Total Students</h3>
            <div class="stat-value" v-if="!loading">{{ totalStudents }}</div>
            <div class="stat-value loading" v-else><i class="fas fa-spinner fa-spin"></i></div>
          </div>
        </div>
      </div>

      <!-- Total Sections Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-chalkboard"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Active Sections</h3>
            <div class="stat-value" v-if="!loading">{{ totalSections }}</div>
            <div class="stat-value loading" v-else><i class="fas fa-spinner fa-spin"></i></div>
          </div>
        </div>
      </div>

      <!-- Total Subjects Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-book"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">My Subjects</h3>
            <div class="stat-value" v-if="!loading">{{ totalSubjects }}</div>
            <div class="stat-value loading" v-else><i class="fas fa-spinner fa-spin"></i></div>
          </div>
        </div>
      </div>

      <!-- Average Score Card -->
      <div class="col-md-3">
        <div class="dashboard-card">
          <div class="icon-container">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-info">
            <h3 class="stat-title">Class Average</h3>
            <div class="stat-value" v-if="!loading && hasPerformanceData">{{ averageScore }}%</div>
            <div class="stat-value loading" v-else-if="loading"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="no-data" v-else>No data available</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row mb-4">
      <!-- Attendance Distribution Chart (previously Performance Distribution) -->
      <div class="col-md-6 mb-4">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">
              <i class="fas fa-calendar-check me-2"></i>
              Attendance Distribution
            </h5>
            <p class="chart-description">Breakdown of student attendance patterns</p>
            <div class="chart-container">
              <div v-if="loading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
              <canvas ref="performanceChart"></canvas>
              <p v-if="!hasAttendanceData && !loading" class="no-data-message">No attendance data available</p>
            </div>
            <div class="text-end mt-3">
              <button @click="openGenerateModal('attendance')" class="btn btn-sm btn-outline-success" :disabled="!hasAttendanceData || loading">
                <i class="fas fa-download me-1"></i> Generate
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Assessment Type Distribution -->
      <div class="col-md-6 mb-4">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">
              <i class="fas fa-tasks me-2"></i>
              Assessment Performance Analysis
            </h5>
            <p class="chart-description">Average scores by assessment type</p>
            <div class="chart-container">
              <div v-if="loading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
              <canvas ref="assessmentTypeChart"></canvas>
              <p v-if="!hasAssessmentData && !loading" class="no-data-message">No assessment data available</p>
            </div>
            <div class="text-end mt-3">
              <button @click="openGenerateModal('assessmentType')" class="btn btn-sm btn-outline-success" :disabled="!hasAssessmentData || loading">
                <i class="fas fa-download me-1"></i> Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Trend Chart -->
      <div class="col-md-6 mb-4">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">
              <i class="fas fa-chart-line me-2"></i>
              Performance Trends Over Time
            </h5>
            <p class="chart-description">Class average scores across recent assessments</p>
            <div class="chart-container">
              <div v-if="loading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
              <canvas ref="performanceTrendChart"></canvas>
              <p v-if="!hasPerformanceData && !loading" class="no-data-message">No performance data available</p>
            </div>
            <div class="text-end mt-3">
              <button @click="openGenerateModal('performanceTrend')" class="btn btn-sm btn-outline-success" :disabled="!hasPerformanceData || loading">
                <i class="fas fa-download me-1"></i> Generate
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Assessment Type Performance -->
      <div class="col-md-6 mb-4">
        <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">
              <i class="fas fa-graduation-cap me-2"></i>
              Performance by Assessment Type
            </h5>
            <p class="chart-description">Visualizes how students perform across different assessment types</p>
            <div class="chart-container">
              <div v-if="loading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
              <canvas ref="assessmentTypePerformanceChart"></canvas>
              <p v-if="!hasPerformanceData && !loading" class="no-data-message">No performance data available</p>
            </div>
            <div class="text-end mt-3">
              <button @click="openGenerateModal('assessmentTypePerformance')" class="btn btn-sm btn-outline-success" :disabled="!hasPerformanceData || loading">
                <i class="fas fa-download me-1"></i> Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Recent Activity</h5>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="3" class="text-center">
                  <i class="fas fa-spinner fa-spin me-2"></i>Loading activities...
                </td>
              </tr>
              <tr v-else-if="!hasActivity">
                <td colspan="3" class="text-center">No recent activity</td>
              </tr>
              <tr v-else v-for="activity in recentActivities" :key="activity.id">
                <td>{{ formatDate(activity.date) }}</td>
                <td>{{ activity.type }}</td>
                <td>{{ activity.details }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Report Generation Modal -->
  <div class="modal fade" id="generateReportModal" tabindex="-1" aria-labelledby="generateReportModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="generateReportModalLabel">Generate Report</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label">File Format</label>
            <select class="form-select" v-model="reportFormat">
              <option value="excel">Excel (.xlsx)</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Date Range</label>
            <div class="d-flex gap-2">
              <div class="flex-grow-1">
                <label class="small text-muted">From</label>
                <input 
                  type="date" 
                  class="form-control form-control-sm" 
                  v-model="reportStartDate"
                  :max="reportEndDate || today"
                >
              </div>
              <div class="flex-grow-1">
                <label class="small text-muted">To</label>
                <input 
                  type="date" 
                  class="form-control form-control-sm" 
                  v-model="reportEndDate"
                  :min="reportStartDate"
                  :max="today"
                >
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="generateReport" 
            :disabled="!reportStartDate || !reportEndDate"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'
import moment from 'moment'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { Modal } from 'bootstrap'

export default {
  name: 'TeacherDashboard',
  setup() {
    const store = useStore()
    const performanceChart = ref(null)
    const attendanceChart = ref(null)
    const assessmentTypeChart = ref(null)
    const performanceTrendChart = ref(null)
    const assessmentTypePerformanceChart = ref(null)

    // Data refs
    const totalStudents = ref(0)
    const totalSections = ref(0)
    const totalSubjects = ref(0)
    const averageScore = ref(0)
    const recentActivities = ref([])
    const sections = ref([])
    const subjects = ref([])
    
    // Filter refs
    const selectedYear = ref(localStorage.getItem('selectedYear') || '')
    const selectedSection = ref(localStorage.getItem('selectedSection') || '')
    const selectedSubject = ref(localStorage.getItem('selectedSubject') || '')
    const selectedStartDate = ref('')
    const selectedEndDate = ref('')
    const today = computed(() => moment().format('YYYY-MM-DD'))

    // Chart raw data for export
    const chartData = ref({
      attendance: [],
      assessmentType: [],
      performanceTrend: [],
      assessmentTypePerformance: []
    });

    // We'll maintain available years that come from the API
    const availableYears = ref([]);

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
    const hasAttendanceData = computed(() => {
      try {
      if (data.value && data.value.attendanceDistribution) {
          // Check if we have an array and if any value is > 0
          const distribution = data.value.attendanceDistribution;
          if (Array.isArray(distribution) && distribution.length > 0) {
            return distribution.some(val => {
              const numVal = Number(val);
              return !isNaN(numVal) && numVal > 0;
            });
          }
        }
        
        // Also check chartData as a fallback
        if (chartData.value && chartData.value.attendance) {
          const attendance = chartData.value.attendance;
          return !!(
            (Number(attendance.present) > 0) || 
            (Number(attendance.late) > 0) || 
            (Number(attendance.absent) > 0)
          );
        }
        
      return false;
      } catch (err) {
        console.error('Error in hasAttendanceData:', err);
        return false;
      }
    });

    const hasPerformanceData = computed(() => {
      // Check if we have any assessment or performance data
      if (data.value) {
        // Check for averageScore > 0
        if (typeof data.value.averageScore === 'number' && data.value.averageScore > 0) {
          return true;
        }
        
        // Check for performance trends
        if (Array.isArray(data.value.performanceTrends) && data.value.performanceTrends.length > 0) {
          return true;
        }
        
        // Check for assessment types with data
        if (data.value.assessmentTypes) {
          const assessmentTypes = Object.values(data.value.assessmentTypes);
          return assessmentTypes.some(type => type.count > 0);
        }
      }
      return false;
    });

    const hasAssessmentData = computed(() => {
      if (data.value) {
        // Check directly in assessmentTypes
        if (data.value.assessmentTypes) {
          const assessmentTypes = Object.values(data.value.assessmentTypes);
          return assessmentTypes.some(type => type.count > 0);
        }
        
        // Fallback to assessmentTypeDistribution
        if (data.value.assessmentTypeDistribution) {
          return true;
        }
      }
      return false;
    });

    const hasActivity = computed(() => recentActivities.value.length > 0)

    // Store all dashboard data in a ref for easier access
    const data = ref({
      attendanceDistribution: [0, 0, 0],
      assessmentTypes: {},
      performanceTrends: []
    });

    // In setup function, add loading state
    const loading = ref(false);

    const userName = computed(() => {
      const user = store.state.auth.user;
      return user ? user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Teacher' : 'Teacher';
    });

    const fetchTeacherSectionsAndSubjects = async (year = '') => {
      try {
        const teacherId = getTeacherId()
        if (!teacherId) return

        const token = store.state.auth.token
        console.log('Fetching sections and subjects for:', { teacherId, year })

        // First get all class records to extract sections and years
        const recordsResponse = await axios.get('http://localhost:8000/api/teacher-class-records', {
          params: { 
            teacherId
          },
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (recordsResponse.data && Array.isArray(recordsResponse.data)) {
          // Extract unique years, sections and subjects
          const uniqueYears = [...new Set(recordsResponse.data.map(record => record.year))].filter(Boolean);
          console.log('All unique years found:', uniqueYears);
          
          // Save available years
          availableYears.value = uniqueYears.sort();
          
          // Filter sections and subjects based on year if provided
          if (year) {
            const filteredRecords = recordsResponse.data.filter(record => record.year === year);
            sections.value = [...new Set(filteredRecords.map(record => record.section))].filter(Boolean).sort();
            subjects.value = [...new Set(filteredRecords.map(record => record.subject))].filter(Boolean).sort();
          } else {
            const uniqueSections = [...new Set(recordsResponse.data.map(record => record.section))].filter(Boolean);
            const uniqueSubjects = [...new Set(recordsResponse.data.map(record => record.subject))].filter(Boolean);
            sections.value = uniqueSections.sort();
            subjects.value = uniqueSubjects.sort();
          }
          
          // If no selectedYear but we have years
          if (!selectedYear.value && uniqueYears.length > 0) {
            selectedYear.value = uniqueYears[0];
            
            // Also update sections and subjects for this year
            const filteredRecords = recordsResponse.data.filter(record => record.year === uniqueYears[0]);
            sections.value = [...new Set(filteredRecords.map(record => record.section))].filter(Boolean).sort();
            subjects.value = [...new Set(filteredRecords.map(record => record.subject))].filter(Boolean).sort();
          }
          
          console.log('Loaded sections and subjects:', {
            availableYears: availableYears.value,
            sections: sections.value,
            subjects: subjects.value
          });
        } else {
          console.warn('No class records found or unexpected response format');
          // Reset all filters and arrays
          availableYears.value = [];
          sections.value = [];
          subjects.value = [];
        }
      } catch (error) {
        console.error('Error fetching teacher sections and subjects:', error)
        sections.value = []
        subjects.value = []
      }
    }

    const handleYearChange = async () => {
      // Reset section and subject when year changes
      selectedSection.value = '';
      selectedSubject.value = '';
      
      // If a year is selected, fetch sections and subjects for that year
      if (selectedYear.value) {
        await fetchTeacherSectionsAndSubjects(selectedYear.value);
      } else {
        // If no year selected, get all available sections and subjects
        await fetchTeacherSectionsAndSubjects();
      }
      
      // Update dashboard data with new year selection
      await fetchDashboardData();
    }

    const getFilterDisplay = () => {
      const filters = []
      if (selectedYear.value) filters.push(selectedYear.value + ' Year')
      if (selectedSection.value) filters.push(selectedSection.value)
      if (selectedSubject.value) filters.push(selectedSubject.value)
      return filters.length > 0 ? filters.join(' - ') : 'Filter View'
    }

    // Initialize empty data for charts when no data is available
    const initEmptyCharts = () => {
      updatePerformanceChart({
        attendanceDistribution: [0, 0, 0]
      });
      
      updateAssessmentTypeChart({
        assessmentData: []
      });
      
      updatePerformanceTrendChart([]);
      
      updateAssessmentTypePerformanceChart({
        performanceTrends: []
      });
    };

    // Function to fetch data for a specific chart
    const fetchChartData = async (chartType) => {
      try {
        const teacherId = getTeacherId();
        if (!teacherId) return;
        
        // Prepare query parameters with URLSearchParams to ensure proper encoding
        const params = new URLSearchParams();
        params.append('teacherId', teacherId);
        
        // Add filters if selected
        if (selectedYear.value) params.append('year', selectedYear.value);
        if (selectedSection.value) params.append('section', selectedSection.value);
        if (selectedSubject.value) params.append('subject', selectedSubject.value);
        if (selectedStartDate.value) params.append('startDate', selectedStartDate.value);
        if (selectedEndDate.value) params.append('endDate', selectedEndDate.value);
        
        console.log(`Fetching ${chartType} data with params:`, Object.fromEntries(params));
        
        let endpoint;
        let url;
        
        switch (chartType) {
          case 'attendance':
            endpoint = 'attendance/stats';
            break;
          case 'assessmentType':
          case 'performanceTrend':
          case 'assessmentTypePerformance':
            endpoint = 'assessments/stats';
            break;
          default:
            throw new Error(`Unknown chart type: ${chartType}`);
        }
        
        url = `http://localhost:8000/api/${endpoint}?${params.toString()}`;
        console.log(`Requesting URL: ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });
        
        console.log(`${chartType} data received:`, response.data);
        
        // Store raw data for export
        chartData.value[chartType] = response.data;
        
        // Update the specific chart
        switch (chartType) {
          case 'attendance':
            if (response.data) {
              // Format the attendance data for our chart
              const attendanceStats = response.data;
              
              // Ensure we have numbers for the chart
              const present = parseInt(attendanceStats.present) || 0;
              const late = parseInt(attendanceStats.late) || 0;
              const absent = parseInt(attendanceStats.absent) || 0;
              
              console.log('Attendance stats for chart:', { present, late, absent });
              
              const formattedData = {
                attendanceDistribution: [present, late, absent]
              };
              
              // Update the attendance data in our main data store too
              if (data.value) {
                data.value.attendanceDistribution = formattedData.attendanceDistribution;
              }
              
              updatePerformanceChart(formattedData);
            }
            break;
          case 'assessmentType':
            if (response.data && response.data.assessmentTypes) {
              const assessmentData = [];
              
              Object.keys(response.data.assessmentTypes).forEach(type => {
                const typeData = response.data.assessmentTypes[type];
                if (typeData) {
                  let avgScore = 0;
                  if (typeData.scoreCount && typeData.scoreCount > 0) {
                    avgScore = (typeData.totalScore / typeData.scoreCount).toFixed(1);
                  }
                  
                  assessmentData.push({
                    type: type,
                    averageScore: avgScore,
                    count: typeData.count || 0
                  });
                }
              });
              
              updateAssessmentTypeChart({ assessmentData });
            }
            break;
          case 'performanceTrend':
            if (response.data) {
              // Create performance trends data
              const performanceTrends = Array.isArray(response.data) ? response.data
                .filter(a => a.date) // Only include assessments with dates
                .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date
                .map(assessment => {
                  // Calculate average score for this assessment
                  let averageScore = 0;
                  let scoreArray = [];
                  
                  if (assessment.scores) {
                    if (Array.isArray(assessment.scores)) {
                      scoreArray = assessment.scores;
                    } else if (typeof assessment.scores === 'object') {
                      scoreArray = Object.values(assessment.scores);
                    }
                    
                    const validScores = scoreArray.filter(score => typeof score === 'number');
                    if (validScores.length > 0) {
                      const totalScore = validScores.reduce((sum, score) => sum + score, 0);
                      averageScore = totalScore / validScores.length;
                    }
                  }
                  
                  return {
                    date: assessment.date,
                    score: averageScore,
                    name: assessment.name || assessment.title || assessment.type,
                    type: assessment.type
                  };
                }) : [];
              
              updatePerformanceTrendChart(performanceTrends);
            }
            break;
          case 'assessmentTypePerformance':
            if (response.data) {
              // Create performance trends data for assessment type performance
              const performanceTrends = Array.isArray(response.data) ? response.data
                .filter(a => a.date) // Only include assessments with dates
                .map(assessment => ({
                  date: assessment.date,
                  score: assessment.averageScore || 0,
                  name: assessment.name || assessment.title || assessment.type,
                  type: assessment.type
                })) : [];
              
              updateAssessmentTypePerformanceChart({
                performanceTrends
              });
            }
            break;
        }
      } catch (error) {
        console.error(`Error fetching ${chartType} data:`, error);
        // If the chart type is attendance, ensure we update with empty data
        if (chartType === 'attendance') {
          updatePerformanceChart({
            attendanceDistribution: [0, 0, 0]
          });
        }
      }
    };
    
    // Function to generate and download chart data
    const generateChartData = async (chartType) => {
      try {
        console.log(`Generating Excel for ${chartType} chart`);
        
        // Get raw data for the chart
        let dataToExport = [];
        let fileName = '';
        
        switch (chartType) {
          case 'attendance':
            fileName = `attendance_data_${moment().format('YYYY-MM-DD')}`;
            
            // Improved attendance data extraction with explicit type conversion
            let present = 0, late = 0, absent = 0;
            
            // Try multiple data sources
            if (chartData.value[chartType]) {
              present = Number(chartData.value[chartType].present || 0);
              late = Number(chartData.value[chartType].late || 0);
              absent = Number(chartData.value[chartType].absent || 0);
            } else if (data.value?.attendanceDistribution && Array.isArray(data.value.attendanceDistribution)) {
              present = Number(data.value.attendanceDistribution[0] || 0);
              late = Number(data.value.attendanceDistribution[1] || 0);
              absent = Number(data.value.attendanceDistribution[2] || 0);
            }
            
            console.log('Attendance data for export (processed):', { present, late, absent });
            
            // Create export data with explicit typing
            dataToExport = [
              {
                'Status': 'Present',
                'Count': present
              },
              {
                'Status': 'Late',
                'Count': late
              },
              {
                'Status': 'Absent',
                'Count': absent
              }
            ];
            break;
            
          case 'assessmentType':
            fileName = `assessment_types_${moment().format('YYYY-MM-DD')}`;
            
            // Format assessment type data for export - improve data extraction
            if (chartData.value[chartType]?.assessmentTypes) {
              // Use chartData instead of data
              const assessmentTypes = chartData.value[chartType].assessmentTypes;
              Object.keys(assessmentTypes).forEach(type => {
                const typeData = assessmentTypes[type];
                if (typeData) {
                  const avgScore = typeData.averageScore || 
                                  (typeData.scoreCount > 0 ? 
                                    (typeData.totalScore / typeData.scoreCount).toFixed(1) : 0);
                            
                  dataToExport.push({
                    'Assessment Type': type,
                    'Average Score': avgScore,
                    'Count': typeData.count || 0
                  });
                }
              });
            } else if (data.value?.assessmentTypes) {
              // Fallback to data.value if needed
              Object.keys(data.value.assessmentTypes).forEach(type => {
                const typeData = data.value.assessmentTypes[type];
                if (typeData) {
                  let avgScore = 0;
                  if (typeData.scoreCount && typeData.scoreCount > 0) {
                    avgScore = (typeData.totalScore / typeData.scoreCount).toFixed(1);
                  } else if (typeData.averageScore) {
                    avgScore = typeData.averageScore;
                  }
                  
                  dataToExport.push({
                    'Assessment Type': type,
                    'Average Score': avgScore,
                    'Count': typeData.count || 0
                  });
                }
              });
            }
            
            // If still no data, look at chart data directly
            if (dataToExport.length === 0) {
              try {
                const chart = Chart.getChart(assessmentTypeChart.value);
                if (chart && chart.data?.datasets?.[0]?.data) {
                  const labels = chart.data.labels || [];
                  const scores = chart.data.datasets[0].data || [];
                  
                  labels.forEach((type, index) => {
                    if (type && scores[index] !== undefined) {
                      dataToExport.push({
                        'Assessment Type': type,
                        'Average Score': scores[index] || 0,
                        'Count': 'N/A' // We don't have this information from the chart
                      });
                    }
                  });
                }
              } catch (chartErr) {
                console.error('Error extracting chart data:', chartErr);
              }
            }
            break;
            
          case 'performanceTrend':
            fileName = `performance_trends_${moment().format('YYYY-MM-DD')}`;
            
            // Format performance trend data for export - improve data extraction
            if (Array.isArray(chartData.value[chartType])) {
              // Use raw assessment data
              dataToExport = chartData.value[chartType]
                .filter(assessment => assessment.date)
                .map(assessment => ({
                  'Date': moment(assessment.date).format('YYYY-MM-DD'),
                  'Assessment': assessment.name || assessment.title || '',
                  'Type': assessment.type || '',
                  'Average Score': assessment.averageScore || assessment.score || 0
                }));
            } else if (data.value?.performanceTrends) {
              // Fallback to data.value
              dataToExport = data.value.performanceTrends.map(trend => ({
                'Date': moment(trend.date).format('YYYY-MM-DD'),
                'Assessment': trend.name || trend.title || '',
                'Average Score': trend.score || trend.averageScore || 0
              }));
            }
            
            // If still no data, extract from chart
            if (dataToExport.length === 0) {
              try {
                const chart = Chart.getChart(performanceTrendChart.value);
                if (chart && chart.data?.datasets?.[0]?.data) {
                  const labels = chart.data.labels || [];
                  const scores = chart.data.datasets[0].data || [];
                  
                  labels.forEach((date, index) => {
                    if (date && scores[index] !== undefined) {
                      dataToExport.push({
                        'Date': date,
                        'Assessment': 'Assessment ' + (index + 1),
                        'Average Score': scores[index] || 0
                      });
                    }
                  });
                }
              } catch (chartErr) {
                console.error('Error extracting chart data:', chartErr);
              }
            }
            break;
            
          case 'assessmentTypePerformance':
            fileName = `assessment_performance_${moment().format('YYYY-MM-DD')}`;
            
            // Format assessment type performance data for export - improve data extraction
            if (Array.isArray(chartData.value[chartType])) {
              // Use chartData's raw assessment data
              dataToExport = chartData.value[chartType]
                .filter(assessment => assessment.date && assessment.type)
                .map(assessment => ({
                  'Date': moment(assessment.date).format('YYYY-MM-DD'),
                  'Assessment Type': assessment.type || '',
                  'Assessment Name': assessment.name || assessment.title || '',
                  'Average Score': assessment.averageScore || assessment.score || 0
                }));
            } else if (data.value?.performanceTrends) {
              // Fallback to data.value
              dataToExport = data.value.performanceTrends
                .filter(trend => trend.type)
                .map(trend => ({
                  'Date': moment(trend.date).format('YYYY-MM-DD'),
                  'Assessment Type': trend.type || '',
                  'Assessment Name': trend.name || trend.title || '',
                  'Average Score': trend.score || trend.averageScore || 0
                }));
            }
            
            // If still no data, extract from chart
            if (dataToExport.length === 0) {
              try {
                const chart = Chart.getChart(assessmentTypePerformanceChart.value);
                if (chart && chart.data?.datasets) {
                  const labels = chart.data.labels || [];
                  const datasets = chart.data.datasets || [];
                  
                  datasets.forEach(dataset => {
                    const type = dataset.label || 'Unknown';
                    const data = dataset.data || [];
                    
                    labels.forEach((date, index) => {
                      if (date && data[index] !== null && data[index] !== undefined) {
                        dataToExport.push({
                          'Date': date,
                          'Assessment Type': type,
                          'Assessment Name': 'Assessment ' + (index + 1),
                          'Average Score': data[index] || 0
                        });
                      }
                    });
                  });
                }
              } catch (chartErr) {
                console.error('Error extracting chart data:', chartErr);
              }
            }
            break;
            
          default:
            throw new Error(`Unknown chart type: ${chartType}`);
        }
        
        // Check if we have data to export
        if (dataToExport.length === 0) {
          console.warn(`No data to export for ${chartType}`);
          alert('No data available to generate report');
          return;
        }
        
        // Log the exact structure of data being exported
        console.log('Data being exported:', JSON.stringify(dataToExport));
        
        // Create and download Excel file only
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const excelData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(excelData, `${fileName}.xlsx`);
        
        console.log(`Data export completed for ${chartType}`);
      } catch (error) {
        console.error(`Error generating ${chartType} data:`, error);
        alert(`Error generating report: ${error.message || 'Unknown error'}`);
      }
    };

    // Enhanced fetchDashboardData function
    const fetchDashboardData = async () => {
      try {
        loading.value = true;
        const teacherId = store.state.auth.user._id;
        
        if (!teacherId) {
          console.error('Teacher ID not available');
          loading.value = false;
          return;
        }
        
        // Prepare query parameters with URLSearchParams for consistency
        const params = new URLSearchParams();
        
        if (selectedYear.value) params.append('year', selectedYear.value);
        if (selectedSection.value) params.append('section', selectedSection.value);
        if (selectedSubject.value) params.append('subject', selectedSubject.value);
        if (selectedStartDate.value) params.append('startDate', selectedStartDate.value);
        if (selectedEndDate.value) params.append('endDate', selectedEndDate.value);
        
        console.log('Fetching dashboard data with params:', Object.fromEntries(params));
        
        // Fetch dashboard stats
        const url = `http://localhost:8000/api/dashboard/teacher/${teacherId}/stats?${params.toString()}`;
        console.log('Requesting URL:', url);
        
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });
        
        console.log('Dashboard data received:', response.data);
        
        // Store complete data for reference
        data.value = response.data;
        
        // Check if we received any meaningful data (indicating valid filters)
        const hasValidData = 
          (response.data.totalStudents > 0) || 
          (response.data.totalSections > 0) || 
          (Array.isArray(response.data.attendanceDistribution) && response.data.attendanceDistribution.some(val => val > 0)) ||
          (Array.isArray(response.data.performanceTrends) && response.data.performanceTrends.length > 0);
        
        // If no valid data, it means the filter combination doesn't match any records
        if (!hasValidData && (selectedYear.value || selectedSection.value || selectedSubject.value)) {
          console.warn('No data found for the selected filters');
        }
        
        // Update stats - only when we have valid data or no filters applied
        totalStudents.value = response.data.totalStudents || 0;
        totalSections.value = response.data.totalSections || 0;
        totalSubjects.value = response.data.totalSubjects || 0;
        
        // Debug the class average score from API response
        console.log('Average score from API:', response.data.averageScore);
        console.log('Average score type:', typeof response.data.averageScore);
        
        // Update class average score from the response
        if (response.data.hasOwnProperty('averageScore')) {
          const scoreValue = parseFloat(response.data.averageScore);
          console.log('Parsed score value:', scoreValue);
          averageScore.value = isNaN(scoreValue) ? '0.0' : scoreValue.toFixed(1);
          console.log('Final average score value:', averageScore.value);
        } else {
          averageScore.value = '0.0';
        }
        
        // Update activities
        recentActivities.value = response.data.recentActivities || [];
        
        // ALWAYS fetch attendance data separately to ensure we have the latest
        await fetchAttendanceData();
        
        // Fetch assessment data separately
        await fetchAssessmentData();
        
        // After updating the charts, apply the default filter (month) to each chart
        // This ensures the charts' data is consistent with the filter state
        const endDate = moment().format('YYYY-MM-DD');
        const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
        
        await Promise.all([
          fetchChartData('attendance', startDate, endDate),
          fetchChartData('assessmentType', startDate, endDate),
          fetchChartData('performanceTrend', startDate, endDate),
          fetchChartData('assessmentTypePerformance', startDate, endDate)
        ]);

        loading.value = false;
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Initialize charts with empty data
        initEmptyCharts();
        loading.value = false;
      }
    };

    // Add a dedicated function to fetch attendance data
    const fetchAttendanceData = async () => {
      try {
        const teacherId = getTeacherId();
        if (!teacherId) return;
        
        // Prepare attendance parameters
        const params = new URLSearchParams();
        params.append('teacherId', teacherId);
        
        // Add date range - default to last 30 days if not specified
        params.append('startDate', selectedStartDate.value || moment().subtract(30, 'days').format('YYYY-MM-DD'));
        params.append('endDate', selectedEndDate.value || moment().format('YYYY-MM-DD'));
        
        // Add filters if selected
        if (selectedYear.value) params.append('year', selectedYear.value);
        if (selectedSection.value) params.append('section', selectedSection.value);
        if (selectedSubject.value) params.append('subject', selectedSubject.value);
        
        console.log('Fetching attendance data with params:', Object.fromEntries(params));
        const url = `http://localhost:8000/api/attendance/stats?${params.toString()}`;
        console.log('Requesting URL:', url);
        
        const response = await axios.get(url, {
              headers: {
                'Authorization': `Bearer ${store.state.auth.token}`
              }
            });
            
        console.log('Attendance data received:', response.data);
        
        if (response.data) {
          // Store in chartData for export
          chartData.value.attendance = response.data;
          
          // Parse attendance counts
          const present = parseInt(response.data.present) || 0;
          const late = parseInt(response.data.late) || 0;
          const absent = parseInt(response.data.absent) || 0;
          
          // Update main data store
          if (data.value) {
            data.value.attendanceDistribution = [present, late, absent];
          }
          
          // Update attendance chart
            updatePerformanceChart({
            attendanceDistribution: [present, late, absent]
          });
          
          console.log('Attendance distribution updated:', [present, late, absent]);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        
        // Initialize with empty data on error
        if (data.value) {
          data.value.attendanceDistribution = [0, 0, 0];
        }
        
        updatePerformanceChart({
          attendanceDistribution: [0, 0, 0]
        });
        
        return false;
      }
    };

    const updatePerformanceChart = (data) => {
      if (!performanceChart.value) return;
      
      const ctx = performanceChart.value.getContext('2d');
      if (!ctx) return;

      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();

      // Process attendance distribution data
      // Expected data format: [present, late, absent]
      const attendanceData = Array.isArray(data.attendanceDistribution) 
        ? data.attendanceDistribution.slice(0, 3) 
        : [0, 0, 0];
      
      console.log('Attendance distribution data:', attendanceData);

      // Calculate total attendance records
      const totalAttendance = attendanceData.reduce((a, b) => a + (b || 0), 0);
      
      // Create attendance distribution chart
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Late', 'Absent'],
          datasets: [
            {
              data: attendanceData,
              backgroundColor: [
                'rgba(52, 211, 153, 0.8)',  // Green for present
                'rgba(251, 191, 36, 0.8)',  // Yellow for late
                'rgba(239, 68, 68, 0.8)',   // Red for absent
              ],
              borderColor: [
                'rgb(15, 140, 80)',         // Darker borders for contrast
                'rgb(220, 160, 20)',
                'rgb(220, 50, 50)',
              ],
              borderWidth: 1,
              hoverOffset: 15
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                padding: 20,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw || 0;
                  const total = attendanceData.reduce((a, b) => a + (b || 0), 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${value} (${percentage}%)`;
                }
              },
              titleFont: {
                weight: 'bold',
                size: 14
              },
              bodyFont: {
                size: 13
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8
            }
          },
          layout: {
            padding: {
              top: 10,
              right: 20,
              bottom: 10,
              left: 20
            }
          }
        }
      });
    };

    const updateAssessmentTypeChart = (data) => {
      if (!assessmentTypeChart.value) return;
      
      const ctx = assessmentTypeChart.value.getContext('2d');
      if (!ctx) return;

      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();

      // Process incoming data to restructure it
      const assessmentTypes = ['Quiz', 'Activity', 'Performance Task'];
      
      // Check if we have valid data
      if (!data.assessmentData || !Array.isArray(data.assessmentData) || data.assessmentData.length === 0) {
        // If no assessment data, just return without creating a chart
        // The "No data available" message will be shown by the template
        console.log('No assessment data available, skipping chart creation');
        return;
      }
      
        // Process actual data
      const processedData = {
        types: [],
        scores: [],
        counts: []
      };
      
      // Filter out assessment types with data
      const availableTypes = [...new Set(data.assessmentData.map(item => item.type))];
      
      // For each available type, get the score and count
      availableTypes.forEach(type => {
        const typeData = data.assessmentData.find(a => a.type === type);
        if (typeData) {
          processedData.types.push(type);
          processedData.scores.push(parseFloat(typeData.averageScore) || 0);
          processedData.counts.push(typeData.count || 0);
        }
      });
      
      console.log('Processed assessment chart data:', processedData);
      
      // Create a simple bar chart showing average scores
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: processedData.types,
          datasets: [
            {
              label: 'Average Score (%)',
              data: processedData.scores,
              backgroundColor: [
                'rgba(52, 211, 153, 0.8)',  // Green for Quiz
                'rgba(59, 130, 246, 0.8)',  // Blue for Activity
                'rgba(251, 191, 36, 0.8)',  // Yellow for Performance Task
              ].slice(0, processedData.types.length),
              borderColor: [
                'rgb(15, 140, 80)',
                'rgb(45, 110, 220)',
                'rgb(220, 160, 20)',
              ].slice(0, processedData.types.length),
              borderWidth: 1,
              borderRadius: 6,
              barPercentage: 0.6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              title: {
                display: true,
                text: 'Average Score (%)',
                font: {
                  size: 14,
                  weight: 'bold'
                }
              },
              ticks: {
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value}%`;
                },
                afterLabel: (context) => {
                  const type = processedData.types[context.dataIndex];
                  const count = processedData.counts[context.dataIndex] || 0;
                  return `Total ${type}s: ${count}`;
                }
              },
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              padding: 12
            }
          }
        }
      });
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

    const fetchAssessmentData = async () => {
      try {
        const teacherId = getTeacherId();
        if (!teacherId) return;
        
        // Prepare query parameters
        const params = {
          teacherId,
          year: selectedYear.value || '',
          section: selectedSection.value || '',
          subject: selectedSubject.value || ''
        };
        
        if (selectedStartDate.value) params.startDate = selectedStartDate.value;
        if (selectedEndDate.value) params.endDate = selectedEndDate.value;
        
        console.log('Fetching assessment data with params:', params);
        
        // Try the assessments/stats endpoint first
        try {
          const assessmentResponse = await axios.get('http://localhost:8000/api/assessments/stats', {
            params,
            headers: {
              'Authorization': `Bearer ${store.state.auth.token}`
            }
          });
          
          processAssessmentResponse(assessmentResponse.data);
        } catch (error) {
          // If the first endpoint fails, try the fallback endpoint
          console.log('Falling back to /assessments endpoint');
          const assessmentResponse = await axios.get('http://localhost:8000/api/assessments', {
            params,
            headers: {
              'Authorization': `Bearer ${store.state.auth.token}`
            }
          });
          
          processAssessmentResponse(assessmentResponse.data);
        }
      } catch (error) {
        console.error('Error fetching assessment data:', error);
        // Initialize assessment charts with empty data
        updateAssessmentTypeChart({ assessmentData: [] });
        updatePerformanceTrendChart([]);
        updateAssessmentTypePerformanceChart({
          performanceTrends: []
        });
      }
    };

    // Helper function to process assessment response data
    const processAssessmentResponse = (data) => {
      if (data) {
        console.log('Assessment data received:', data);
        
        // Update assessment type charts with this data
        if (data.assessmentTypes) {
          const assessmentData = [];
          
          Object.keys(data.assessmentTypes).forEach(type => {
            const typeData = data.assessmentTypes[type];
            if (typeData) {
              let avgScore = 0;
              if (typeData.scoreCount && typeData.scoreCount > 0) {
                avgScore = (typeData.totalScore / typeData.scoreCount).toFixed(1);
              }
              
              assessmentData.push({
                type: type,
                averageScore: avgScore,
                count: typeData.count || 0
              });
            }
          });
          
          updateAssessmentTypeChart({ assessmentData });
        } else if (Array.isArray(data)) {
          // If data is an array of assessments, process it into the format we need
          const assessmentTypes = {
            'Quiz': { count: 0, totalScore: 0, scoreCount: 0 },
            'Activity': { count: 0, totalScore: 0, scoreCount: 0 },
            'Performance Task': { count: 0, totalScore: 0, scoreCount: 0 }
          };
          
          // Process raw assessment data
          data.forEach(assessment => {
            const type = assessment.type || 'Other';
            if (assessmentTypes[type]) {
              assessmentTypes[type].count++;
              
              // Process scores if available
              if (assessment.scores) {
                // Handle both array and object formats
                let scoreArray = [];
                if (Array.isArray(assessment.scores)) {
                  scoreArray = assessment.scores;
                } else if (typeof assessment.scores === 'object') {
                  scoreArray = Object.values(assessment.scores);
                }
                
                scoreArray.forEach(score => {
                  if (typeof score === 'number') {
                    assessmentTypes[type].totalScore += score;
                    assessmentTypes[type].scoreCount++;
                  }
                });
              }
            }
          });
          
          // Convert to format for chart
          const assessmentData = Object.keys(assessmentTypes).map(type => {
            const typeData = assessmentTypes[type];
            const averageScore = typeData.scoreCount > 0 
              ? (typeData.totalScore / typeData.scoreCount).toFixed(1) 
              : 0;
            
            return {
              type,
              averageScore,
              count: typeData.count
            };
          });
          
          updateAssessmentTypeChart({ assessmentData });
          
          // Create performance trends data
          const performanceTrends = data
            .filter(a => a.date) // Only include assessments with dates
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date
            .map(assessment => {
              // Calculate average score for this assessment
              let averageScore = 0;
              let scoreArray = [];
              
              if (assessment.scores) {
                if (Array.isArray(assessment.scores)) {
                  scoreArray = assessment.scores;
                } else if (typeof assessment.scores === 'object') {
                  scoreArray = Object.values(assessment.scores);
                }
                
                const validScores = scoreArray.filter(score => typeof score === 'number');
                if (validScores.length > 0) {
                  const totalScore = validScores.reduce((sum, score) => sum + score, 0);
                  averageScore = totalScore / validScores.length;
                }
              }
              
              return {
                date: assessment.date,
                score: averageScore,
                name: assessment.name || assessment.title || assessment.type,
                type: assessment.type
              };
            });
          
          updatePerformanceTrendChart(performanceTrends);
          updateAssessmentTypePerformanceChart({
            performanceTrends
          });
        }
      }
    };

    // Add new refs for report generation
    const reportFormat = ref('excel')
    const reportStartDate = ref('')
    const reportEndDate = ref('')
    const currentChartType = ref('')
    let generateModal = null

    const openGenerateModal = (chartType) => {
      currentChartType.value = chartType
      reportStartDate.value = selectedStartDate.value || moment().subtract(30, 'days').format('YYYY-MM-DD')
      reportEndDate.value = selectedEndDate.value || moment().format('YYYY-MM-DD')
      
      if (!generateModal) {
        generateModal = new Modal(document.getElementById('generateReportModal'))
      }
      generateModal.show()
    }

    const generateReport = async () => {
      try {
        // Close the modal
        if (generateModal) {
          generateModal.hide()
        }

        // Store current filter dates
        const currentStartDate = selectedStartDate.value
        const currentEndDate = selectedEndDate.value

        // Temporarily set the filter dates to the report dates
        selectedStartDate.value = reportStartDate.value
        selectedEndDate.value = reportEndDate.value

        // Generate the report with the specified date range
        await generateChartData(currentChartType.value)

        // Restore original filter dates
        selectedStartDate.value = currentStartDate
        selectedEndDate.value = currentEndDate

        // Refresh the dashboard data with original dates
        if (currentStartDate && currentEndDate) {
          await fetchDashboardData()
        }
      } catch (error) {
        console.error('Error generating report:', error)
        alert('Error generating report. Please try again.')
      }
    }

    onMounted(async () => {
      if (store.state.auth.user?._id && store.state.auth.token) {
        console.log('Component mounted, initializing...');
        
        // Wait for the next tick to ensure DOM elements are rendered
        await nextTick();
        
        try {
          // Initialize empty charts first
          console.log('Initializing empty charts...');
          
          initEmptyCharts();
          
          console.log('Empty charts initialized');
          
          // Fetch sections and subjects
          await fetchTeacherSectionsAndSubjects(selectedYear.value);
          console.log('Sections and subjects fetched');
          
          // Fetch actual dashboard data
          await fetchDashboardData();
          console.log('Initial data fetch completed');
        } catch (error) {
          console.error('Error during initialization:', error);
        }
      } else {
        console.error('No user ID or token found');
      }
    })

    return {
      totalStudents,
      totalSections,
      totalSubjects,
      averageScore,
      performanceChart,
      recentActivities,
      sections,
      subjects,
      selectedYear,
      selectedSection,
      selectedSubject,
      hasAttendanceData,
      hasPerformanceData,
      hasAssessmentData,
      hasActivity,
      formatDate,
      getFilterDisplay,
      handleYearChange,
      applyFilters,
      assessmentTypeChart,
      performanceTrendChart,
      assessmentTypePerformanceChart,
      selectedStartDate,
      selectedEndDate,
      today,
      loading,
      availableYears,
      userName,
      generateChartData,
      reportFormat,
      reportStartDate,
      reportEndDate,
      openGenerateModal,
      generateReport
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Chart Filters */
.chart-filters {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.75rem;
}

.date-filter-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.date-filter-group .btn {
  border-radius: 0;
  font-size: 0.8rem;
  padding: 0.3rem 0.75rem;
  border: 1px solid #e2e8f0;
  color: #64748b;
  background-color: white;
  transition: all 0.2s ease;
}

.date-filter-group .btn:first-child {
  border-radius: 8px 0 0 8px;
}

.date-filter-group .btn:last-child {
  border-radius: 0 8px 8px 0;
}

.date-filter-group .btn.btn-primary {
  background-color: #003366;
  color: white;
  border-color: #003366;
}

.date-filter-group .btn.btn-outline-primary:hover {
  background-color: #f8fafc;
  color: #003366;
  border-color: #003366;
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

.stat-value.loading {
  color: #94a3b8;
  font-size: 1.5rem;
}

.no-data {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.875rem;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
  margin-bottom: 1rem;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
  border-radius: 8px;
}

.loading-overlay i {
  font-size: 2rem;
  color: #003366;
  margin-bottom: 1rem;
}

.loading-overlay p {
  font-size: 0.9rem;
  color: #64748b;
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
  margin-bottom: 0.5rem;
  letter-spacing: -0.3px;
}

.chart-description {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 1.25rem;
  font-style: italic;
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

/* Filter and Form Styles */
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

/* Add modal styles */
.modal-content {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  border-bottom: 1px solid #e2e8f0;
  padding: 1.25rem;
}

.modal-title {
  font-weight: 700;
  color: #003366;
}

.modal-body {
  padding: 1.25rem;
}

.modal-footer {
  border-top: 1px solid #e2e8f0;
  padding: 1.25rem;
}

.btn-close:focus {
  box-shadow: none;
}
</style> 