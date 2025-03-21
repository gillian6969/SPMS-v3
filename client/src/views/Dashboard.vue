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
              <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
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
          <div class="mb-3">
            <label class="form-label">Date Range</label>
            <div class="d-flex gap-2">
              <div class="flex-grow-1">
                <label class="small text-muted">From</label>
                <input 
                  type="date" 
                  class="form-control form-control-sm" 
                  v-model="selectedStartDate"
                  :max="today"
                >
              </div>
              <div class="flex-grow-1">
                <label class="small text-muted">To</label>
                <input 
                  type="date" 
                  class="form-control form-control-sm" 
                  v-model="selectedEndDate"
                  :max="today"
                >
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-between">
            <button class="btn btn-outline-secondary" @click="clearFilters">Clear Filters</button>
            <button class="btn btn-primary" @click="refreshDashboard">Apply</button>
          </div>
        </div>
      </div>
      
      <!-- Last Updated -->
      <div class="last-update-badge" v-if="lastUpdate">
        Last updated: {{ formatDate(lastUpdate) }}
        <button class="btn btn-refresh ms-2" @click="refreshDashboard" title="Refresh Dashboard">
          <i class="fas fa-sync-alt"></i>
        </button>
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
              <i class="fas fa-graduation-cap me-2"></i>
              Performance by Assessment Type
            </h5>
            <p class="chart-description">Visualizes how students perform across different assessment types</p>
      <div class="chart-container">
              <div v-if="isLoading" class="loading-overlay">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading chart data...</p>
              </div>
        <canvas ref="assessmentTypePerformanceChart"></canvas>
              <p v-if="!hasPerformanceData && !isLoading" class="no-data-message">No performance data available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'
