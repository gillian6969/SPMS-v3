<template>
  <div class="dashboard" ref="dashboardContainer">
    <!-- Greeting Section -->
    <div class="greeting-section mb-4">
      <h2 class="greeting">Welcome, Dean {{ userName }}</h2>
      <p class="greeting-subtitle">Computer and Information Technology Department Dashboard</p>
    </div>
    
    <div class="d-flex justify-content-between align-items-center mb-4">
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
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }} Year</option>
          </select>
        </div>
          <div class="mb-3">
            <label class="form-label">Section</label>
            <select class="form-select mb-2" v-model="selectedSection" @change="handleSectionChange" :disabled="!selectedYear">
              <option value="">All Sections</option>
              <option v-for="section in sections" :key="section.id" :value="section.name">
                {{ section.name }}{{ section.teacherName ? ` - ${section.teacherName}` : '' }}
              </option>
            </select>
          </div>
          <div class="d-flex justify-content-between">
            <button class="btn btn-outline-secondary" @click="clearFilters">Clear Filters</button>
            <button class="btn btn-primary" @click="refreshDashboard">Apply</button>
          </div>
        </div>
      </div>
      
      <div class="d-flex gap-2 align-items-center">
        <!-- Export Dropdown -->
        <button class="btn btn-outline-primary" type="button" data-bs-toggle="modal" data-bs-target="#exportGraphsModal">
          <i class="fas fa-file-export me-2"></i>
          Export Graphs
        </button>
        
        <!-- Last Updated -->
        <div class="last-update-badge" v-if="lastUpdate">
          Last updated: {{ formatDate(lastUpdate) }}
          <button class="btn btn-refresh ms-2" @click="refreshDashboard" title="Refresh Dashboard">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row g-4 mb-4">
      <!-- Total Students Card -->
      <div class="col-md-4">
        <div class="dashboard-card">
          <div class="icon-container">
          <i class="fas fa-user-graduate"></i>
        </div>
          <div class="card-info">
            <h3 class="stat-title">Total Students</h3>
            <div class="stat-value" v-if="!isLoading">{{ totalStudents }}</div>
            <div class="stat-value loading" v-else><i class="fas fa-spinner fa-spin"></i></div>
        </div>
      </div>
      </div>

      <!-- Total Teachers Card -->
      <div class="col-md-4">
        <div class="dashboard-card">
          <div class="icon-container">
          <i class="fas fa-chalkboard-teacher"></i>
        </div>
          <div class="card-info">
            <h3 class="stat-title">Total Teachers</h3>
            <div class="stat-value" v-if="!isLoading">{{ totalTeachers }}</div>
            <div class="stat-value loading" v-else><i class="fas fa-spinner fa-spin"></i></div>
        </div>
      </div>
        </div>

      <!-- Active Sections Card -->
      <div class="col-md-4">
        <div class="dashboard-card">
          <div class="icon-container">
          <i class="fas fa-users"></i>
        </div>
          <div class="card-info">
            <h3 class="stat-title">Active Sections</h3>
            <div class="stat-value" v-if="!isLoading">{{ activeSections }}</div>
            <div class="stat-value loading" v-else><i class="fas fa-spinner fa-spin"></i></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Stats -->
    <div class="row g-4 mb-4">
      <!-- Average Attendance Card -->
      <div v-if="isCITHead" class="col-md-6">
        <div class="dashboard-card">
          <div class="icon-container">
          <i class="fas fa-clock"></i>
        </div>
          <div class="card-info">
            <h3 class="stat-title">Average Attendance</h3>
            <div class="stat-value" v-if="!isLoading && hasAttendanceData">{{ averageAttendance }}%</div>
            <div class="stat-value loading" v-else-if="isLoading"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="no-data" v-else>No data available</div>
        </div>
      </div>
      </div>
      
      <!-- Average Score Card -->
      <div class="col-md-6">
        <div class="dashboard-card">
          <div class="icon-container">
          <i class="fas fa-chart-line"></i>
        </div>
          <div class="card-info">
            <h3 class="stat-title">Average Score</h3>
            <div class="stat-value" v-if="!isLoading && hasScoreData">{{ averageScore }}%</div>
            <div class="stat-value loading" v-else-if="isLoading"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="no-data" v-else>No data available</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="row mb-4">
      <!-- Attendance Distribution Chart -->
      <div class="col-md-6 mb-4">
      <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">
              <i class="fas fa-calendar-check me-2"></i>
              Attendance Distribution
            </h5>
            <p class="chart-description">Breakdown of student attendance patterns across the department</p>
        <div class="chart-container">
              <div v-if="isLoading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
          <canvas ref="performanceChart"></canvas>
              <p v-if="!hasAttendanceData && !isLoading" class="no-data-message">No attendance data available</p>
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
            <p class="chart-description">Average scores by assessment type across the department</p>
        <div class="chart-container">
              <div v-if="isLoading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
          <canvas ref="assessmentTypeChart"></canvas>
              <p v-if="!hasAssessmentData && !isLoading" class="no-data-message">No assessment data available</p>
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
            <p class="chart-description">Department average scores across recent assessments</p>
      <div class="chart-container">
              <div v-if="isLoading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
              <canvas ref="performanceTrendChart"></canvas>
              <p v-if="!hasPerformanceData && !isLoading" class="no-data-message">No performance data available</p>
            </div>
          </div>
      </div>
    </div>

    <!-- Section Performance -->
      <div class="col-md-6 mb-4">
    <div class="chart-card">
          <div class="card-body">
            <h5 class="card-title">
              <i class="fas fa-users me-2"></i>
              Section Performance
            </h5>
            <p class="chart-description">Comparison of performance across different sections</p>
      <div class="chart-container">
              <div v-if="isLoading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
        <canvas ref="sectionChart"></canvas>
              <p v-if="!hasSectionData && !isLoading" class="no-data-message">No section data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Graphs Modal -->
    <ExportGraphsModal 
      dashboardType="cithead"
      :chartRefs="chartRefs"
      :filterInfo="{
        year: selectedYear,
        section: selectedSection
      }"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'