import moment from 'moment'

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()
    const performanceChart = ref(null)
    const assessmentTypeChart = ref(null)
    const performanceTrendChart = ref(null)
    const assessmentTypePerformanceChart = ref(null)
    const selectedYear = ref('')
    const selectedSection = ref('')
    const selectedStartDate = ref('')
    const selectedEndDate = ref('')
    const dashboardContainer = ref(null)
    const isLoading = ref(false)
    const lastUpdate = ref(null)
    const autoRefreshInterval = ref(null)
    const sections = ref([])
    const subjects = ref([])
    const availableYears = ref([])
    const today = computed(() => moment().format('YYYY-MM-DD'))

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
      try {
        if (!data.value || !data.value.attendanceDistribution) return false;
        
        // Ensure all values are numbers and valid
        const validDistribution = Array.isArray(data.value.attendanceDistribution) 
          ? data.value.attendanceDistribution.map(val => (typeof val === 'number') ? val : 0)
          : [0, 0, 0];
        
        // Check if we have any non-zero values
        const hasData = validDistribution.some(val => val > 0);
        
        console.log('hasAttendanceData check:', 
          validDistribution, 
          `hasData: ${hasData}`
        );
        
        return hasData;
      } catch (error) {
        console.error('Error checking attendance data:', error);
        return false;
      }
    });

    const hasScoreData = computed(() => {
      if (!data.value) return false;
      
      // Check for average score
      if (data.value.averageScore > 0) return true;
      
      // Check assessment types for any with scores
      if (data.value.assessmentTypes && Array.isArray(data.value.assessmentTypes)) {
        return data.value.assessmentTypes.some(type => (type.averageScore > 0 && type.count > 0));
      }
      
      return false;
    });

    const hasPerformanceData = computed(() => {
      if (!data.value) return false;
      
      // Check for assessment data
      if (hasAssessmentData.value) return true;
      
      // Check for performance trends
      if (Array.isArray(data.value.performanceTrends) && data.value.performanceTrends.length > 0) {
        return data.value.performanceTrends.some(trend => trend.averageScore > 0);
      }
      
      // Check sections data
      if (Array.isArray(data.value.sections) && data.value.sections.length > 0) {
        return data.value.sections.some(section => section.averageScore > 0);
      }
      
      return false;
    });

    const hasAssessmentData = computed(() => {
      if (!data.value) return false;
      
      // Check for assessment types data
      if (data.value.assessmentTypes && Array.isArray(data.value.assessmentTypes)) {
        return data.value.assessmentTypes.some(type => type.count > 0 && type.averageScore > 0);
      }
      
      return false;
    });

    const hasSectionData = computed(() => {
      return data.value?.sections?.length > 0;
    });

    // Fetch available years and sections directly from database records
    const fetchAvailableFilters = async () => {
      try {
        isLoading.value = true;
        
        // Get all student records to extract years and sections
        const response = await api.get('/students', {
          headers: { 'Authorization': `Bearer ${token.value}` }
        });
        
        if (response.data && Array.isArray(response.data)) {
          // Extract unique years and sections from student records
          const students = response.data;
          
          // Get unique years with data
          const years = [...new Set(students.map(student => student.year))].filter(Boolean);
          availableYears.value = years.length > 0 ? years.sort() : ['1st', '2nd', '3rd', '4th'];
          
          // Get unique sections based on selectedYear
          await updateSectionsForSelectedYear();
          
          console.log('Fetched available filters:', {
            years: availableYears.value,
            sections: sections.value
          });
        }
        
        isLoading.value = false;
      } catch (error) {
        console.error('Error fetching available filters:', error);
        // Keep default years if API fails
        availableYears.value = ['1st', '2nd', '3rd', '4th'];
        isLoading.value = false;
      }
    };

    // New function to update sections based on selected year
    const updateSectionsForSelectedYear = async () => {
      try {
        console.log('Updating sections for year:', selectedYear.value || 'All Years');
        sections.value = []; // Clear existing sections first
        
        const params = {};
        if (selectedYear.value) {
          params.year = selectedYear.value;
        }
        
        // Get students filtered by year if selected
        const response = await api.get('/students', {
          params,
          headers: { 'Authorization': `Bearer ${token.value}` }
        });
        
        if (response.data && Array.isArray(response.data)) {
          const students = response.data;
          
          // Get unique sections matching the selected year
          let uniqueSections = [];
          
          if (selectedYear.value) {
            // Filter students by the selected year before extracting sections
            uniqueSections = [...new Set(
              students
                .filter(student => student.year === selectedYear.value)
                .map(student => student.section)
            )].filter(Boolean);
          } else {
            // If no year selected, get all unique sections
            uniqueSections = [...new Set(
              students.map(student => student.section)
            )].filter(Boolean);
          }
          
          console.log(`Found ${uniqueSections.length} sections for ${selectedYear.value || 'all years'}:`, uniqueSections);
          
          // Map sections to include teacher info if available
          sections.value = uniqueSections.map(sectionName => ({
            id: sectionName,
            name: sectionName,
            teacherName: '' // We could fetch teacher info in the future
          }));
        } else {
          console.warn('No student data received when updating sections');
          sections.value = [];
        }
      } catch (error) {
        console.error('Error updating sections for year:', error);
        sections.value = [];
      }
    };

    // Fetch attendance data for the charts
    const fetchAttendanceData = async () => {
      try {
        console.log('Fetching attendance with filters:', {
          year: selectedYear.value || 'All Years',
          section: selectedSection.value || 'All Sections'
        });
        
        let attendanceDistribution = [0, 0, 0]; // Default empty distribution [present, late, absent]
        
        // First approach: Try direct approach with specific filter handling
        try {
          console.log('Fetching attendance directly with filters');
          
          // Build query params differently for Windows/PowerShell URL handling
          let url = `${api.defaults.baseURL}/attendance`;
          let queryParts = [];
          
          if (selectedYear.value) {
            queryParts.push(`year=${encodeURIComponent(selectedYear.value)}`);
          }
          
          if (selectedSection.value) {
            queryParts.push(`section=${encodeURIComponent(selectedSection.value)}`);
          }
          
          if (selectedStartDate.value) {
            queryParts.push(`startDate=${encodeURIComponent(selectedStartDate.value)}`);
          }
          
          if (selectedEndDate.value) {
            queryParts.push(`endDate=${encodeURIComponent(selectedEndDate.value)}`);
          }
          
          // Add query string if we have parameters
          if (queryParts.length > 0) {
            url += '?' + queryParts.join('&');
          }
          
          console.log('Fetching attendance from URL:', url);
          
          // Make direct fetch request
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token.value}`
            }
          });
          
          if (response.ok) {
            const attendanceData = await response.json();
            console.log('Attendance data received:', 
              Array.isArray(attendanceData) ? `${attendanceData.length} records` : 'Non-array data');
            
            if (Array.isArray(attendanceData) && attendanceData.length > 0) {
              // Process attendance records
              const statusCounts = [0, 0, 0]; // [present, late, absent]
              
              attendanceData.forEach(record => {
                if (record.status === 'present') statusCounts[0]++;
                else if (record.status === 'late') statusCounts[1]++;
                else if (record.status === 'absent') statusCounts[2]++;
              });
              
              console.log('Calculated attendance counts:', statusCounts);
              
              // Only use this data if we have at least one attendance record
              if (statusCounts.some(count => count > 0)) {
                attendanceDistribution = statusCounts;
                return attendanceDistribution;
              }
            }
          } else {
            console.warn(`Attendance API returned status: ${response.status}`);
          }
        } catch (error) {
          console.log('Error fetching attendance directly:', error.message);
        }
        
        // Second approach: Try fetching from dashboard stats
        try {
          console.log('Trying to get attendance from dashboard stats');
          
          // Build URL for stats
          let url = `${api.defaults.baseURL}/dashboard/stats`;
          let queryParts = [];
          
          if (selectedYear.value) {
            queryParts.push(`year=${encodeURIComponent(selectedYear.value)}`);
          }
          
          if (selectedSection.value) {
            queryParts.push(`section=${encodeURIComponent(selectedSection.value)}`);
          }
          
          if (queryParts.length > 0) {
            url += '?' + queryParts.join('&');
          }
          
          console.log('Fetching dashboard stats from URL:', url);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${token.value}`
            }
          });
          
          if (response.ok) {
            const statsData = await response.json();
            
            if (statsData && Array.isArray(statsData.attendanceDistribution)) {
              console.log('Attendance distribution from stats:', statsData.attendanceDistribution);
              
              // Validate attendance distribution data
              const validDistribution = statsData.attendanceDistribution.map(val => 
                (typeof val === 'number') ? val : 0
              );
              
              // Only use if we have some valid data
              if (validDistribution.some(val => val > 0)) {
                attendanceDistribution = validDistribution;
                return attendanceDistribution;
              }
            }
          }
        } catch (error) {
          console.log('Error fetching from dashboard stats:', error.message);
        }
        
        // Third approach: Try to get attendance by date
        try {
          console.log('Trying to get attendance by date for recent days');
          
          const today = new Date();
          const lastWeek = new Array(7).fill(0).map((_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          });
          
          let allAttendanceRecords = [];
          
          // Get attendance for recent dates
          for (const date of lastWeek) {
            try {
              let url = `${api.defaults.baseURL}/attendance/date/${date}`;
              if (selectedYear.value) {
                url += `?year=${encodeURIComponent(selectedYear.value)}`;
                if (selectedSection.value) {
                  url += `&section=${encodeURIComponent(selectedSection.value)}`;
                }
              }
              
              const response = await fetch(url, {
                headers: {
                  'Authorization': `Bearer ${token.value}`
                }
              });
              
              if (response.ok) {
                const dateAttendance = await response.json();
                if (Array.isArray(dateAttendance)) {
                  allAttendanceRecords = [...allAttendanceRecords, ...dateAttendance];
                }
              }
            } catch (error) {
              // Silently continue to next date
            }
          }
          
          console.log(`Collected ${allAttendanceRecords.length} attendance records from recent dates`);
          
          if (allAttendanceRecords.length > 0) {
            // Process all attendance records
            const statusCounts = [0, 0, 0]; // [present, late, absent]
            
            allAttendanceRecords.forEach(record => {
              if (record.status === 'present') statusCounts[0]++;
              else if (record.status === 'late') statusCounts[1]++;
              else if (record.status === 'absent') statusCounts[2]++;
            });
            
            console.log('Calculated attendance counts from dates:', statusCounts);
            
            if (statusCounts.some(count => count > 0)) {
              attendanceDistribution = statusCounts;
              return attendanceDistribution;
            }
          }
        } catch (error) {
          console.log('Error fetching attendance by date:', error.message);
        }
        
        // Return empty distribution if all approaches failed
        console.log('All attendance data fetching approaches failed. Using empty distribution.');
        return attendanceDistribution;
      } catch (error) {
        console.error('Error in attendance data fetching:', error);
        return [0, 0, 0];
      }
    };

    const fetchDashboardData = async () => {
      try {
        isLoading.value = true;
        
        // Prepare query parameters using the URL-friendly format
        let queryParts = [];
        if (selectedYear.value) {
          queryParts.push(`year=${encodeURIComponent(selectedYear.value)}`);
        }
        
        if (selectedSection.value) {
          queryParts.push(`section=${encodeURIComponent(selectedSection.value)}`);
        }
        
        if (selectedStartDate.value) {
          queryParts.push(`startDate=${encodeURIComponent(selectedStartDate.value)}`);
        }
        
        if (selectedEndDate.value) {
          queryParts.push(`endDate=${encodeURIComponent(selectedEndDate.value)}`);
        }
        
        const filterParams = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
        console.log('Fetching dashboard data with params:', filterParams || 'none');
        
        // First, fetch attendance data
        const attendanceDistribution = await fetchAttendanceData();
        console.log('Attendance distribution for current filters:', attendanceDistribution);
        
        // Get dashboard stats
        const statsUrl = `${api.defaults.baseURL}/dashboard/stats${filterParams}`;
        console.log('Fetching dashboard stats from URL:', statsUrl);
        
        let statsData = {};
        try {
          const response = await fetch(statsUrl, {
            headers: {
              'Authorization': `Bearer ${token.value}`
            }
          });
          
          if (response.ok) {
            statsData = await response.json();
            console.log('Dashboard stats response:', statsData);
          } else {
            console.warn(`Dashboard stats API returned status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error fetching dashboard stats:', error.message);
        }
        
        // Initialize data value with defaults and merge with stats data
        data.value = {
          totalStudents: statsData.totalStudents || 0,
          totalTeachers: statsData.totalTeachers || 0,
          activeSections: statsData.activeSections || 0,
          attendanceDistribution: attendanceDistribution || [0, 0, 0],
          assessmentTypes: [],
          performanceTrends: [],
          sections: []
        };
        
        // Check if we received any meaningful data
        const hasValidData = 
          (data.value.totalStudents > 0) || 
          (data.value.totalTeachers > 0) || 
          (data.value.activeSections > 0) || 
          (attendanceDistribution && attendanceDistribution.some(val => val > 0));
        
        // If no valid data, it means the filter combination doesn't match any records
        if (!hasValidData && (selectedYear.value || selectedSection.value)) {
          console.warn('No data found for the selected filters');
        }
        
        // Update basic stats
        totalStudents.value = data.value.totalStudents;
        totalTeachers.value = data.value.totalTeachers;
        activeSections.value = data.value.activeSections;
        
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
        
        // Calculate averageScore from assessment data
        if (data.value.assessmentTypes && Array.isArray(data.value.assessmentTypes)) {
          let totalScore = 0;
          let totalCount = 0;
          
          data.value.assessmentTypes.forEach(type => {
            if (type.averageScore > 0 && type.count > 0) {
              totalScore += type.averageScore * type.count;
              totalCount += type.count;
            }
          });
          
          if (totalCount > 0) {
            averageScore.value = Math.round(totalScore / totalCount);
            data.value.averageScore = averageScore.value;
          } else {
            averageScore.value = 0;
            data.value.averageScore = 0;
          }
          
          console.log(`Calculated average score: ${averageScore.value}% from ${totalCount} assessments`);
        } else {
          averageScore.value = 0;
          data.value.averageScore = 0;
        }

        // Update charts with new data
          updateCharts(data.value);
        
        lastUpdate.value = new Date();
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        
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
    
    // Fetch assessment data directly with better approach
    const fetchAssessmentData = async () => {
      try {
        console.log('Fetching assessment data for filters:', {
          year: selectedYear.value || 'All',
          section: selectedSection.value || 'All',
          startDate: selectedStartDate.value,
          endDate: selectedEndDate.value
        });
        
        // Test directly with fetch to avoid axios URL encoding issues on Windows
        const params = new URLSearchParams();
        
        // Add params only if they exist
        if (selectedYear.value) params.append('year', selectedYear.value);
        if (selectedSection.value) params.append('section', selectedSection.value);
        if (selectedStartDate.value) params.append('startDate', selectedStartDate.value);
        if (selectedEndDate.value) params.append('endDate', selectedEndDate.value);
        
        // Build the URL with query string
        const queryString = params.toString();
        const url = `${api.defaults.baseURL}/assessments${queryString ? '?' + queryString : ''}`;
        
        console.log('Fetching assessments from URL:', url);
        
        // Make the direct fetch request
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
        
        let assessments = [];
        
        if (response.ok) {
          assessments = await response.json();
          console.log('Fetched assessments count:', assessments?.length || 0);
        } else {
          console.error('Assessments API failed with status:', response.status);
          throw new Error(`API error: ${response.status}`);
        }
        
        if (Array.isArray(assessments) && assessments.length > 0) {
          console.log('Successfully fetched assessment data');
          
          // Process the assessment data
          const assessmentTypes = {
            'Quiz': { count: 0, totalScore: 0, scores: [] },
            'Activity': { count: 0, totalScore: 0, scores: [] },
            'Performance Task': { count: 0, totalScore: 0, scores: [] }
          };
          
          // Log sample assessment data to understand structure
          console.log('Sample assessment data:', assessments.slice(0, 1));
          
          // Process each assessment
          assessments.forEach(assessment => {
            // Make sure we have a type - default to "Other" if none found
            const type = assessment.type || assessment.assessmentType || assessment.assessment_type || 'Other';
            
            // Initialize type if it doesn't exist
            if (!assessmentTypes[type]) {
              assessmentTypes[type] = { count: 0, totalScore: 0, scores: [] };
            }
            
            // Increment count for this type
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
              
              // Filter for valid scores and calculate percentages
              const validScores = scoreArray.filter(score => typeof score === 'number');
              validScores.forEach(score => {
                const percentage = assessment.maxScore ? (score / assessment.maxScore) * 100 : score;
                assessmentTypes[type].totalScore += percentage;
                assessmentTypes[type].scores.push(percentage);
              });
            }
          });
          
          // Calculate averages and prepare for chart
          data.value.assessmentTypes = Object.keys(assessmentTypes)
            .filter(type => assessmentTypes[type].count > 0) // Only include types with data
            .map(type => {
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
          
          console.log(`Assessment types processed:`, 
            data.value.assessmentTypes.map(t => `${t.type}: ${t.count} assessments, avg ${t.averageScore}%`));
          
          // Generate performance trends from assessment data
          data.value.performanceTrends = assessments
            .filter(a => a.date || a.assessmentDate || a.assessment_date) // Only include assessments with dates
            .map(assessment => {
              // Get the date - check various possible field names
              const date = assessment.date || assessment.assessmentDate || assessment.assessment_date;
              
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
                date: date,
                title: assessment.name || assessment.title || assessment.type || 'Assessment',
                averageScore: Math.round(averageScore),
                type: assessment.type || assessment.assessmentType || 'Assessment'
              };
            })
            .filter(trend => trend.date && trend.averageScore > 0) // Only keep trends with dates and scores
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
          
          console.log(`Performance trends processed: ${data.value.performanceTrends.length} data points with dates and scores`);
          
          // Process section data if available
          // Group assessments by section
          const sectionPerformance = {};
          
          // Only process section performance if we actually have data
          if (assessments.length > 0) {
            assessments.forEach(assessment => {
              const section = assessment.section || assessment.sectionName || '';
              if (section) {
                if (!sectionPerformance[section]) {
                  sectionPerformance[section] = {
                    totalScore: 0,
                    scoreCount: 0,
                    assessmentCount: 0
                  };
                }
                
                sectionPerformance[section].assessmentCount++;
                
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
                  
                  // Process valid scores
                  const validScores = scoreArray.filter(score => typeof score === 'number');
                  validScores.forEach(score => {
                    const percentage = assessment.maxScore ? (score / assessment.maxScore) * 100 : score;
                    sectionPerformance[section].totalScore += percentage;
                    sectionPerformance[section].scoreCount++;
                  });
                }
              }
            });
            
            // Prepare section data for chart if we have any
            if (Object.keys(sectionPerformance).length > 0) {
              data.value.sections = Object.keys(sectionPerformance)
                .filter(sectionName => sectionPerformance[sectionName].scoreCount > 0) // Only include sections with scores
                .map(sectionName => {
                  const section = sectionPerformance[sectionName];
                  const averageScore = section.scoreCount > 0 
                    ? section.totalScore / section.scoreCount 
                    : 0;
                  
                  return {
                    name: sectionName,
                    averageScore: Math.round(averageScore),
                    attendanceRate: 0, // We don't have this data
                    performance: Math.round(averageScore), // For backward compatibility
                    assessmentCount: section.assessmentCount
                  };
                });
              
              console.log(`Section data processed: ${data.value.sections.length} sections with performance data`);
            }
          }
        } else {
          console.warn('No assessment data found for the selected filters');
          // Set default values
          data.value.assessmentTypes = [
            { type: 'Quiz', averageScore: 0, count: 0 },
            { type: 'Activity', averageScore: 0, count: 0 },
            { type: 'Performance Task', averageScore: 0, count: 0 }
          ];
          data.value.performanceTrends = [];
          data.value.sections = [];
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
      updateAssessmentTypePerformanceChart(data);
    };

    // Update initEmptyCharts to properly handle chart destruction
    const initEmptyCharts = () => {
      // First destroy any existing charts to prevent "Canvas is already in use" errors
      const charts = [
        performanceChart.value, 
        assessmentTypeChart.value, 
        performanceTrendChart.value,
        assessmentTypePerformanceChart.value
      ];
      
      // Destroy all existing charts first
      charts.forEach(canvas => {
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const existingChart = Chart.getChart(ctx);
        if (existingChart) {
          existingChart.destroy();
        }
      }
        }
      });
      
      // Create empty data structure
      const emptyData = {
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
      
      // Update charts with empty data
      updateCharts(emptyData);
    };

    // Format date for display
    const formatDate = (date) => {
      if (!date) return '';
      return moment(date).format('MMMM D, YYYY h:mm A');
    };

    // Handle year change
    const handleYearChange = async () => {
      console.log('Year changed to:', selectedYear.value);
      
      // Reset the section when year changes
      selectedSection.value = '';
      
      // Update sections based on the new year
      await updateSectionsForSelectedYear();
      
      // Update dashboard data with new filters
      await fetchDashboardData();
    };

    // Handle section change
    const handleSectionChange = async () => {
      // Update dashboard data with new filters
      fetchDashboardData();
    };

    // Handle filter change
    const handleFilterChange = () => {
      fetchDashboardData();
    };

    // Clear all filters
    const clearFilters = () => {
      console.log('Clearing all filters');
      
      // Reset all filter values
      selectedYear.value = '';
      selectedSection.value = '';
      selectedStartDate.value = '';
      selectedEndDate.value = '';
      
      // Reset sections 
      sections.value = [];
      
      // Refresh the dashboard with no filters
      fetchAvailableFilters().then(() => {
        console.log('Available filters refreshed, fetching dashboard data');
        fetchDashboardData();
      });
    };

    // Get filter display text
    const getFilterDisplay = () => {
      const filters = []
      if (selectedYear.value) filters.push(selectedYear.value)
      if (selectedSection.value) filters.push(selectedSection.value)
      
      // Add date range to display if selected
      if (selectedStartDate.value && selectedEndDate.value) {
        const formattedStart = moment(selectedStartDate.value).format('MMM D')
        const formattedEnd = moment(selectedEndDate.value).format('MMM D, YYYY')
        filters.push(`${formattedStart} - ${formattedEnd}`)
      } else if (selectedStartDate.value) {
        filters.push(`From ${moment(selectedStartDate.value).format('MMM D, YYYY')}`)
      } else if (selectedEndDate.value) {
        filters.push(`Until ${moment(selectedEndDate.value).format('MMM D, YYYY')}`)
      }
      
      return filters.length > 0 ? filters.join(' - ') : 'Filter View'
    };

    // Update charts with data
    const updatePerformanceChart = (data) => {
      if (!performanceChart.value) return;
      
      const ctx = performanceChart.value.getContext('2d');
      if (!ctx) return;
      
      // Dispose of existing chart if it exists
      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();
      
      // Attendance status distribution data
      const attendanceLabels = ['Present', 'Late', 'Absent'];
      let attendanceData = data.attendanceDistribution || [0, 0, 0];
      
      // Log attendance data for debugging
      console.log('Raw attendance data:', attendanceData);
      
      // Ensure each value is a number
      attendanceData = attendanceData.map(val => (typeof val === 'number') ? val : 0);
      
      // Ensure we have at least some data to display
      const totalAttendanceCount = attendanceData.reduce((a, b) => a + b, 0);
      
      // Check if we have valid data to show
      const hasValidData = totalAttendanceCount > 0;
      
      // Log for debugging
      console.log('Final attendance distribution data:', attendanceData, 'hasValidData:', hasValidData);
      
      // Create chart
      if (hasValidData) {
        new Chart(ctx, {
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
      } else {
        // Create an empty chart with "No data available" message
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['No Data'],
            datasets: [{
              data: [1],
              backgroundColor: ['#e2e8f0'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              }
            }
          }
        });
      }
    };

    const updateAssessmentTypeChart = (data) => {
      if (!assessmentTypeChart.value) return;
      
      const ctx = assessmentTypeChart.value.getContext('2d');
      if (!ctx) return;
      
      // Dispose of existing chart if it exists
      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();
      
      // Assessment types data
      const assessmentData = data.assessmentTypes || [];
      const labels = [];
      const values = [];
      const counts = [];
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
      
      try {
        // Extract assessment types data
        if (Array.isArray(assessmentData) && assessmentData.length > 0) {
          // If array format
          assessmentData.forEach((item, index) => {
            if (item && typeof item === 'object') {
              // Only include items with a count > 0
              if (item.count > 0) {
                labels.push(item.type || `Type ${index + 1}`);
                values.push(parseFloat(item.averageScore) || 0);
                counts.push(item.count || 0);
              }
            }
          });
        } else if (typeof assessmentData === 'object' && assessmentData !== null) {
          // If object format
          Object.entries(assessmentData).forEach(([type, data], index) => {
            if (data.count > 0) {
              labels.push(type);
              values.push(parseFloat(data.averageScore) || 0);
              counts.push(data.count || 0);
            }
          });
        }
        
        console.log(`Assessment type chart data: ${labels.length} types with data`);
        console.log('Assessment types:', labels);
        console.log('Average scores:', values);
        console.log('Assessment counts:', counts);
        
        // If no data was extracted, use default types
        if (labels.length === 0) {
          labels.push('Quiz', 'Activity', 'Performance Task');
          values.push(0, 0, 0);
          counts.push(0, 0, 0);
        }
      } catch (error) {
        console.error('Error processing assessment data:', error);
        // Fallback to default labels and values
        labels.push('Quiz', 'Activity', 'Performance Task');
        values.push(0, 0, 0);
        counts.push(0, 0, 0);
      }
      
      // Check if we have any valid data
      const hasData = labels.length > 0 && values.some(v => v > 0);
      
      // Create chart
      new Chart(ctx, {
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
                  const type = labels[context.dataIndex];
                  const count = counts[context.dataIndex];
                  return `${type}: ${context.raw}% (${count} assessments)`;
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
    };

    const updatePerformanceTrendChart = (data) => {
      if (!performanceTrendChart.value) return;
      
      const ctx = performanceTrendChart.value.getContext('2d');
      if (!ctx) return;
      
      // Properly destroy any existing chart
      const existingChart = Chart.getChart(ctx);
      if (existingChart) existingChart.destroy();

      let trends = [];
      if (data.performanceTrends && Array.isArray(data.performanceTrends)) {
        // Filter out trends that have no valid score or date
        trends = data.performanceTrends
          .filter(trend => 
            trend.date && 
            (typeof trend.averageScore === 'number' || typeof trend.score === 'number')
          )
          .map(trend => ({
            date: new Date(trend.date),
            value: parseFloat(trend.averageScore || trend.score) || 0,
            name: trend.title || trend.name || 'Assessment'
          }))
          .sort((a, b) => a.date - b.date);
      }
      
      console.log(`Performance trend chart data: ${trends.length} valid data points`);
      
      // Check if we have any valid data points
      const hasData = trends.length > 0 && trends.some(t => t.value > 0);
      
      if (hasData) {
        // Create new chart after destroying the old one
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: trends.map(trend => moment(trend.date).format('MMM D, YYYY')),
            datasets: [{
              label: 'Average Score',
              data: trends.map(trend => trend.value),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: 'rgb(59, 130, 246)',
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  title: (tooltipItems) => {
                    if (!tooltipItems.length || !trends[tooltipItems[0].dataIndex]) return '';
                    const trend = trends[tooltipItems[0].dataIndex];
                    return `${moment(trend.date).format('MMM D, YYYY')} - ${trend.name}`;
                  },
                  label: (context) => {
                    return `Score: ${context.raw.toFixed(1)}%`;
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
                  text: 'Average Score (%)'
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
      } else {
        // Create an empty chart to show the "No data available" message
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: 'Average Score',
              data: [],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
              title: {
                display: true,
                  text: 'Average Score (%)'
                }
              }
            }
          }
        });
      }
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
      let hasValidData = false;
      if (Array.isArray(data.performanceTrends)) {
        data.performanceTrends.forEach(trend => {
          // Only process trends with valid scores and dates
          if (trend.date && (typeof trend.averageScore === 'number' || typeof trend.score === 'number')) {
            const type = trend.type || trend.title || 'Other';
            const score = parseFloat(trend.averageScore || trend.score) || 0;
            
            // Create the array for this type if it doesn't exist
            if (!trendsByType[type]) {
              trendsByType[type] = [];
            }
            
            trendsByType[type].push({
              date: new Date(trend.date),
              score: score
            });
            
            if (score > 0) {
              hasValidData = true;
            }
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
      
      // Only proceed if we have valid dates
      if (allDates.length > 0 && hasValidData) {
        console.log(`Assessment type performance chart: ${allDates.length} dates with data`);
        
        // Create datasets
        const datasets = Object.entries(trendsByType)
          .filter(([_, data]) => data.length > 0) // Only include types with data
          .map(([type, data], index) => {
            const colors = [
              'rgb(52, 211, 153)',   // Green for Quiz
              'rgb(59, 130, 246)',   // Blue for Activity
              'rgb(251, 191, 36)'    // Yellow for Performance Task
            ];
            const color = colors[index % colors.length];
  
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
      } else {
        // Create an empty chart if no valid data
        console.log('No valid assessment type performance data, showing empty chart');
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: 'No Data',
              data: [],
              borderColor: 'rgb(203, 213, 225)',
              backgroundColor: 'rgba(203, 213, 225, 0.1)'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
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
              }
            }
          }
        });
      }
    };

    // Update the refreshDashboard function to properly handle chart destruction
    const refreshDashboard = async () => {
      try {
        isLoading.value = true;
        
        // Destroy existing charts before fetching new data
        initEmptyCharts();
        
        // Wait a tick to ensure DOM updates
        await nextTick();
        
        // Fetch new data
        await fetchDashboardData();
        
        // Update the last refresh time
        lastUpdate.value = new Date();
      } catch (error) {
        console.error('Error refreshing dashboard:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const scrollToSection = (sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Restore auto-refresh in onMounted function
    onMounted(async () => {
      try {
        // Make sure DOM is rendered before initializing charts
        await nextTick();

        console.log('Dashboard mounted, initializing');
        
        // Initialize with empty data while waiting for API
        initEmptyCharts();
        
        // Set up API interceptor to handle 404 errors gracefully
        api.interceptors.response.use(
          response => response,
          error => {
            if (error.response && error.response.status === 404) {
              console.warn(`API endpoint not found: ${error.config.url}`);
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
        
        // Ensure all available years are set properly
        if (availableYears.value.length === 0) {
          availableYears.value = ['1st', '2nd', '3rd', '4th'];
        }
        
        // Fetch dashboard data
        await fetchDashboardData();
        
        // Set up auto-refresh
        if (autoRefreshInterval.value) {
          clearInterval(autoRefreshInterval.value);
        }
        
        // Refresh every 5 minutes, but only if tab is visible
        autoRefreshInterval.value = setInterval(() => {
          if (document.visibilityState === 'visible') {
            refreshDashboard();
          }
        }, 5 * 60 * 1000); // 5 minutes
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Make sure we still have empty charts if data loading fails
        await nextTick();
        initEmptyCharts();
      }
    });

    // Clean up on component unmount
    onUnmounted(() => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value);
      }
    });

    // Add watch for date changes
    watch([selectedStartDate, selectedEndDate], () => {
      if (selectedStartDate.value && selectedEndDate.value) {
        // Validate date range
        const start = moment(selectedStartDate.value);
        const end = moment(selectedEndDate.value);
        
        if (end.isBefore(start)) {
          selectedEndDate.value = selectedStartDate.value;
        }
      }
    });

    return {
      performanceChart,
      assessmentTypeChart,
      performanceTrendChart,
      assessmentTypePerformanceChart,
      selectedYear,
      selectedSection,
      sections,
      subjects,
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
      selectedStartDate,
      selectedEndDate,
      today
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