import moment from 'moment'
import ExportGraphsModal from '@/components/ExportGraphsModal.vue'

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

export default {
  name: 'Dashboard',
  components: {
    ExportGraphsModal
  },
  setup() {
    const store = useStore()
    const performanceChart = ref(null)
    const assessmentTypeChart = ref(null)
    const performanceTrendChart = ref(null)
    const sectionChart = ref(null)
    const selectedYear = ref('')
    const selectedSection = ref('')
    const dashboardContainer = ref(null)
    const isLoading = ref(false)
    const lastUpdate = ref(null)
    const autoRefreshInterval = ref(null)
    const sections = ref([])
    const availableYears = ref(['1st', '2nd', '3rd', '4th'])

    // Chart references for PDF export
    const chartRefs = ref({})
    
    // Computed properties
    const isCITHead = computed(() => store.getters.isCITHead)
    const token = computed(() => store.state.auth.token)
    
    // Get user name
    const userName = computed(() => {
      const user = store.state.auth.user;
      return user ? user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';
    });
    
    // Check if filters are active
    const hasActiveFilters = computed(() => {
      return Boolean(selectedYear.value || selectedSection.value);
    });

    // Set auth token for all requests
    watch(token, (newToken) => {
      if (newToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }
    }, { immediate: true });

    // Dashboard stats
    const totalStudents = ref(0)
    const totalTeachers = ref(0)
    const averageAttendance = ref(0)
    const averageScore = ref(0)
    const activeSections = ref(0)
    const data = ref(null)

    // Computed properties for data availability
    const hasAttendanceData = computed(() => {
      if (data.value && data.value.attendanceDistribution) {
        return data.value.attendanceDistribution.some(val => val > 0);
      }
      return false;
    });

    const hasScoreData = computed(() => {
      return data.value?.averageScore > 0;
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

    const hasSectionData = computed(() => {
      return data.value?.sections?.length > 0;
    });

    // Fetch years and sections with data from all teacher class records
    const fetchAvailableFilters = async () => {
      try {
        // Use existing backend endpoints that already pull data from TeacherClassRecord
        const teacherClassRecordsResponse = await api.get('/teacher-class-records');
        
        if (teacherClassRecordsResponse.data) {
          const records = teacherClassRecordsResponse.data;
          
          // Extract unique years, sections, and subjects with teacher info
          const uniqueYears = [...new Set(records.map(record => record.year))].filter(Boolean).sort();
          const uniqueSections = [];
          const uniqueSubjects = [];
          
          // Process sections with teacher info
          records.forEach(record => {
            if (record.section && !uniqueSections.some(s => s.name === record.section)) {
              uniqueSections.push({
                id: record._id,
                name: record.section,
                teacherName: record.teacherName || ''
              });
            }
            
            if (record.subject && !uniqueSubjects.some(s => s.name === record.subject)) {
              uniqueSubjects.push({
                id: record._id,
                name: record.subject,
                teacherName: record.teacherName || ''
              });
            }
          });
          
          // Update reactive data
          availableYears.value = uniqueYears.length > 0 ? uniqueYears : ['1st', '2nd', '3rd', '4th'];
          
          // If no year is selected, populate all available sections with teacher info
          if (!selectedYear.value) {
            sections.value = uniqueSections;
          }
        }
      } catch (error) {
        console.error('Error fetching available filters:', error);
        // Keep default years if API fails
        availableYears.value = ['1st', '2nd', '3rd', '4th'];
      }
    };

    // Fetch sections and subjects with data for a specific year
    const fetchSectionsAndSubjects = async (year = '') => {
      try {
        // Use existing backend endpoints that already pull data from TeacherClassRecord
        const response = await api.get('/teacher-class-records', {
          params: { year }
        });
        
        if (response.data) {
          const records = response.data;
          
          // Process sections with teacher info for the selected year
          const uniqueSections = [];
          records.forEach(record => {
            if (record.section && !uniqueSections.some(s => s.name === record.section)) {
              uniqueSections.push({
                id: record._id,
                name: record.section,
                teacherName: record.teacherName || ''
              });
            }
          });
          
          sections.value = uniqueSections;
        }
      } catch (error) {
        console.error('Error fetching sections and subjects:', error);
        sections.value = [];
      }
    };

    // Fetch subjects for a specific section with data
    const fetchSubjectsBySection = async (year, section) => {
      try {
        // Use existing endpoints
        const response = await api.get('/teacher-class-records', {
          params: { year, section }
        });
        
        if (response.data) {
          const records = response.data;
          
          // Extract unique subjects for this section
          const uniqueSubjects = [];
          records.forEach(record => {
            if (record.subject && !uniqueSubjects.some(s => s.name === record.subject)) {
              uniqueSubjects.push({
                id: record._id,
                name: record.subject,
                teacherName: record.teacherName || ''
              });
            }
          });
          
          sections.value = uniqueSections;
        }
      } catch (error) {
        console.error('Error fetching subjects by section:', error);
        sections.value = [];
      }
    };

    // Get attendance data for the charts
    const fetchAttendanceData = async () => {
      try {
        // Make a specific request for attendance data with the selected filters
        const attendanceParams = {
          year: selectedYear.value,
          section: selectedSection.value
        };
        
        console.log('Fetching attendance with params:', attendanceParams);
        
        // Try fetching directly from TeacherClassRecord attendance data
        try {
          const classRecordsResponse = await api.get('/teacher-class-records/attendance', { 
            params: attendanceParams 
          });
          
          if (classRecordsResponse.data && classRecordsResponse.data.distribution) {
            console.log('Got attendance distribution from class records:', classRecordsResponse.data.distribution);
            return classRecordsResponse.data.distribution;
          }
          
          if (classRecordsResponse.data && Array.isArray(classRecordsResponse.data)) {
            // Process attendance records
            const attendanceCounts = [0, 0, 0]; // [present, late, absent]
            
            classRecordsResponse.data.forEach(record => {
              if (record.status === 'present') attendanceCounts[0]++;
              else if (record.status === 'late') attendanceCounts[1]++;
              else if (record.status === 'absent') attendanceCounts[2]++;
            });
            
            console.log('Processed attendance from class records:', attendanceCounts);
            return attendanceCounts;
          }
        } catch (error) {
          console.log('Falling back to dashboard stats for attendance data');
        }
        
        // Try the main attendance endpoint as a fallback
        try {
          const attendanceResponse = await api.get('/attendance', { params: attendanceParams });
          
          if (attendanceResponse.data && Array.isArray(attendanceResponse.data)) {
            // Process raw attendance records
            const attendanceCounts = [0, 0, 0]; // [present, late, absent]
            
            attendanceResponse.data.forEach(record => {
              if (record.status === 'present') attendanceCounts[0]++;
              else if (record.status === 'late') attendanceCounts[1]++;
              else if (record.status === 'absent') attendanceCounts[2]++;
            });
            
            console.log('Processed attendance from /attendance:', attendanceCounts);
            return attendanceCounts;
          }
        } catch (error) {
          console.log('Attendance API endpoint not available');
        }
        
        // Try loading from dashboard stats as last resort
        try {
          const statsResponse = await api.get('/dashboard/stats', {
            params: attendanceParams
          });
          
          if (statsResponse.data && statsResponse.data.attendanceDistribution) {
            console.log('Got attendance from dashboard stats:', statsResponse.data.attendanceDistribution);
            return statsResponse.data.attendanceDistribution;
          }
        } catch (error) {
          console.log('No attendance data available from any source');
        }
        
        // Generate demo data if nothing else works
        console.log('Using demo attendance data');
        return [70, 15, 15]; // Demo data for attendance chart [present, late, absent]
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        return [70, 15, 15]; // Default on error with demo data
      }
    };

    const fetchDashboardData = async () => {
      try {
        isLoading.value = true;
        
        // Use the existing stats endpoint from dashboard.js
        const statsResponse = await api.get('/dashboard/stats', {
          params: {
            year: selectedYear.value,
            section: selectedSection.value
          }
        });
        
        data.value = statsResponse.data || {};
        
        // Update basic stats from the response structure in dashboard.js
        totalStudents.value = data.value.totalStudents || 0;
        totalTeachers.value = data.value.totalTeachers || 0;
        activeSections.value = data.value.activeSections || 0;
        averageScore.value = data.value.averageScore || 0;
        
        // Get attendance data for charts - must run separately
        const attendanceDistribution = await fetchAttendanceData();
        data.value.attendanceDistribution = attendanceDistribution;
        
        // Calculate average attendance from distribution
        const totalAttendance = attendanceDistribution.reduce((a, b) => a + b, 0);
        if (totalAttendance > 0) {
          // Calculate percentage of present and late (not absent)
          const presentAttendance = attendanceDistribution[0] + attendanceDistribution[1];
          averageAttendance.value = Math.round((presentAttendance / totalAttendance) * 100);
        } else {
          averageAttendance.value = 0;
        }
        
        // Process assessment data for charts
        await fetchAssessmentData();

        // Update charts with new data
          updateCharts(data.value);
        
        lastUpdate.value = new Date();
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
        
        // Initialize with empty data if main stats request fails
        data.value = {
          totalStudents: 0,
          totalTeachers: 0,
          activeSections: 0,
          attendanceDistribution: [0, 0, 0],
          averageAttendance: 0,
          assessmentTypes: [],
          performanceTrends: [],
          averageScore: 0,
          sections: []
        };
        
        totalStudents.value = 0;
        totalTeachers.value = 0;
        activeSections.value = 0;
        averageAttendance.value = 0;
        averageScore.value = 0;
        
        // Update charts with empty data
        updateCharts(data.value);
      } finally {
        isLoading.value = false;
      }
    };
    
    // Fetch assessment data directly
    const fetchAssessmentData = async () => {
      try {
        // Directly fetch assessment data with filters
        const assessmentResponse = await api.get('/assessments', {
          params: {
            year: selectedYear.value,
            section: selectedSection.value
          }
        });
        
        console.log('Fetched assessment data:', assessmentResponse.data);
        
        if (assessmentResponse.data && Array.isArray(assessmentResponse.data)) {
          const assessments = assessmentResponse.data;
          
          // Group assessments by type
          const assessmentTypes = {
            'Quiz': { count: 0, totalScore: 0, scores: [] },
            'Activity': { count: 0, totalScore: 0, scores: [] },
            'Performance Task': { count: 0, totalScore: 0, scores: [] }
          };
          
          // Process each assessment
          assessments.forEach(assessment => {
            const type = assessment.type || 'Other';
            if (assessmentTypes[type]) {
              assessmentTypes[type].count++;
              
              // Process scores if available
              if (assessment.scores) {
                // Handle both array and Map formats
                let scoreArray = [];
                if (Array.isArray(assessment.scores)) {
                  scoreArray = assessment.scores;
                } else if (assessment.scores instanceof Map) {
                  scoreArray = Array.from(assessment.scores.values());
                } else if (typeof assessment.scores === 'object') {
                  // Handle object format
                  scoreArray = Object.values(assessment.scores);
                }
                
                scoreArray.forEach(score => {
                  if (typeof score === 'number') {
                    const percentage = assessment.maxScore ? (score / assessment.maxScore) * 100 : score;
                    assessmentTypes[type].totalScore += percentage;
                    assessmentTypes[type].scores.push(percentage);
                  }
                });
              }
            }
          });
          
          // Calculate averages and prepare for chart
          data.value.assessmentTypes = Object.keys(assessmentTypes).map(type => {
            const typeData = assessmentTypes[type];
            const averageScore = typeData.scores.length > 0 
              ? typeData.totalScore / typeData.scores.length 
              : 0;
              
            return {
              type,
              averageScore: Math.round(averageScore),
              count: typeData.count,
              completionRate: typeData.count > 0 ? 100 : 0
            };
          });
          
          // Generate performance trends from assessment data
          data.value.performanceTrends = assessments
            .filter(a => a.date) // Only include assessments with dates
            .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort by date
            .map(assessment => {
              // Calculate average score for this assessment
              let averageScore = 0;
              let scoreArray = [];
              
              // Handle different score formats
              if (assessment.scores) {
                if (Array.isArray(assessment.scores)) {
                  scoreArray = assessment.scores;
                } else if (assessment.scores instanceof Map) {
                  scoreArray = Array.from(assessment.scores.values());
                } else if (typeof assessment.scores === 'object') {
                  scoreArray = Object.values(assessment.scores);
                }
                
                // Calculate average from valid scores
                const validScores = scoreArray.filter(score => typeof score === 'number');
                if (validScores.length > 0) {
                  const totalScore = validScores.reduce((sum, score) => sum + score, 0);
                  averageScore = assessment.maxScore 
                    ? (totalScore / validScores.length / assessment.maxScore) * 100
                    : totalScore / validScores.length;
                }
              }
              
              return {
                date: assessment.date,
                title: assessment.name || assessment.type,
                averageScore: Math.round(averageScore),
                type: assessment.type
              };
            });
          
          // Process section data if available
          // Group assessments by section
          const sectionPerformance = {};
          
          assessments.forEach(assessment => {
            if (assessment.section) {
              if (!sectionPerformance[assessment.section]) {
                sectionPerformance[assessment.section] = {
                  totalScore: 0,
                  scoreCount: 0,
                  attendanceCount: 0,
                  attendanceTotal: 0
                };
              }
              
              // Process scores
              let scoreArray = [];
              if (assessment.scores) {
                if (Array.isArray(assessment.scores)) {
                  scoreArray = assessment.scores;
                } else if (assessment.scores instanceof Map) {
                  scoreArray = Array.from(assessment.scores.values());
                } else if (typeof assessment.scores === 'object') {
                  scoreArray = Object.values(assessment.scores);
                }
                
                scoreArray.forEach(score => {
                  if (typeof score === 'number') {
                    const percentage = assessment.maxScore ? (score / assessment.maxScore) * 100 : score;
                    sectionPerformance[assessment.section].totalScore += percentage;
                    sectionPerformance[assessment.section].scoreCount++;
                  }
                });
              }
            }
          });
          
          // Try to fetch attendance by section to calculate attendance rates
          try {
            const sectionAttendance = await api.get('/attendance/by-section', {
              params: { year: selectedYear.value }
            });
            
            if (sectionAttendance.data) {
              Object.entries(sectionAttendance.data).forEach(([section, data]) => {
                if (sectionPerformance[section]) {
                  sectionPerformance[section].attendanceRate = data.presentRate || 0;
                }
              });
            }
          } catch (error) {
            console.log('No section attendance data available');
          }
          
          // Prepare section data for chart
          if (Object.keys(sectionPerformance).length > 0) {
            data.value.sections = Object.keys(sectionPerformance).map(sectionName => {
              const section = sectionPerformance[sectionName];
              const averageScore = section.scoreCount > 0 
                ? section.totalScore / section.scoreCount 
                : 0;
              const attendanceRate = section.attendanceRate || 0;
              
              return {
                name: sectionName,
                averageScore: Math.round(averageScore),
                attendanceRate: Math.round(attendanceRate),
                performance: Math.round(averageScore) // For backward compatibility
              };
            });
          }
        }
      } catch (error) {
        console.error('Error fetching assessment data:', error);
        // Set default values
        data.value.assessmentTypes = [
          { type: 'Quiz', averageScore: 0, count: 0 },
          { type: 'Activity', averageScore: 0, count: 0 },
          { type: 'Performance Task', averageScore: 0, count: 0 }
        ];
        data.value.performanceTrends = [];
        data.value.sections = [];
      }
    };

    const updateCharts = (data) => {
      updatePerformanceChart(data);
      updateAssessmentTypeChart(data);
      updatePerformanceTrendChart(data);
      updateSectionChart(data);
    };

    // Initialize dummy data for charts when no data is available
    const initDummyData = () => {
      // Create sample data structure
      const dummyData = {
        totalStudents: 0,
        totalTeachers: 0,
        activeSections: 0,
        averageAttendance: 0,
        averageScore: 0,
        attendanceDistribution: [0, 0, 0],
        assessmentTypes: [
          { type: 'Quiz', averageScore: 0, count: 0 },
          { type: 'Activity', averageScore: 0, count: 0 },
          { type: 'Performance Task', averageScore: 0, count: 0 }
        ],
        performanceTrends: [],
        sections: []
      };
      
      // Update charts with dummy data
      updateCharts(dummyData);
    };

    // Format date for display
    const formatDate = (date) => {
      if (!date) return '';
      return moment(date).format('MMMM D, YYYY h:mm A');
    };

    // Handle year change
    const handleYearChange = async () => {
      selectedSection.value = '';
      
      if (selectedYear.value) {
        await fetchSectionsAndSubjects(selectedYear.value);
      } else {
        sections.value = [];
      }
      
      await fetchDashboardData();
    };

    // Handle section change
    const handleSectionChange = () => {
      fetchDashboardData();
    };

    // Handle filter change
    const handleFilterChange = () => {
      fetchDashboardData();
    };

    // Clear all filters
    const clearFilters = () => {
      selectedYear.value = '';
      selectedSection.value = '';
      
      // Refresh available filters after clearing
      fetchAvailableFilters().then(() => {
        fetchDashboardData();
      });
    };

    // Get filter display text
    const getFilterDisplay = () => {
      const filters = [];
      if (selectedYear.value) filters.push(selectedYear.value + ' Year');
      
      if (selectedSection.value) {
        // Find the section object to get teacher name
        const sectionObj = sections.value.find(s => s.name === selectedSection.value);
        if (sectionObj && sectionObj.teacherName) {
          filters.push(`${selectedSection.value} - ${sectionObj.teacherName}`);
        } else {
          filters.push(selectedSection.value);
        }
      }
      
      return filters.length > 0 ? filters.join(' - ') : 'Filter View';
    };

    // Update charts with data
    const updatePerformanceChart = (data) => {
      if (performanceChart.value) {
        const ctx = performanceChart.value.getContext('2d');
        
        // Dispose of existing chart if it exists
        if (ctx.chart) {
          ctx.chart.destroy();
        }
        
        // Attendance status distribution data
        const attendanceLabels = ['Present', 'Late', 'Absent'];
        let attendanceData = data.attendanceDistribution || [0, 0, 0];
        
        // Ensure we have at least some data to display
        const totalAttendanceCount = attendanceData.reduce((a, b) => a + b, 0);
        if (totalAttendanceCount === 0) {
          // Use sample distribution if no real data
          attendanceData = [70, 15, 15]; // Sample data for visual display
        }
        
        // Log for debugging
        console.log('Final attendance distribution data:', attendanceData);
        
        // Create chart
        ctx.chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: attendanceLabels,
            datasets: [{
              data: attendanceData,
              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
        
        // Store chart reference for PDF export
        chartRefs.value.performanceChart = performanceChart.value;
      }
    };

    const updateAssessmentTypeChart = (data) => {
      if (assessmentTypeChart.value) {
        const ctx = assessmentTypeChart.value.getContext('2d');
        
        // Dispose of existing chart if it exists
        if (ctx.chart) {
          ctx.chart.destroy();
        }
        
        // Assessment types data
        const assessmentData = data.assessmentTypes || [];
        const labels = [];
        const values = [];
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
        
        try {
          // Extract assessment types data
          if (Array.isArray(assessmentData)) {
            // If array format
            assessmentData.forEach((item, index) => {
              if (item && typeof item === 'object') {
                labels.push(item.type || `Type ${index + 1}`);
                values.push(parseFloat(item.averageScore) || 0);
              }
            });
          } else if (typeof assessmentData === 'object' && assessmentData !== null) {
            // If object format
            Object.entries(assessmentData).forEach(([type, data], index) => {
              labels.push(type);
              values.push(parseFloat(data.averageScore) || 0);
            });
          }
          
          // If no data was extracted, use default types
          if (labels.length === 0) {
            labels.push('Quiz', 'Activity', 'Performance Task');
            values.push(0, 0, 0);
          }
        } catch (error) {
          console.error('Error processing assessment data:', error);
          // Fallback to default labels and values
          labels.push('Quiz', 'Activity', 'Performance Task');
          values.push(0, 0, 0);
        }
        
        // Create chart
        ctx.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Average Score (%)',
              data: values,
              backgroundColor: colors.slice(0, labels.length),
              borderWidth: 0,
              borderRadius: 6,
              maxBarThickness: 50
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
                  label: function(context) {
                    return `Average Score: ${context.raw}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            }
          }
        });
        
        // Store chart reference for PDF export
        chartRefs.value.assessmentTypeChart = assessmentTypeChart.value;
      }
    };

    const updatePerformanceTrendChart = (data) => {
      if (performanceTrendChart.value) {
        const ctx = performanceTrendChart.value.getContext('2d');
        
        // Dispose of existing chart if it exists
        if (ctx.chart) {
          ctx.chart.destroy();
        }
        
        // Performance trends data
        const performanceTrends = data.performanceTrends || [];
        const labels = [];
        const scores = [];
        
        // Extract performance trends data
        performanceTrends.forEach(item => {
          // Format date if available
          const date = item.date ? moment(item.date).format('MMM D') : '';
          // Use assessment title or date as label
          labels.push(item.title ? `${item.title} (${date})` : date);
          scores.push(item.averageScore || 0);
        });
        
        // Create chart
        ctx.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Average Score',
              data: scores,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderColor: '#3b82f6',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: '#3b82f6',
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
                  label: function(context) {
                    return `Average Score: ${context.raw}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
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
        
        // Store chart reference for PDF export
        chartRefs.value.performanceTrendChart = performanceTrendChart.value;
      }
    };

    const updateSectionChart = (data) => {
      if (sectionChart.value) {
        const ctx = sectionChart.value.getContext('2d');
        
        // Dispose of existing chart if it exists
        if (ctx.chart) {
          ctx.chart.destroy();
        }
        
        // Section performance data
        const sectionData = data.sections || [];
        const labels = [];
        const performanceData = [];
        const attendanceData = [];
        
        // Extract section performance data
        sectionData.forEach(section => {
          labels.push(section.name);
          performanceData.push(section.averageScore || 0);
          attendanceData.push(section.attendanceRate || 0);
        });
        
        // Create chart
        ctx.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Average Score',
                data: performanceData,
                backgroundColor: '#3b82f6',
                borderWidth: 0,
                borderRadius: 6,
                maxBarThickness: 30
              },
              {
                label: 'Attendance Rate',
                data: attendanceData,
                backgroundColor: '#10b981',
                borderWidth: 0,
                borderRadius: 6,
                maxBarThickness: 30
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.dataset.label || '';
                    const value = context.raw || 0;
                    return `${label}: ${value}%`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            }
          }
        });
        
        // Store chart reference for PDF export
        chartRefs.value.sectionChart = sectionChart.value;
      }
    };

    const refreshDashboard = () => {
      fetchDashboardData();
    };

    const scrollToSection = (sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Auto-refresh logic
    const setupAutoRefresh = () => {
      // Clear any existing interval
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
      }
      
      // Set new interval (every 5 minutes)
      autoRefreshInterval.value = setInterval(() => {
        fetchDashboardData();
      }, 5 * 60 * 1000);
    };

    // Fetch data on component mount
    onMounted(async () => {
      try {
        // Initialize with dummy data while loading
        nextTick(() => {
          initDummyData();
        });
        
        // Set up API interceptor to handle 404 errors gracefully
        api.interceptors.response.use(
          response => response,
          error => {
            if (error.response && error.response.status === 404) {
              console.warn(`API endpoint not found: ${error.config.url}`);
              // Don't rethrow, allow handling in the catch block
            }
            return Promise.reject(error);
          }
        );
        
        // Set auth token for API requests
        if (store.state.auth.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${store.state.auth.token}`;
        }
        
        // Fetch available years and sections with data
        await fetchAvailableFilters();
        
        // Fetch sections and subjects if year is selected
        if (selectedYear.value) {
          await fetchSectionsAndSubjects(selectedYear.value);
        }
        
        // Fetch dashboard data
        await fetchDashboardData();
        setupAutoRefresh();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Initialize with dummy data if there's an error
        initDummyData();
      }
      
      // After charts are initialized, store references
      nextTick(() => {
        chartRefs.value = {
          performanceChart: performanceChart.value,
          assessmentTypeChart: assessmentTypeChart.value,
          performanceTrendChart: performanceTrendChart.value,
          sectionChart: sectionChart.value
        };
      });
    });

    // Clean up on component unmount
    onUnmounted(() => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
      }
    });

    return {
      performanceChart,
      assessmentTypeChart,
      performanceTrendChart,
      sectionChart,
      selectedYear,
      selectedSection,
      sections,
      availableYears,
      isCITHead,
      userName,
      hasActiveFilters,
      totalStudents,
      totalTeachers,
      averageAttendance,
      averageScore,
      activeSections,
      hasAttendanceData,
      hasScoreData,
      hasPerformanceData,
      hasAssessmentData,
      hasSectionData,
      dashboardContainer,
      isLoading,
      lastUpdate,
      formatDate,
      scrollToSection,
      handleYearChange,
      handleSectionChange,
      clearFilters,
      getFilterDisplay,
      refreshDashboard,
      fetchAvailableFilters,
      chartRefs
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

.last-update-badge {
  font-size: 0.85rem;
  color: #64748b;
  display: flex;
  align-items: center;
}

.btn-refresh {
  background: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  padding: 0.5rem;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-refresh:hover {
  background: #f7fafc;
  color: #2d3748;
  border-color: #cbd5e1;
}

/* Dashboard Cards */
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

/* Chart Cards */
.chart-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.card-body {
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .greeting {
    font-size: 1.75rem;
  }
  
  .filter-menu {
    width: 100%;
    max-width: 320px;
  }

  .btn-filter {
    min-width: auto;
    width: 100%;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style> 