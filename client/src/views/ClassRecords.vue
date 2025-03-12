<template>
  <div class="class-records">
    <!-- Control Buttons and Date Navigation -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex gap-2">
        <button class="btn btn-primary" @click="openAddStudentRecordModal">
          <i class="fas fa-user-plus"></i> Add Student Record
        </button>
        <button class="btn btn-primary" @click="showAddAssessmentModal = true">
          <i class="fas fa-plus"></i> Add Assessment
        </button>
      </div>
      <!-- Add date navigation controls -->
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-primary" @click="navigateDate(-1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="date-display">
          {{ formatDateForDisplay(currentDate) }}
        </div>
        <button 
          class="btn btn-outline-primary" 
          @click="navigateDate(1)"
          :disabled="isNextDayDisabled"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Records Table -->
    <div class="card">
      <div class="card-body">
        <!-- Table Controls -->
        <div class="table-controls mb-4">
          <div class="d-flex gap-3 align-items-center">
            <div class="d-flex gap-3">
              <!-- Sort Dropdown -->
              <div class="dropdown">
                <button class="btn btn-control" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-sort me-2"></i> Sort by
                </button>
                <ul class="dropdown-menu control-menu">
                  <li>
                    <a class="dropdown-item d-flex align-items-center" href="#" @click="sortBy('studentNumber')">
                      <i class="fas fa-sort me-2"></i> Student Number
                      <i :class="getSortIcon('studentNumber')" class="ms-auto"></i>
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item d-flex align-items-center" href="#" @click="sortBy('lastName')">
                      <i class="fas fa-sort-alpha-down me-2"></i> Name
                      <i :class="getSortIcon('lastName')" class="ms-auto"></i>
                    </a>
                  </li>
                </ul>
              </div>

              <!-- Filter Dropdown -->
              <div class="dropdown">
                <button class="btn btn-control" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-filter me-2"></i> Filter
                  <span v-if="hasActiveFilters" class="filter-badge">!</span>
                </button>
                <div class="dropdown-menu control-menu p-3" style="width: 280px">
                  <h6 class="dropdown-header mb-2">Filter Options</h6>
                  <div class="mb-3">
                    <label class="form-label">Year Level</label>
                    <select class="form-select form-select-sm" v-model="selectedYear" @change="applyFilters">
                      <option value="">All Years</option>
                      <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Section</label>
                    <select class="form-select form-select-sm" v-model="selectedSection" @change="applyFilters" :disabled="!selectedYear">
                      <option value="">All Sections</option>
                      <option v-for="section in availableSections" :key="section" :value="section">{{ section }}</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Subject</label>
                    <select class="form-select form-select-sm" v-model="selectedSubject" @change="applyFilters" :disabled="!selectedSection">
                      <option value="">All Subjects</option>
                      <option v-for="subject in teacherSubjects" :key="subject" :value="subject">{{ subject }}</option>
                    </select>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-3">
                    <button class="btn btn-sm btn-light" @click="clearFilters">
                      Clear All
                    </button>
                    <button class="btn btn-sm btn-primary" @click="applyFilters">
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Search Control -->
            <div class="search-control">
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="searchQuery"
                  placeholder="Search students..."
                  @input="handleSearch"
                >
                <button 
                  v-if="searchQuery"
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="clearSearch"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Student Number</th>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th v-for="assessment in filteredAssessmentsByDate" :key="assessment.id">
                    <div class="assessment-header" @click="editAssessment(assessment)">
                        {{ assessment.type }} {{ assessment.number }}
                        <br>
                        <small>({{ assessment.maxScore }} pts)</small>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
              <template v-if="paginatedStudents.length > 0">
                  <tr 
                  v-for="student in paginatedStudents" 
                    :key="student.studentNumber"
                    @click="viewStudentDetails(student)"
                    class="clickable-row"
                  >
                    <td>{{ student.studentNumber }}</td>
                    <td>{{ student.lastName }}</td>
                    <td>{{ student.firstName }}</td>
                    <td v-for="assessment in filteredAssessmentsByDate" :key="assessment.id">
                      <input 
                        type="number" 
                        class="form-control form-control-sm score-input"
                        :value="getStudentScore(student, assessment)"
                        :max="assessment.maxScore"
                        min="0"
                        @input="updateScore(student, assessment, $event.target.value)"
                        @click.stop
                      >
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colspan="5" class="text-center py-4">
                    <div class="empty-state-message">
                      <i class="fas fa-users text-muted mb-2"></i>
                      <p class="mb-0">No students found</p>
                      <p class="text-muted small" v-if="hasActiveFilters">
                        Try adjusting your filters
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        <!-- Pagination Controls -->
        <div class="pagination-controls mt-3 d-flex justify-content-between align-items-center">
          <div class="pagination-info">
            Showing {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ sortedStudents.length }} entries
          </div>
          <div class="pagination-buttons">
            <button 
              class="btn btn-outline-primary me-2" 
              @click="previousPage" 
              :disabled="currentPage === 1"
            >
              <i class="fas fa-chevron-left me-1"></i> Previous
            </button>
            <button 
              class="btn btn-outline-primary" 
              @click="nextPage" 
              :disabled="currentPage >= totalPages"
            >
              Next <i class="fas fa-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Student Record Modal -->
    <div v-if="showAddStudentRecordModal" class="modal-overlay">
      <div class="modal-wrapper" @click.stop>
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Student Record</h5>
              <button type="button" class="btn-close" @click="showAddStudentRecordModal = false"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="handleAddStudentRecord">
                <!-- Year Selection -->
                <div class="mb-3">
                  <label class="form-label">Year</label>
                  <select class="form-select" v-model="newStudentRecord.year" required>
                    <option value="">Select Year</option>
                    <template v-if="availableYears.length > 0">
                      <option v-for="year in availableYears" :key="year" :value="year">
                        {{ year }}
                      </option>
                    </template>
                    <option v-else disabled>No available years</option>
                  </select>
                </div>
                <!-- Section Selection -->
                <div class="mb-3">
                  <label class="form-label">Section</label>
                  <select class="form-select" v-model="newStudentRecord.section" :disabled="!newStudentRecord.year" required>
                    <option value="">Select Section</option>
                    <template v-if="filteredSections.length > 0">
                      <option v-for="section in filteredSections" :key="section" :value="section">
                        {{ section }}
                      </option>
                    </template>
                    <option v-else disabled>No available sections</option>
                  </select>
                </div>
                <!-- Subject Selection -->
                <div class="mb-3">
                  <label class="form-label">Subject</label>
                  <select class="form-select" v-model="newStudentRecord.subject" :disabled="!newStudentRecord.section" required>
                    <option value="">Select Subject</option>
                    <template v-if="teacherSubjects.length > 0">
                      <option v-for="subject in teacherSubjects" :key="subject" :value="subject">
                        {{ subject }}
                      </option>
                    </template>
                    <option v-else disabled>No available subjects</option>
                  </select>
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button type="button" class="btn btn-secondary" @click="showAddStudentRecordModal = false">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary" :disabled="!canAddStudentRecord">
                    Add Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="showAddStudentRecordModal = false"></div>
    </div>

    <!-- Add Assessment Modal -->
    <div v-if="showAddAssessmentModal" class="modal-overlay">
      <div class="modal-wrapper">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Add Assessment</h5>
              <button type="button" class="btn-close" @click="showAddAssessmentModal = false"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="handleAddAssessment">
                <!-- Assessment Type -->
                <div class="mb-3">
                  <label class="form-label">Type</label>
                  <select class="form-select" v-model="newAssessment.type" required>
                    <option value="">Select Type</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Activity">Activity</option>
                    <option value="Performance Task">Performance Task</option>
                  </select>
                </div>

                <!-- Assessment Number -->
                <div class="mb-3">
                  <label class="form-label">Number</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model="newAssessment.number"
                    min="1"
                    required
                  >
                </div>

                <!-- Max Score -->
                <div class="mb-3">
                  <label class="form-label">Maximum Score</label>
                  <input 
                    type="number" 
                    class="form-control" 
                    v-model="newAssessment.maxScore"
                    min="1"
                    required
                  >
                </div>

                <div class="text-end">
                  <button type="button" class="btn btn-secondary me-2" @click="showAddAssessmentModal = false">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Add Assessment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="showAddAssessmentModal = false"></div>
    </div>

    <!-- Student Details Modal -->
    <StudentDetailsModal
      :show="!!selectedStudent"
      :student="selectedStudent || {}"
      :year-level="selectedYear"
      :section="selectedSection"
      :subject="selectedSubject"
      title="Student Performance Details"
      chart-title="Assessment Performance"
      history-title="Assessment History"
      :table-headers="['Date', 'Assessment', 'Score', 'Percentage']"
      :chart-id="`performanceChart-${selectedStudent?.studentNumber}`"
      :is-class-record="true"
      @update:show="(value) => !value && (selectedStudent = null)"
      @close="selectedStudent = null"
      @date-filter-change="handleDateFilterChange"
      @assessment-type-change="handleAssessmentTypeChange"
    >
      <template #history-table>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Assessment</th>
              <th>Score</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!selectedStudent?.assessmentHistory || selectedStudent.assessmentHistory.length === 0">
              <td colspan="4" class="text-center py-3 text-muted">
                <i class="fas fa-info-circle me-2"></i>No assessment records found.
              </td>
            </tr>
            <tr v-for="record in selectedStudent?.assessmentHistory" :key="record.date + record.type">
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ record.type }}</td>
              <td>{{ record.score }}/{{ record.maxScore }}</td>
              <td>
                <span 
                  class="badge"
                  :class="{
                    'bg-success': record.percentage >= 90,
                    'bg-primary': record.percentage >= 80 && record.percentage < 90,
                    'bg-warning': record.percentage >= 75 && record.percentage < 80,
                    'bg-danger': record.percentage < 75
                  }"
                >
                  {{ record.percentage.toFixed(1) }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </StudentDetailsModal>

    <!-- Chart Date Filter Modal -->
    <teleport to="body" v-if="showChartDateFilter">
      <div class="modal-overlay">
        <div class="modal-wrapper">
          <div class="modal-dialog modal-sm">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Filter Chart Date Range</h5>
                <button type="button" class="btn-close" @click="showChartDateFilter = false"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Start Date</label>
                  <input type="date" class="form-control" v-model="chartDateRange.start">
                </div>
                <div class="mb-3">
                  <label class="form-label">End Date</label>
                  <input type="date" class="form-control" v-model="chartDateRange.end">
                </div>
                </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="clearChartDateFilter">Clear</button>
                <button type="button" class="btn btn-primary" @click="applyChartDateFilter">Apply</button>
            </div>
          </div>
        </div>
        <div class="modal-backdrop" @click="showChartDateFilter = false"></div>
        </div>
      </div>
    </teleport>

    <!-- History Date Filter Modal -->
    <teleport to="body" v-if="showHistoryDateFilter">
      <div class="modal-overlay">
        <div class="modal-wrapper">
          <div class="modal-dialog modal-sm">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Filter History Date Range</h5>
                <button type="button" class="btn-close" @click="showHistoryDateFilter = false"></button>
              </div>
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label">Start Date</label>
                  <input type="date" class="form-control" v-model="historyDateRange.start">
                </div>
                <div class="mb-3">
                  <label class="form-label">End Date</label>
                  <input type="date" class="form-control" v-model="historyDateRange.end">
                </div>
                </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" @click="clearHistoryDateFilter">Clear</button>
                <button type="button" class="btn btn-primary" @click="applyHistoryDateFilter">Apply</button>
            </div>
          </div>
        </div>
        <div class="modal-backdrop" @click="showHistoryDateFilter = false"></div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import moment from 'moment-timezone'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment'
import StudentDetailsModal from '@/components/modals/StudentDetailsModal.vue'

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Accept all status codes from 200-499
  }
});

// Add request interceptor for logging
api.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data || config.params);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error Response: ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error('API No Response:', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default {
  name: 'ClassRecords',
  components: {
    StudentDetailsModal
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const user = ref(store.state.auth.user || null)
    
    // Add user profile fetching
    const fetchUserProfile = async () => {
      try {
        console.log('Fetching user profile...');
        const response = await api.get('/users/profile', {
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });
        
        console.log('User profile response:', response.data);
        user.value = response.data;
        
        // Check if user is a teacher
        if (!user.value || user.value.role !== 'teacher') {
          console.log('User is not a teacher:', user.value?.role);
          router.push('/dashboard');
          return;
        }
        
        // Log teaching year and subjects
        console.log('Teaching year:', user.value.teachingYear);
        console.log('Subjects:', user.value.subjects);
        
        // If teaching year is not set, default to '1st'
        if (!user.value.teachingYear) {
          console.log('Teaching year not set, defaulting to 1st');
          user.value.teachingYear = '1st';
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        router.push('/login');
      }
    };

    // Call fetchUserProfile when component mounts
    onMounted(async () => {
      try {
        console.log('Component mounted, fetching user profile and subjects');
        await fetchUserProfile();
        console.log('User profile fetched, now fetching user preferences');
        
        // First check localStorage for preferences
        const localPrefs = localStorage.getItem('classRecordPreferences');
        if (localPrefs) {
          try {
            const prefs = JSON.parse(localPrefs);
            console.log('Found preferences in localStorage:', prefs);
            
            // Apply local preferences immediately
            if (prefs.selectedYear) selectedYear.value = prefs.selectedYear;
            if (prefs.selectedSection) selectedSection.value = prefs.selectedSection;
            if (prefs.selectedSubject) selectedSubject.value = prefs.selectedSubject;
            if (prefs.currentPage) currentPage.value = parseInt(prefs.currentPage) || 1;
          } catch (parseError) {
            console.error('Error parsing localStorage preferences:', parseError);
          }
        } else {
          // If no preferences in localStorage, try to load last used filters
          await loadLastUsedFilters();
        }
        
        // Then fetch from API
        await fetchUserPreferences();
        
        // Ensure we have the necessary data to fetch records
        if (selectedYear.value && selectedSection.value && selectedSubject.value) {
          console.log('Fetching available sections for year:', selectedYear.value);
          await fetchAvailableSections();
          
          console.log('Updating teacher subjects for section:', selectedSection.value);
          await updateTeacherSubjects();
          
          console.log('Fetching class data for subject:', selectedSubject.value);
          await fetchClassData();
        } else {
          console.log('Missing required filters, cannot fetch class data');
          // Try to load last used filters if we still don't have them
          if (!selectedYear.value || !selectedSection.value || !selectedSubject.value) {
            await loadLastUsedFilters();
            
            // Try again with the loaded filters
            if (selectedYear.value) {
              await fetchAvailableSections();
              
              if (selectedSection.value) {
                await updateTeacherSubjects();
                
                if (selectedSubject.value) {
                  await fetchClassData();
                }
              }
            }
          }
        }
        
        console.log('Initial data loading complete');
      } catch (error) {
        console.error('Error during component initialization:', error);
      }
    });

    const selectedYear = ref('');
    const selectedSection = ref('');
    const selectedSubject = ref('');
    const searchQuery = ref('');
    const students = ref([]);
    const assessments = ref([]);
    const currentDate = ref(moment().tz('Asia/Manila').startOf('day').toDate());
    const showAddAssessmentModal = ref(false);
    const selectedStudent = ref(null);
    const quizChart = ref(null);
    const activityChart = ref(null);
    const performanceChart = ref(null);
    const showAddStudentRecordModal = ref(false);
    const showSearch = ref(false);
    const sortField = ref('');
    const sortOrder = ref('asc');
    const newStudentRecord = ref({
      year: '',
      section: '',
      subject: ''
    });

    // Add new refs for filters
    const selectedAssessmentType = ref('');
    const showChartDateFilter = ref(false);
    const showHistoryDateFilter = ref(false);
    const chartDateRange = ref({
      start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD')
    });
    const historyDateRange = ref({
      start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
      end: moment().format('YYYY-MM-DD')
    });

    const newAssessment = ref({
      type: '',
      number: '',
      maxScore: ''
    })

    // State for available years, sections, and subjects
    const availableYears = ref([])
    const availableSections = ref([])
    const sectionsByYear = ref({})
    const teacherSubjects = ref([])

    const teachingYear = computed(() => {
      console.log('User object:', user.value);
      console.log('Teaching year:', user.value?.teachingYear);
      return user.value?.teachingYear || 'N/A';
    });

    // Get available subjects based on teaching year
    const availableSubjects = computed(() => {
      const year = teachingYear.value
      switch (year) {
        case '1st':
          return ['ITE 100', 'ITE 101', 'ITE 102', 'ITE 103']
        case '2nd':
          return ['ITE 200', 'ITE 201', 'ITE 202', 'ITE 203']
        case '3rd':
          return ['ITE 301', 'ITE 302', 'ITE 303', 'ITE 304']
        case '4th':
          return ['ITE 400', 'ITE 401', 'ITE 402', 'ITE 403', 'ITE 404']
        default:
          return []
      }
    })

    // Filter students
    const filteredStudents = computed(() => {
      return students.value.filter(student => {
        const searchLower = searchQuery.value.toLowerCase()
        return (
          student.studentNumber.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        )
      })
    })

    // Sort students
    const sortedStudents = computed(() => {
      let sortedList = [...filteredStudents.value]

      if (sortField.value) {
        sortedList.sort((a, b) => {
          let aVal = a[sortField.value]
          let bVal = b[sortField.value]

          // Handle case-insensitive string comparison
          if (typeof aVal === 'string') aVal = aVal.toLowerCase()
          if (typeof bVal === 'string') bVal = bVal.toLowerCase()

          if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
          if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
          return 0
        })
      }

      return sortedList
    })

    // Sort functions
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortOrder.value = 'asc'
      }
    }

    const getSortIcon = (field) => {
      if (sortField.value !== field) return 'fas fa-sort'
      return sortOrder.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
    }

    // Search functions
    const toggleSearch = () => {
      showSearch.value = !showSearch.value
      if (!showSearch.value) {
        searchQuery.value = ''
      }
    }

    const handleSearch = () => {
      // Additional search logic can be added here if needed
      console.log('Searching for:', searchQuery.value)
    }

    // Filter functions
    const applyFilters = async () => {
      try {
        console.log('Applying filters:', {
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value
        });
        
        // Save the applied filters as preferences first
        await saveUserPreferences();
        
        // Save to recent filters
        if (selectedYear.value && selectedSection.value && selectedSubject.value) {
          saveToRecentFilters({
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value,
            timestamp: new Date().toISOString()
          });
        }
        
        // Record the timestamp for this filter combination
        try {
          const token = store.state.auth.token;
          const userId = store.state.auth.user?._id;
          
          if (userId && selectedYear.value && selectedSection.value && selectedSubject.value) {
            await api.post('/users/record-filter-usage', {
              userId,
              year: selectedYear.value,
              section: selectedSection.value,
              subject: selectedSubject.value,
              timestamp: new Date().toISOString()
            }, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Filter usage recorded');
          }
        } catch (recordError) {
          console.error('Error recording filter usage:', recordError);
          // Non-critical error, continue with the rest of the function
        }
        
        // Always fetch data when filters are applied, regardless of whether all filters are selected
        await fetchClassData();
        
        // Only fetch assessments if we have all the necessary filters
        if (selectedYear.value && selectedSection.value && selectedSubject.value) {
          await fetchAssessments();
        }
      } catch (error) {
        console.error('Error applying filters:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Try to recover by using localStorage values
        try {
          const localPrefs = localStorage.getItem('classRecordPreferences');
          if (localPrefs) {
            const prefs = JSON.parse(localPrefs);
            console.log('Recovering with localStorage preferences:', prefs);
            
            // Only update if values are different to avoid infinite loops
            let changed = false;
            
            if (prefs.selectedYear && prefs.selectedYear !== selectedYear.value) {
              selectedYear.value = prefs.selectedYear;
              changed = true;
            }
            
            if (prefs.selectedSection && prefs.selectedSection !== selectedSection.value) {
              selectedSection.value = prefs.selectedSection;
              changed = true;
            }
            
            if (prefs.selectedSubject && prefs.selectedSubject !== selectedSubject.value) {
              selectedSubject.value = prefs.selectedSubject;
              changed = true;
            }
            
            // If we made changes, try to fetch data again
            if (changed) {
              console.log('Recovered with localStorage values, fetching data again');
              await fetchClassData();
              
              if (selectedYear.value && selectedSection.value && selectedSubject.value) {
                await fetchAssessments();
              }
            }
          }
        } catch (recoveryError) {
          console.error('Failed to recover with localStorage:', recoveryError);
        }
      }
    };

    // Computed property to check if record can be added
    const canAddStudentRecord = computed(() => {
      return newStudentRecord.value.year && 
             newStudentRecord.value.section && 
             newStudentRecord.value.subject
    })

    // Fetch class data
    const fetchClassData = async () => {
      try {
        if (!selectedYear.value || !selectedSection.value || !selectedSubject.value) {
          console.log('Missing required filters for fetchClassData:', {
            year: selectedYear.value || 'missing',
            section: selectedSection.value || 'missing',
            subject: selectedSubject.value || 'missing'
          });
          students.value = [];
          return;
        }

        // Create a params object with the teacher ID
        const teacherId = store.state.auth.user?._id;
        if (!teacherId) {
          console.error('Teacher ID not available');
          return;
        }
        
        const params = { 
          teacherId,
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value
        };
        
        console.log('Fetching class data with filters:', params);
        
        // Make the API call with the available filters
        const response = await api.get('/teacher-class-records/students', { 
          params,
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });
        
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
          console.log('No students found for the selected filters');
          students.value = [];
          return;
        }
        
        // Map the students and initialize scores
        students.value = response.data.map(student => ({
            ...student,
          scores: {}
        }));

        // Fetch assessments after loading students
        await fetchAssessments();

        console.log('Fetched students:', students.value.length);
      } catch (error) {
        console.error('Failed to fetch class data:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Don't show alert for every error to avoid overwhelming the user
        if (error.response?.status !== 400) {
        alert('Failed to load class data. Please try again.');
        }
        
        students.value = [];
      }
    };

    // Handle adding new assessment
    const handleAddAssessment = async () => {
      try {
        if (!selectedSection.value || !selectedSubject.value) {
          alert('Please select a section and subject first');
          return;
        }

        const teacherId = store.state.auth.user?._id;
        if (!teacherId) {
          console.error('Teacher ID not available');
          return;
        }

        // Use the current table date for the assessment
        const assessment = {
          type: newAssessment.value.type,
          number: parseInt(newAssessment.value.number),
          maxScore: parseInt(newAssessment.value.maxScore),
          teacherId,
          section: selectedSection.value,
          subject: selectedSubject.value,
          date: currentDate.value.toISOString()
        };

        const response = await api.post(
          '/assessments',
          assessment,
          {
            headers: {
              'Authorization': `Bearer ${store.state.auth.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Add the new assessment to the list
        assessments.value.push(response.data);
        
        // Reset form and close modal
        newAssessment.value = {
          type: '',
          number: '',
          maxScore: ''
        };
        showAddAssessmentModal.value = false;
      } catch (error) {
        console.error('Failed to add assessment:', error);
        alert('Failed to add assessment. ' + (error.response?.data?.message || 'Please try again.'));
      }
    };

    // Update the fetchAssessments function
    const fetchAssessments = async () => {
      try {
        if (!selectedSection.value || !selectedSubject.value) {
          console.log('Missing required filters for fetching assessments');
          return;
        }

        const teacherId = store.state.auth.user?._id || user.value?._id;
        const date = moment(currentDate.value).format('YYYY-MM-DD');
        
        console.log('Fetching assessments for:', {
          teacherId,
          section: selectedSection.value,
          subject: selectedSubject.value,
          date
        });

        // Show loading indicator
        const loadingToast = showToast('Loading assessments...', 'info', 0);

        const response = await api.get('/assessments', {
          params: {
            teacherId,
            section: selectedSection.value,
            subject: selectedSubject.value,
            date
          },
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });

        // Hide loading indicator
        hideToast(loadingToast);

        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid response data:', response.data);
          showToast('Failed to load assessments', 'error', 3000);
          return;
        }

        console.log(`Loaded ${response.data.length} assessments`);

        // Sort assessments by date and type
        const sortedAssessments = response.data.sort((a, b) => {
          // First sort by date
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA - dateB;
          }
          
          // If dates are equal, sort by type
          const typeOrder = { 'Quiz': 1, 'Activity': 2, 'Performance Task': 3 };
          if (typeOrder[a.type] !== typeOrder[b.type]) {
            return typeOrder[a.type] - typeOrder[b.type];
          }
          
          // If types are equal, sort by number
          return a.number - b.number;
        });

        // Map the assessments and initialize scores
        assessments.value = sortedAssessments.map(assessment => {
          // Create a title if it doesn't exist
          const title = assessment.title || `${assessment.type} ${assessment.number}`;
          
          return {
            ...assessment,
            id: assessment._id,
            title,
            scores: assessment.scores || {},
            date: assessment.date ? new Date(assessment.date) : new Date()
          };
        });

        console.log('Processed assessments:', assessments.value);

        // If a student is selected, update their assessment data
        if (selectedStudent.value) {
          await viewStudentDetails(selectedStudent.value);
        }

        // Show success message if assessments were loaded
        if (assessments.value.length > 0) {
          showToast(`Loaded ${assessments.value.length} assessments`, 'success', 2000);
        } else {
          showToast('No assessments found for the selected filters', 'info', 3000);
        }
      } catch (error) {
        console.error('Error fetching assessments:', error);
        showToast('Failed to load assessments: ' + (error.message || 'Unknown error'), 'error', 3000);
      }
    };

    // Update the computed property for filtered assessments
    const filteredAssessmentsByDate = computed(() => {
      return assessments.value.filter(assessment => {
        const assessmentDate = new Date(assessment.date);
        const currentDateStart = new Date(currentDate.value);
        currentDateStart.setUTCHours(0, 0, 0, 0);
        currentDateStart.setHours(currentDateStart.getHours() + 8); // Adjust for Philippine timezone
        
        const currentDateEnd = new Date(currentDate.value);
        currentDateEnd.setUTCHours(23, 59, 59, 999);
        currentDateEnd.setHours(currentDateEnd.getHours() + 8); // Adjust for Philippine timezone
        
        return assessmentDate >= currentDateStart && assessmentDate <= currentDateEnd;
      }).sort((a, b) => {
        // Sort by type first
        const typeOrder = { 'Quiz': 1, 'Activity': 2, 'Performance Task': 3 };
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        
        // Then by number
        return a.number - b.number;
      });
    });

    // Add watcher for currentDate to refresh assessments
    watch(currentDate, async () => {
      await fetchAssessments();
    });

    // Update student score
    const updateScore = async (student, assessment, inputValue) => {
      try {
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id;

        if (!teacherId) {
          console.error('Teacher ID not available');
          showToast('Teacher ID not available. Please log in again.', 'error', 3000);
          return;
        }

        // Get the assessment ID
        const assessmentId = assessment._id || assessment.id;
        
        if (!assessmentId) {
          console.error('Assessment ID not available');
          showToast('Assessment ID not available. Please try again.', 'error', 3000);
          return;
        }

        // Get the score from the input field or parameter
        let scoreValue = inputValue;
        if (scoreValue === undefined) {
          scoreValue = student.scores?.[assessmentId];
        }
        
        // Validate score
        if (scoreValue === null || scoreValue === '') {
          // Handle empty score
          scoreValue = null;
          console.log(`Removing score for student ${student.studentNumber}, assessment ${assessmentId}`);
        } else {
          const scoreNum = parseInt(scoreValue);
          if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > assessment.maxScore) {
            showToast(`Please enter a valid score between 0 and ${assessment.maxScore}`, 'error', 3000);
            return;
          }
          scoreValue = scoreNum; // Ensure it's a number
        }

        console.log(`Updating score for student ${student.studentNumber}, assessment ${assessmentId}: ${scoreValue}`);

        // Create the request payload for the new endpoint
        const payload = {
          assessmentId,
          teacherId,
          studentNumber: student.studentNumber,
          score: scoreValue
        };

        console.log('Sending score update request with payload:', payload);

        // Show loading indicator
        const loadingToast = showToast('Updating score...', 'info', 0);

        // Use the new direct score update endpoint
        const response = await api.post(
          `/assessments/update-score-direct`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Hide loading indicator
        hideToast(loadingToast);

        console.log('Score update response:', response.data);

        if (!response.data || !response.data.success) {
          console.error('Error updating score:', response.data?.message || 'Unknown error');
          showToast(response.data?.message || 'Failed to update score', 'error', 3000);
          return;
        }

        // Show success message
        showToast('Score updated successfully', 'success', 2000);

        // Update the local assessment scores
        const updatedAssessment = response.data.assessment;
        
        if (!updatedAssessment) {
          console.error('No assessment returned from server');
          return;
        }
        
        console.log('Updated assessment:', updatedAssessment);
        console.log('Updated scores:', updatedAssessment.scores);
        
        // Find the assessment in the local array
        const assessmentIndex = assessments.value.findIndex(a => 
          a._id === assessmentId || a.id === assessmentId
        );
        
        if (assessmentIndex !== -1) {
          // Update the assessment in the array with the new scores
          assessments.value[assessmentIndex] = {
            ...assessments.value[assessmentIndex],
            scores: updatedAssessment.scores || {}
          };

          // Force a UI update
          assessments.value = [...assessments.value];
          
          // Update the student's scores in the UI
          if (students.value) {
            const studentIndex = students.value.findIndex(s => 
              s.studentNumber === student.studentNumber
            );
            
            if (studentIndex !== -1) {
              // Make sure the scores object exists
              if (!students.value[studentIndex].scores) {
                students.value[studentIndex].scores = {};
              }
              
              // Update the score
              students.value[studentIndex].scores[assessmentId] = scoreValue;
              
              // Force a UI update
              students.value = [...students.value];
            }
          }
          
          // If the student is currently selected in the details modal, update their chart
          if (selectedStudent.value && selectedStudent.value.studentNumber === student.studentNumber) {
            // Update the chart on the next tick to ensure the DOM is updated
            nextTick(() => {
              createPerformanceChart();
              updateAssessmentHistoryTable();
            });
          }
        }
      } catch (error) {
        console.error('Error updating score:', error);
        showToast('Failed to update score. Please try again.', 'error', 3000);
      }
    };
    
    // Helper function to show toast messages
    const showToast = (message, type = 'info', duration = 3000) => {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = message;
      document.body.appendChild(toast);
      
      // Add styles if they don't exist
      if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.innerHTML = `
          .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: toast-in 0.3s ease-out;
          }
          .toast-info {
            background-color: #3498db;
          }
          .toast-success {
            background-color: #2ecc71;
          }
          .toast-warning {
            background-color: #f39c12;
          }
          .toast-error {
            background-color: #e74c3c;
          }
          @keyframes toast-in {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Remove toast after duration (if not 0)
      if (duration > 0) {
        setTimeout(() => {
          hideToast(toast);
        }, duration);
      }
      
      return toast;
    };
    
    // Helper function to hide toast
    const hideToast = (toast) => {
      if (!toast || !document.body.contains(toast)) return;
      
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.3s ease-out';
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    };

    // View student details
    const viewStudentDetails = async (student) => {
      try {
        if (!student) {
          console.error('Invalid student data provided to viewStudentDetails');
          return;
        }

        // Clean up existing charts if any
        if (selectedStudent.value) {
          const chartIdBase = `performanceChart-${selectedStudent.value.studentNumber}`;
          const chartIds = [
            `all-${chartIdBase}`,
            `quiz-${chartIdBase}`,
            `activity-${chartIdBase}`,
            `performance-${chartIdBase}`
          ];
          
          chartIds.forEach(id => {
            const chartElement = document.getElementById(id);
            if (chartElement) {
              const chart = Chart.getChart(chartElement);
              if (chart) {
                chart.destroy();
              }
            }
          });
        }

        // Reset assessment type to 'All'
        selectedAssessmentType.value = 'All';

        // Get all assessments for this student
        const response = await api.get('/assessments', {
          params: {
            teacherId: store.state.auth.user?._id,
            section: selectedSection.value,
            subject: selectedSubject.value
          },
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });

        if (!response.data) {
          throw new Error('Failed to fetch assessment data');
        }

        // Map the assessments to include scores
        const assessmentsData = response.data.map(assessment => ({
          ...assessment,
          id: assessment._id,
          scores: assessment.scores || {}
        }));

        // Update the selected student with assessment data
        selectedStudent.value = {
          ...student,
          assessments: assessmentsData
        };

        // Set default date ranges if not already set
        const today = moment().format('YYYY-MM-DD');
        const thirtyDaysAgo = moment().subtract(30, 'days').format('YYYY-MM-DD');
        
        chartDateRange.value = {
          start: thirtyDaysAgo,
          end: today
        };
        
        historyDateRange.value = {
          start: thirtyDaysAgo,
          end: today
        };

        // Create charts on next tick to ensure DOM is ready
        nextTick(() => {
          createPerformanceChart();
        });
      } catch (error) {
        console.error('Error fetching student details:', error);
        alert('Failed to load student details. Please try again.');
      }
    };

    // Add watch for currentDate to update student details when date changes
    watch(currentDate, async () => {
      if (selectedStudent.value) {
        await viewStudentDetails(selectedStudent.value);
      }
    });

    // Format date
    const formatDate = (date) => {
      if (!date) return ''
      return moment(date).tz('Asia/Manila').format('MMMM D, YYYY')
    }

    // Function to update teacher subjects
    const updateTeacherSubjects = async () => {
      try {
        if (!selectedYear.value || !selectedSection.value) {
          console.log('Missing year or section for fetching subjects');
          teacherSubjects.value = [];
          return;
        }

        const teacherId = store.state.auth.user?._id;
        const response = await api.get('/teacher-class-records/available-subjects', {
          params: {
            teacherId,
            year: selectedYear.value,
            section: selectedSection.value
          },
          headers: { 
            'Authorization': `Bearer ${store.state.auth.token}` 
          }
        });

        if (response.data && response.data.subjects) {
          teacherSubjects.value = response.data.subjects.sort();
          console.log('Fetched teacher subjects:', teacherSubjects.value);

          // If no subject is selected but we have subjects available, select the first one
          if (!selectedSubject.value && teacherSubjects.value.length > 0) {
            selectedSubject.value = teacherSubjects.value[0];
          }
        } else {
          teacherSubjects.value = [];
        }
      } catch (error) {
        console.error('Failed to fetch teacher subjects:', error);
        teacherSubjects.value = [];
      }
    }

    // Handle adding new student record
    const handleAddStudentRecord = async () => {
      console.log('handleAddStudentRecord function called');
      try {
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id || user.value?._id;

        console.log('Adding student record with:', {
          year: newStudentRecord.value.year,
          section: newStudentRecord.value.section,
          subject: newStudentRecord.value.subject
        });

        if (!teacherId) {
          console.error('Teacher ID not available');
          alert('Teacher information is not available. Please try logging in again.');
          store.dispatch('logout');
          router.push('/login');
          return;
        }

        // First get students from the selected section
        console.log('Fetching students for section:', newStudentRecord.value.year, newStudentRecord.value.section);
        const studentsResponse = await api.get(`/students/by-section`, {
          params: {
            year: newStudentRecord.value.year,
            section: newStudentRecord.value.section
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Students response:', studentsResponse.data);

        if (!studentsResponse.data || studentsResponse.data.length === 0) {
          alert('No students found in the selected section.');
          return;
        }

        // Map students to the required format
        const mappedStudents = studentsResponse.data.map(student => ({
          studentId: student._id,
          studentNumber: student.studentId,
          firstName: student.firstName,
          lastName: student.lastName,
          year: student.year,
          section: student.section
        }));

        console.log('Mapped students:', mappedStudents);

        // Create the class record
        const classRecordData = {
          teacherId,
          year: newStudentRecord.value.year,
          section: newStudentRecord.value.section,
          subject: newStudentRecord.value.subject,
          students: mappedStudents
        };

        console.log('Creating class record with data:', classRecordData);

        // Save the class record
        const createResponse = await api.post(
          '/teacher-class-records/create', 
          classRecordData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Create response:', createResponse.data);

        if (createResponse.data) {
          try {
            // Initialize attendance records for all students
            // Get the current date in Philippine timezone
            const today = moment().tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
            
            console.log('Creating attendance records for date:', today);
            
            // Create attendance records for each student
            const attendancePromises = mappedStudents.map(student => {
              console.log(`Creating attendance record for student ${student.firstName} ${student.lastName} (${student.studentNumber})`);
              return api.post('/attendance', {
                studentId: student.studentId,
                teacherId,
                date: today,
                subject: newStudentRecord.value.subject,
                section: newStudentRecord.value.section,
                status: 'present' // Default status
              }, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }).then(response => {
                console.log(`Successfully created attendance record for student ${student.studentNumber}:`, response.data);
                return response;
              }).catch(error => {
                console.warn(`Failed to create attendance record for student ${student.studentNumber}:`, error);
                
                // If the endpoint doesn't exist, log a more specific message
                if (error.response && error.response.status === 404) {
                  console.warn('Attendance API endpoint not found. This is expected if the attendance service is not yet implemented.');
                }
                
                // Return a resolved promise to prevent Promise.all from failing
                return Promise.resolve();
              });
            });
            
            // Wait for all attendance records to be created
            await Promise.all(attendancePromises);
            console.log('Attendance records creation completed');
          } catch (attendanceError) {
            console.warn('Error creating attendance records:', attendanceError);
            // Continue with the process even if attendance creation fails
          }

          // Close modal and reset form
          showAddStudentRecordModal.value = false;
          newStudentRecord.value = {
            year: '',
            section: '',
            subject: ''
          };

          // Update the selected filters to show the new record
          selectedYear.value = classRecordData.year;
          selectedSection.value = classRecordData.section;
          selectedSubject.value = classRecordData.subject;

          console.log('Selected filters updated to:', {
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          });

          // Refresh the data
          console.log('Refreshing class data and attendance...');
          await fetchClassData();
          
          // Check if data was loaded correctly
          if (students.value.length === 0) {
            console.log('No students loaded after fetchClassData, trying again...');
            // Try again with a slight delay
            setTimeout(async () => {
              await fetchClassData();
              console.log('Second attempt to fetch class data complete, students:', students.value.length);
            }, 500);
          }
          
          try {
            await fetchAttendance();
            console.log('Attendance data refreshed successfully');
          } catch (attendanceError) {
            console.warn('Error fetching attendance:', attendanceError);
            // Continue with the process even if attendance fetching fails
          }
          console.log('Data refresh complete');

          alert('Student records added successfully!');
        }
      } catch (error) {
        console.error('Failed to add student record:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
        
        // Check if the class record was created successfully
        let classRecordCreated = false;
        try {
          // Try to fetch the class record to see if it was created
          if (newStudentRecord.value.year && newStudentRecord.value.section && newStudentRecord.value.subject) {
            const checkResponse = await api.get('/teacher-class-records', {
              params: {
                teacherId: store.state.auth.user?._id || user.value?._id,
                year: newStudentRecord.value.year,
                section: newStudentRecord.value.section,
                subject: newStudentRecord.value.subject
              },
              headers: {
                'Authorization': `Bearer ${store.state.auth.token}`
              }
            });
            
            if (checkResponse.data && checkResponse.data.length > 0) {
              classRecordCreated = true;
              console.log('Class record was created successfully despite errors');
            }
          }
        } catch (checkError) {
          console.error('Error checking if class record was created:', checkError);
        }
        
        if (classRecordCreated) {
          // If the class record was created, consider it a success
          showAddStudentRecordModal.value = false;
          
          // Store the values before resetting the form
          const year = newStudentRecord.value.year;
          const section = newStudentRecord.value.section;
          const subject = newStudentRecord.value.subject;
          
          // Reset the form
          newStudentRecord.value = {
            year: '',
            section: '',
            subject: ''
          };
          
          // Update the selected filters to show the new record
          selectedYear.value = year;
          selectedSection.value = section;
          selectedSubject.value = subject;
          
          // Refresh the data
          await fetchClassData();
          try {
            await fetchAttendance();
            console.log('Attendance data refreshed successfully after recovery');
          } catch (attendanceError) {
            console.warn('Error fetching attendance after recovery:', attendanceError);
          }
          
          alert('Student records added successfully, but there was an issue with attendance records. You may need to set attendance separately.');
        } else if (error.response?.data?.message === 'A class record already exists for this combination') {
          alert('A class record already exists for this combination of teacher, year, section, and subject.');
        } else {
          alert('Failed to add student record. Please try again.');
        }
      }
    };

    // Watch for changes in year selection
    watch(selectedYear, async (newYear) => {
      if (newYear) {
        selectedSection.value = ''; // Reset section
        selectedSubject.value = ''; // Reset subject
        await fetchAvailableSections(); // Fetch sections based on selected year
        await saveUserPreferences(); // Save the updated preference
      } else {
        availableSections.value = [];
      }
    });

    // Watch for changes in section selection
    watch(selectedSection, async (newSection) => {
      if (newSection) {
        selectedSubject.value = ''; // Reset subject
        await updateTeacherSubjects(); // Fetch subjects based on selected year and section
        await saveUserPreferences(); // Save the updated preference
      } else {
        teacherSubjects.value = [];
      }
    });

    // Watch for changes in subject selection
    watch(selectedSubject, async (newSubject) => {
      if (newSubject) {
        await fetchClassData(); // Fetch class data based on selected year, section, and subject
        await saveUserPreferences(); // Save the updated preference
      } else {
        students.value = [];
      }
    });

    // Add clearFilters function
    const clearFilters = async () => {
      // Reset all filter values
      selectedYear.value = '';
      selectedSection.value = '';
      selectedSubject.value = '';
      currentPage.value = 1;
      
      // Clear students array to avoid showing stale data
      students.value = [];
      assessments.value = [];
      
      // Remove preferences from localStorage
      localStorage.removeItem('classRecordPreferences');
      
      try {
        // Then clear from backend
        const token = store.state.auth.token;
        const userId = store.state.auth.user?._id;
        
        if (userId) {
          const emptyPreferences = {
            selectedYear: '',
            selectedSection: '',
            selectedSubject: '',
            currentPage: 1
          };
          
          await api.post('/users/preferences', 
            { userId, preferences: emptyPreferences },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          console.log('Preferences cleared successfully');
        }
      } catch (error) {
        console.error('Error clearing preferences:', error);
      }
    };

    // Add onMounted hook to fetch initial data
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
        try {
          const token = store.state.auth.token;
          if (!token) {
            console.error('No auth token found');
            router.push('/login');
            return;
          }

          console.log('Fetching user profile...');
          const response = await api.get('/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('User profile response:', response.data);
          
          if (response.data && response.data.role === 'teacher') {
            user.value = response.data;
            console.log('Teacher data loaded:', user.value);
            
            // Fetch available years first
            await fetchAvailableYears();
            
            // If year is selected, fetch sections
            if (selectedYear.value) {
              await fetchAvailableSections();
              
              // If section is selected, fetch subjects
              if (selectedSection.value) {
                await updateTeacherSubjects();
                
                // If subject is selected, fetch class data and assessments
                if (selectedSubject.value) {
                  await Promise.all([
                    fetchClassData(),
                    fetchAssessments()
                  ]);
                }
              }
            }
          } else {
            console.error('User is not a teacher:', response.data);
            router.push('/login');
          }
        } catch (error) {
          handleApiError(error, 'onMounted');
        }
      } else {
        console.log('User not logged in, redirecting to login');
        router.push('/login');
      }
    })

    // Add these new methods in the setup function
    const getAssessmentBadgeClass = (type) => {
      switch (type) {
        case 'Quiz': return 'badge-quiz'
        case 'Activity': return 'badge-activity'
        case 'Performance Task': return 'badge-performance'
        default: return ''
      }
    }

    const getScoreClass = (percentage) => {
      if (percentage >= 90) return 'score-excellent'
      if (percentage >= 80) return 'score-good'
      if (percentage >= 75) return 'score-average'
      return 'score-poor'
    }

    // Watch for changes in section or subject
    watch([selectedSection, selectedSubject], async () => {
      if (selectedSection.value && selectedSubject.value) {
        await fetchClassData()
        await fetchAssessments()
      }
    })

    const createChart = (chartRef, data) => {
      // Destroy existing chart if it exists
      if (chartRef.value) {
        const existingChart = Chart.getChart(chartRef.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }

      const chartColors = {
        Quiz: '#4e73df',
        Activity: '#1cc88a',
        'Performance Task': '#f6c23e'
      };

      const chartConfig = {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            data: data.scores,
            backgroundColor: chartColors[data.type],
            borderRadius: 6,
            maxBarThickness: 40,
            borderSkipped: false
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
            backgroundColor: '#fff',
            titleColor: '#203464',
            bodyColor: '#203464',
            borderColor: '#e9ecef',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `Score: ${context.parsed.y}%`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: '#f8f9fa',
              drawBorder: false
            },
            ticks: {
              color: '#6c757d',
              font: {
                size: 11,
                callback: function(value) {
                  return value + '%';
                  }
                }
              }
            }
          }
        }
      };

      return new Chart(chartRef.value, chartConfig);
    };

    const updateCharts = () => {
      // Destroy existing charts
      [quizChart, activityChart, performanceChart].forEach(chartRef => {
        if (chartRef.value) {
          const existingChart = Chart.getChart(chartRef.value);
          if (existingChart) {
            existingChart.destroy();
          }
        }
      });

      if (!selectedStudent.value) return;

      const chartTypes = {
        Quiz: quizChart,
        Activity: activityChart,
        'Performance Task': performanceChart
      };

      // Create new charts for each assessment type
      Object.entries(chartTypes).forEach(([type, chartRef]) => {
        const assessments = selectedStudent.value.assessments
          .filter(a => a.type === type)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (assessments.length > 0) {
          const data = {
            type,
            labels: assessments.map(a => formatDate(a.date)),
            scores: assessments.map(a => (a.score / a.maxScore * 100).toFixed(1))
          };

          createChart(chartRef, data);
        }
      });
    };

    // Add these to the setup function
    const showEditAssessmentModal = ref(false)
    const editingAssessment = ref({
      type: '',
      number: '',
      maxScore: ''
    })

    const editAssessment = (assessment) => {
      editingAssessment.value = { ...assessment }
      showEditAssessmentModal.value = true
    }

    const handleEditAssessment = async () => {
      try {
        const token = store.state.auth.token
        const response = await api.put(
          `/assessments/${editingAssessment.value._id}`,
          {
            type: editingAssessment.value.type,
            number: editingAssessment.value.number,
            maxScore: editingAssessment.value.maxScore
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (response.data) {
          // Update the assessment in the local state
          const index = assessments.value.findIndex(a => a._id === editingAssessment.value._id)
          if (index !== -1) {
            assessments.value[index] = {
              ...response.data,
              id: response.data._id
            }
          }

          // Close modal and show success message
          showEditAssessmentModal.value = false
          alert('Assessment updated successfully!')
        }
      } catch (error) {
        console.error('Failed to update assessment:', error)
        alert('Failed to update assessment. Please try again.')
      }
    }

    const handleDeleteAssessment = async () => {
      if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
        return
      }

      try {
        const token = store.state.auth.token
        await api.delete(
          `/assessments/${editingAssessment.value._id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        // Remove the assessment from the local state
        assessments.value = assessments.value.filter(a => a._id !== editingAssessment.value._id)
        
        // Close modal and show success message
        showEditAssessmentModal.value = false
        alert('Assessment deleted successfully!')
      } catch (error) {
        console.error('Failed to delete assessment:', error)
        alert('Failed to delete assessment. Please try again.')
      }
    }

    // Fetch available years for the teacher
    const fetchAvailableYears = async () => {
      try {
        console.log('Starting fetchAvailableYears...');
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id;

        if (!teacherId) {
          console.error('No teacherId available');
          return;
        }

        console.log('Making API request for available years...');
        const response = await api.get('/teacher-class-records', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Available years response:', response.data);
        // Extract unique years from teacher's records
        const years = [...new Set(response.data.map(record => record.year))]
        availableYears.value = years.sort()

        // If no year is selected but we have years available, select the first one
        if (!selectedYear.value && availableYears.value.length > 0) {
          selectedYear.value = availableYears.value[0]
        }
      } catch (error) {
        handleApiError(error, 'fetchAvailableYears');
      }
    }

    // Fetch available sections for the selected year
    const fetchAvailableSections = async () => {
      try {
        if (!selectedYear.value) {
          console.log('No year selected for fetching sections');
          availableSections.value = [];
          return;
        }

        const teacherId = store.state.auth.user?._id;
        const response = await api.get('/teacher-class-records/available-sections', {
          params: { 
            teacherId,
            year: selectedYear.value
          },
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`
          }
        });

        // Extract unique sections from teacher's records for the selected year
        const sections = [...new Set(response.data.map(record => record.section))];
        availableSections.value = sections.sort();

        console.log('Fetched available sections:', availableSections.value);
      } catch (error) {
        console.error('Failed to fetch available sections:', error);
        availableSections.value = [];
      }
    };

    // Disable section and subject until year is selected
    const canSelectSection = computed(() => !!selectedYear.value);
    const canSelectSubject = computed(() => !!selectedSection.value);

    // Add computed property for filtered assessments
    const filteredAssessments = computed(() => {
      if (!selectedStudent.value?.assessments) return [];

      return selectedStudent.value.assessments.filter(assessment => {
        // Apply type filter
        if (selectedAssessmentType.value && assessment.type !== selectedAssessmentType.value) {
          return false;
        }

        // Apply date filter
        if (historyDateRange.value.start && historyDateRange.value.end) {
          const assessmentDate = new Date(assessment.date);
          const startDate = new Date(historyDateRange.value.start);
          startDate.setUTCHours(0, 0, 0, 0);
          startDate.setHours(startDate.getHours() + 8);
          
          const endDate = new Date(historyDateRange.value.end);
          endDate.setUTCHours(23, 59, 59, 999);
          endDate.setHours(endDate.getHours() + 8); // Adjust for Philippine timezone
          
          if (assessmentDate < startDate || assessmentDate > endDate) {
            return false;
          }
        }

        return true;
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
    });

    // Add filter handling functions
    const applyChartDateFilter = () => {
      if (chartDateRange.value.start && chartDateRange.value.end) {
        // Create charts with the new date range
        nextTick(() => {
          createPerformanceChart();
        });
      }
      showChartDateFilter = false;
    };

    const clearChartDateFilter = () => {
      chartDateRange.value = { 
        start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      };
      
      // Create charts with the reset date range
      nextTick(() => {
        createPerformanceChart();
      });
      
      showChartDateFilter = false;
    };

    const applyHistoryDateFilter = () => {
        // The filteredAssessments computed property will automatically update
        // based on the new date range
      showHistoryDateFilter = false;
    };

    const clearHistoryDateFilter = () => {
      historyDateRange.value = { 
        start: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD')
      };
      showHistoryDateFilter = false;
    };

    // Watch for assessment type changes
    watch(selectedAssessmentType, () => {
      // The computed filteredAssessments will automatically update
    });

    const handleLogout = async () => {
      try {
        await store.dispatch('logout')
        router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    // Add date navigation function
    const navigateDate = (direction) => {
      const now = moment().tz('Asia/Manila').startOf('day')
      const newDate = moment(currentDate.value).tz('Asia/Manila').startOf('day').add(direction, 'days')
      
      // Only allow navigation to past dates or current date
      if (direction < 0 || (direction > 0 && !newDate.isAfter(now, 'day'))) {
        slideDirection.value = direction > 0 ? 'slide-left' : 'slide-right'
        currentDate.value = newDate.toDate()
        
        // Refresh data for the new date
        fetchClassData()
        fetchAttendance()
        
        setTimeout(() => {
          slideDirection.value = ''
        }, 300)
      }
    }

    // Format date for display
    const formatDateForDisplay = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Adjust for Philippine timezone
      date.setHours(date.getHours() + 8);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Manila'
      });
    };

    const openChartDateFilter = () => {
      showChartDateFilter.value = true
      // Close other modals if open
      showHistoryDateFilter.value = false
    }

    const openHistoryDateFilter = () => {
      showHistoryDateFilter.value = true
      // Close other modals if open
      showChartDateFilter.value = false
    }

    const slideDirection = ref('')

    // Add computed property for next day button
    const isNextDayDisabled = computed(() => {
      const now = moment().tz('Asia/Manila').startOf('day')
      const selected = moment(currentDate.value).tz('Asia/Manila').startOf('day')
      return selected.isSameOrAfter(now, 'day')
    })

    // Add this near the top of the setup function
    const handleApiError = (error, context) => {
      console.error(`Error in ${context}:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        store.dispatch('logout');
        router.push('/login');
      }
    };

    // Add new method to fetch available years and sections
    const fetchAvailableYearsAndSections = async () => {
      try {
        const token = store.state.auth.token;
        
        console.log('Fetching available years and sections...');
        
        // Use the available-years-sections endpoint
        const response = await api.get('/students/available-years-sections', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('API Response:', response.data);

        if (response.data) {
          // Set available years and sections from the response
          availableYears.value = response.data.years || [];
          availableSections.value = response.data.sections || [];
          
          // Use sectionsByYear from the API response
          if (response.data.sectionsByYear) {
            sectionsByYear.value = response.data.sectionsByYear;
          } else {
            sectionsByYear.value = {};
          }
          
          // If no years are available, add default values
          if (availableYears.value.length === 0) {
            availableYears.value = ['1st', '2nd', '3rd', '4th'];
            console.log('No years found, using default values:', availableYears.value);
          }
          
          // If no sections are available, add default values
          if (availableSections.value.length === 0) {
            availableSections.value = ['South 1', 'South 2', 'South 3'];
            console.log('No sections found, using default values:', availableSections.value);
          }
          
          // If sectionsByYear is empty, create a default mapping
          if (Object.keys(sectionsByYear.value).length === 0) {
            const defaultYears = ['1st', '2nd', '3rd', '4th'];
            const defaultSections = ['South 1', 'South 2', 'South 3'];
            
            defaultYears.forEach(year => {
              sectionsByYear.value[year] = defaultSections;
            });
            
            console.log('No sections by year found, using default mapping:', sectionsByYear.value);
          }
          
          console.log('Available years:', availableYears.value);
          console.log('Available sections:', availableSections.value);
          console.log('Sections by year:', sectionsByYear.value);
        }
      } catch (error) {
        console.error('Failed to fetch available years and sections:', error);
        
        // Set default values in case of error
        availableYears.value = ['1st', '2nd', '3rd', '4th'];
        availableSections.value = ['South 1', 'South 2', 'South 3'];
        
        // Create default sectionsByYear mapping
        sectionsByYear.value = {
          '1st': ['South 1', 'South 2', 'South 3'],
          '2nd': ['South 1', 'South 2', 'South 3'],
          '3rd': ['South 1', 'South 2', 'South 3'],
          '4th': ['South 1', 'South 2', 'South 3']
        };
        
        console.log('Using default values due to error');
      }
    };

    // Add method to fetch teacher subjects
    const fetchTeacherSubjects = async () => {
      try {
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id;
        
        console.log('Fetching teacher subjects...');

        if (!teacherId) {
          console.error('Teacher ID not available');
          teacherSubjects.value = [];
          return;
        }

        const response = await api.get('/users/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Teacher profile response:', response.data);

        if (response.data && response.data.subjects && response.data.subjects.length > 0) {
          teacherSubjects.value = response.data.subjects.sort();
          console.log('Fetched teacher subjects:', teacherSubjects.value);
        } else {
          console.log('No subjects found in teacher profile');
          teacherSubjects.value = [];
        }
      } catch (error) {
        console.error('Failed to fetch teacher subjects:', error);
        teacherSubjects.value = [];
      }
    };

    // Helper function to set default subjects based on teaching year
    const setDefaultSubjects = () => {
      const year = user.value?.teachingYear || '1st';
      console.log('Setting default subjects for teaching year:', year);
      
      switch (year) {
        case '1st':
          teacherSubjects.value = ['ITE 100', 'ITE 101', 'ITE 102', 'ITE 103'];
          break;
        case '2nd':
          teacherSubjects.value = ['ITE 200', 'ITE 201', 'ITE 202', 'ITE 203'];
          break;
        case '3rd':
          teacherSubjects.value = ['ITE 301', 'ITE 302', 'ITE 303', 'ITE 304'];
          break;
        case '4th':
          teacherSubjects.value = ['ITE 400', 'ITE 401', 'ITE 402', 'ITE 403', 'ITE 404'];
          break;
        default:
          teacherSubjects.value = [
            'ITE 100', 'ITE 101', 'ITE 102', 'ITE 103',
            'ITE 200', 'ITE 201', 'ITE 202', 'ITE 203',
            'ITE 301', 'ITE 302', 'ITE 303', 'ITE 304',
            'ITE 400', 'ITE 401', 'ITE 402', 'ITE 403', 'ITE 404'
          ];
      }
      
      console.log('Default subjects set:', teacherSubjects.value);
    };

    // Modify the existing showAddStudentRecordModal watcher or toggle function
    const openAddStudentRecordModal = async () => {
      // Reset form fields
      newStudentRecord.value = {
        year: '',
        section: '',
        subject: ''
      };
      
      console.log('Opening Add Student Record modal');
      
      try {
        // Fetch available options
        await fetchAvailableYearsAndSections();
        await fetchTeacherSubjects();
        
        console.log('Form reset and data fetched, opening modal');
        
        // Log available options for debugging
        console.log('- Years:', availableYears.value);
        console.log('- Sections by year:', sectionsByYear.value);
        console.log('- Subjects:', teacherSubjects.value);
        
        // Always open the modal, even if no options are available
        showAddStudentRecordModal.value = true;
      } catch (error) {
        console.error('Error preparing Add Student Record modal:', error);
        alert('Failed to prepare the Add Student Record form. Please try again.');
      }
    };

    // Add computed property for filtered sections based on selected year
    const filteredSections = computed(() => {
      if (!newStudentRecord.value.year) return [];
      
      console.log('Filtering sections for year:', newStudentRecord.value.year);
      console.log('Available sections by year:', sectionsByYear.value);
      
      const sections = sectionsByYear.value[newStudentRecord.value.year] || [];
      console.log('Filtered sections:', sections);
      
      return sections;
    });

    // Watch for year changes to reset section
    watch(() => newStudentRecord.value.year, (newYear) => {
      newStudentRecord.value.section = '';
    });

    // Add auto date update interval
    let dateUpdateInterval = null

    // Add function to check and update date at midnight
    const setupDateAutoUpdate = () => {
      const checkAndUpdateDate = () => {
        const now = moment().tz('Asia/Manila')
        const current = moment(currentDate.value).tz('Asia/Manila')
        
        // If it's past midnight and we're showing yesterday's date
        if (now.isAfter(current, 'day')) {
          currentDate.value = now.toDate()
          fetchClassData()
          fetchAttendance()
        }
      }

      // Clear existing interval if any
      if (dateUpdateInterval) {
        clearInterval(dateUpdateInterval)
      }

      // Check every minute
      dateUpdateInterval = setInterval(checkAndUpdateDate, 60000)
    }

    // Add attendance-related state and functions
    const attendanceRecords = ref([])
    const attendanceStatistics = ref(null)

    const fetchAttendance = async () => {
      try {
        if (!selectedSection.value || !selectedSubject.value) {
          console.log('fetchAttendance: Missing required filters', {
            section: selectedSection.value,
            subject: selectedSubject.value
          });
          return;
        }

        console.log('fetchAttendance: Fetching attendance data with filters', {
          section: selectedSection.value,
          subject: selectedSubject.value,
          date: moment(currentDate.value).tz('Asia/Manila').format('YYYY-MM-DD')
        });
        const date = moment(currentDate.value).tz('Asia/Manila').format('YYYY-MM-DD')
        const response = await api.get(`/attendance/date/${date}`, {
          params: {
            subject: selectedSubject.value,
            section: selectedSection.value
          },
          headers: { 'Authorization': `Bearer ${store.state.auth.token}` }
        })

        attendanceRecords.value = response.data
      } catch (error) {
        console.error('Error fetching attendance:', error)
      }
    }

    // Add attendance chart creation
    const createAttendanceChart = () => {
      // This function is no longer needed as attendance is handled in the Attendance.vue page
      console.log('Attendance functionality moved to Attendance.vue page');
    }

    // Add cleanup on component unmount
    onUnmounted(() => {
      if (dateUpdateInterval) {
        clearInterval(dateUpdateInterval)
      }
    })

    // Update onMounted to include new initialization
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
        try {
          await fetchUserProfile()
          await fetchTeacherSubjects()
          setupDateAutoUpdate()
        } catch (error) {
          handleApiError(error, 'component mount')
        }
      } else {
        router.push('/login')
      }
    })

    const syncStudentRecords = async () => {
      try {
        if (!selectedYear.value || !selectedSection.value) {
          alert('Please select a year and section first');
          return;
        }

        const response = await api.post(
          '/teacher-class-records/sync-records',
          {
            year: selectedYear.value,
            section: selectedSection.value
          },
          {
            headers: {
              'Authorization': `Bearer ${store.state.auth.token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.success) {
          // Refresh the data after sync
          await fetchClassData();
          await fetchAttendance();
          alert('Student records synchronized successfully!');
        }
      } catch (error) {
        console.error('Failed to sync student records:', error);
        alert('Failed to sync student records. Please try again.');
      }
    };

    // Add redirection method
    const redirectToAttendance = () => {
      if (!selectedYear.value || !selectedSection.value || !selectedSubject.value) {
        alert('Please select a year, section, and subject first');
        return;
      }
      router.push({
        name: 'Attendance',
        query: {
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value
        }
      });
    };

    // Add pagination state
    const currentPage = ref(1)
    const itemsPerPage = 25

    // Compute total pages
    const totalPages = computed(() => Math.ceil(sortedStudents.value.length / itemsPerPage))

    // Get paginated students
    const paginatedStudents = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      const end = start + itemsPerPage
      return sortedStudents.value.slice(start, end)
    })

    // Compute pagination info
    const paginationInfo = computed(() => {
      const start = sortedStudents.value.length === 0 ? 0 : (currentPage.value - 1) * itemsPerPage + 1
      const end = Math.min(start + itemsPerPage - 1, sortedStudents.value.length)
      return { start, end }
    })

    // Pagination methods
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
        saveUserPreferences(); // Save the updated page
      }
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
        saveUserPreferences(); // Save the updated page
      }
    }

    // Reset pagination when filters change
    watch([searchQuery, selectedYear, selectedSection, selectedSubject], () => {
      currentPage.value = 1
      // No need to save here as the filter change will trigger the filter watcher
    })

    // Add chart instances
    let quizChartInstance = null;
    let activityChartInstance = null;
    let performanceChartInstance = null;

    // Helper function to destroy chart
    const destroyChart = (chartInstance, canvasRef) => {
      try {
        // Destroy the chart instance if it exists
        if (chartInstance) {
          chartInstance.destroy();
        }
        
        // Clear any existing chart from the canvas
        if (canvasRef && canvasRef.value) {
          const existingChart = Chart.getChart(canvasRef.value);
          if (existingChart) {
            existingChart.destroy();
          }
          
          // Clear any "no data" messages
          const container = canvasRef.value.parentElement;
          if (container) {
            // Preserve the canvas but remove other elements
            const canvas = canvasRef.value;
            container.innerHTML = '';
            if (canvas) {
              container.appendChild(canvas);
            }
          }
        }
      } catch (error) {
        console.error('Error destroying chart:', error);
      }
    };

    // Handle date filter change from the modal
    const handleDateFilterChange = (dateFilter) => {
      console.log('Date filter changed:', dateFilter);
      
      // Update chart date range
      if (dateFilter.start) {
        chartDateRange.value.start = dateFilter.start;
        historyDateRange.value.start = dateFilter.start;
      }
      
      if (dateFilter.end) {
        chartDateRange.value.end = dateFilter.end;
        historyDateRange.value.end = dateFilter.end;
      }
      
      // Recreate charts with the new date range
      nextTick(() => {
        createPerformanceChart();
        // The assessment history table will be updated by createPerformanceChart
      });
    };

    // Handle assessment type change from the modal
    const handleAssessmentTypeChange = (type) => {
      console.log('Assessment type changed:', type);
      
      // Update the selected assessment type
      selectedAssessmentType.value = type;
      
      // Recreate charts with the new assessment type
      nextTick(() => {
        createPerformanceChart();
      });
    };

    // Create performance chart function
    const createPerformanceChart = () => {
      if (!selectedStudent.value) {
        console.error('No student selected, cannot create performance chart');
        return;
      }

      console.log('Creating performance charts for student:', selectedStudent.value.studentNumber);
      console.log('Selected assessment type:', selectedAssessmentType.value);
      console.log('Date range:', chartDateRange.value);

      // Group assessments by type
      const assessmentsByType = {
        'Quiz': [],
        'Activity': [],
        'Performance Task': []
      };

      // Process assessments if they exist
      if (selectedStudent.value.assessments && selectedStudent.value.assessments.length > 0) {
        console.log(`Processing ${selectedStudent.value.assessments.length} assessments for charts`);
        
        selectedStudent.value.assessments.forEach(assessment => {
          if (assessment && assessment.type in assessmentsByType) {
            // Get the score for this student
            const studentNumber = selectedStudent.value.studentNumber;
            let scoreValue = null;
            
            // Check if scores is a Map or an object
            if (assessment.scores) {
              if (assessment.scores instanceof Map) {
                scoreValue = assessment.scores.get(studentNumber);
              } else if (typeof assessment.scores === 'object') {
                scoreValue = assessment.scores[studentNumber];
              }
            }
            
            // If score is not found in assessment.scores, check student.scores
            if ((scoreValue === null || scoreValue === undefined) && 
                selectedStudent.value.scores && 
                (assessment._id in selectedStudent.value.scores || assessment.id in selectedStudent.value.scores)) {
              scoreValue = selectedStudent.value.scores[assessment._id] || selectedStudent.value.scores[assessment.id];
            }
            
            // Only include assessments with scores
            if (scoreValue !== null && scoreValue !== undefined) {
              const maxScore = assessment.maxScore || 100;
              const scorePercentage = (scoreValue / maxScore) * 100;
              
              // Apply date filter if set
              const assessmentDate = new Date(assessment.date);
              const startDate = chartDateRange.value.start ? new Date(chartDateRange.value.start) : null;
              const endDate = chartDateRange.value.end ? new Date(chartDateRange.value.end) : null;
              
              // Skip if outside date range
              if ((startDate && assessmentDate < startDate) || 
                  (endDate && assessmentDate > endDate)) {
                console.log(`Skipping assessment ${assessment.type} #${assessment.number} due to date filter`);
                return;
              }
              
              console.log(`Including assessment ${assessment.type} #${assessment.number}: Score=${scoreValue}/${maxScore} (${scorePercentage.toFixed(1)}%)`);
              
              assessmentsByType[assessment.type].push({
                date: assessment.date,
                score: scorePercentage,
                rawScore: scoreValue,
                maxScore: maxScore,
                number: assessment.number,
                title: `${assessment.type} #${assessment.number}`
              });
            }
          }
        });
      }

      // Log the grouped assessments for debugging
      Object.keys(assessmentsByType).forEach(type => {
        console.log(`${type} assessments: ${assessmentsByType[type].length}`);
      });

      // Create charts for each type using the new chart IDs
      const chartIdBase = `performanceChart-${selectedStudent.value.studentNumber}`;
      
      // First, clean up any existing charts
      const chartIds = [
        `all-${chartIdBase}`,
        `quiz-${chartIdBase}`,
        `activity-${chartIdBase}`,
        `performance-${chartIdBase}`
      ];
      
      chartIds.forEach(id => {
        const chartElement = document.getElementById(id);
        if (chartElement) {
          const existingChart = Chart.getChart(chartElement);
          if (existingChart) {
            console.log(`Destroying existing chart: ${id}`);
            existingChart.destroy();
          }
        }
      });
      
      // Update the assessment history table with the filtered data
      updateAssessmentHistoryTable(assessmentsByType);
      
      // Create "All" chart that combines all assessment types
      if (selectedAssessmentType.value === 'All') {
        const allChartElement = document.getElementById(`all-${chartIdBase}`);
        if (allChartElement) {
          const ctx = allChartElement.getContext('2d');
          if (ctx) {
            // Combine all assessment types into one dataset
            const allAssessments = [
              ...assessmentsByType['Quiz'].map(item => ({ ...item, type: 'Quiz' })),
              ...assessmentsByType['Activity'].map(item => ({ ...item, type: 'Activity' })),
              ...assessmentsByType['Performance Task'].map(item => ({ ...item, type: 'Performance Task' }))
            ].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (allAssessments.length === 0) {
              // Display no data message
              const container = allChartElement.parentElement;
              if (container) {
                container.innerHTML = '';
                const noDataMessage = document.createElement('div');
                noDataMessage.className = 'text-center py-5 text-muted';
                noDataMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>No assessment data available for this student in the selected date range.';
                container.appendChild(noDataMessage);
              }
            } else {
              // Create datasets for each type
              const datasets = [
                {
                  label: 'Quiz',
                  data: allAssessments.filter(item => item.type === 'Quiz').map(item => ({ x: new Date(item.date), y: item.score })),
                  borderColor: '#4285F4',
                  backgroundColor: 'rgba(66, 133, 244, 0.1)',
                  borderWidth: 2,
                  tension: 0.4,
                  pointBackgroundColor: '#4285F4',
                  pointBorderColor: '#fff',
                  pointRadius: 5
                },
                {
                  label: 'Activity',
                  data: allAssessments.filter(item => item.type === 'Activity').map(item => ({ x: new Date(item.date), y: item.score })),
                  borderColor: '#34A853',
                  backgroundColor: 'rgba(52, 168, 83, 0.1)',
                  borderWidth: 2,
                  tension: 0.4,
                  pointBackgroundColor: '#34A853',
                  pointBorderColor: '#fff',
                  pointRadius: 5
                },
                {
                  label: 'Performance Task',
                  data: allAssessments.filter(item => item.type === 'Performance Task').map(item => ({ x: new Date(item.date), y: item.score })),
                  borderColor: '#FBBC05',
                  backgroundColor: 'rgba(251, 188, 5, 0.1)',
                  borderWidth: 2,
                  tension: 0.4,
                  pointBackgroundColor: '#FBBC05',
                  pointBorderColor: '#fff',
                  pointRadius: 5
                }
              ].filter(dataset => dataset.data.length > 0); // Only include datasets with data
              
              // Create the combined chart
              new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day',
                        displayFormats: {
                          day: 'MMM D, YYYY'
                        },
                        tooltipFormat: 'MMM D, YYYY'
                      },
                      adapters: {
                        date: {
                          locale: 'en'
                        }
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      },
                      grid: {
                        display: false
                      },
                      ticks: {
                        font: {
                          size: 12,
                          weight: 'bold'
                        },
                        padding: 10
                      }
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Score (%)'
                      },
                      ticks: {
                        callback: value => value + '%'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: (context) => {
                          return moment(context[0].parsed.x).format('MMMM D, YYYY');
                        },
                        label: (context) => {
                          const datasetLabel = context.dataset.label;
                          const value = context.parsed.y;
                          return `${datasetLabel}: ${value.toFixed(1)}%`;
                        }
                      }
                    },
                    legend: {
                      position: 'top'
                    }
                  }
                }
              });
            }
          }
        }
      }
      
      // Create Quiz chart
      if (selectedAssessmentType.value === 'Quiz') {
        const quizChartElement = document.getElementById(`quiz-${chartIdBase}`);
        if (quizChartElement) {
          const ctx = quizChartElement.getContext('2d');
          if (ctx) {
            const data = assessmentsByType['Quiz'].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (data.length === 0) {
              // Display no data message
              const container = quizChartElement.parentElement;
              if (container) {
                container.innerHTML = '';
                const noDataMessage = document.createElement('div');
                noDataMessage.className = 'text-center py-5 text-muted';
                noDataMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>No quiz data available for this student in the selected date range.';
                container.appendChild(noDataMessage);
              }
            } else {
              // Create time series data
              const timeSeriesData = data.map(item => ({
                x: new Date(item.date),
                y: item.score,
                rawScore: item.rawScore,
                maxScore: item.maxScore,
                number: item.number
              }));
              
              // Create chart
              new Chart(ctx, {
                type: 'line',
                data: {
                  datasets: [{
                    label: 'Quiz Scores',
                    data: timeSeriesData,
                    borderColor: '#4285F4',
                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4285F4',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day',
                        displayFormats: {
                          day: 'MMM D, YYYY'
                        },
                        tooltipFormat: 'MMM D, YYYY'
                      },
                      adapters: {
                        date: {
                          locale: 'en'
                        }
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      },
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Score (%)'
                      },
                      ticks: {
                        callback: value => value + '%'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: (context) => {
                          return moment(context[0].parsed.x).format('MMMM D, YYYY');
                        },
                        label: (context) => {
                          const item = context.raw;
                          return [
                            `Quiz #${item.number}`,
                            `Score: ${item.rawScore}/${item.maxScore} (${item.y.toFixed(1)}%)`
                          ];
                        }
                      }
                    }
                  }
                }
              });
            }
          }
        }
      }

      // Create Activity chart
      if (selectedAssessmentType.value === 'Activity') {
        const activityChartElement = document.getElementById(`activity-${chartIdBase}`);
        if (activityChartElement) {
          const ctx = activityChartElement.getContext('2d');
          if (ctx) {
            const data = assessmentsByType['Activity'].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (data.length === 0) {
              // Display no data message
              const container = activityChartElement.parentElement;
              if (container) {
                container.innerHTML = '';
                const noDataMessage = document.createElement('div');
                noDataMessage.className = 'text-center py-5 text-muted';
                noDataMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>No activity data available for this student in the selected date range.';
                container.appendChild(noDataMessage);
              }
            } else {
              // Create time series data
              const timeSeriesData = data.map(item => ({
                x: new Date(item.date),
                y: item.score,
                rawScore: item.rawScore,
                maxScore: item.maxScore,
                number: item.number
              }));
              
              // Create chart
              new Chart(ctx, {
                type: 'line',
                data: {
                  datasets: [{
                    label: 'Activity Scores',
                    data: timeSeriesData,
                    borderColor: '#34A853',
                    backgroundColor: 'rgba(52, 168, 83, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#34A853',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day',
                        displayFormats: {
                          day: 'MMM D, YYYY'
                        },
                        tooltipFormat: 'MMM D, YYYY'
                      },
                      adapters: {
                        date: {
                          locale: 'en'
                        }
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      },
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Score (%)'
                      },
                      ticks: {
                        callback: value => value + '%'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: (context) => {
                          return moment(context[0].parsed.x).format('MMMM D, YYYY');
                        },
                        label: (context) => {
                          const item = context.raw;
                          return [
                            `Activity #${item.number}`,
                            `Score: ${item.rawScore}/${item.maxScore} (${item.y.toFixed(1)}%)`
                          ];
                        }
                      }
                    }
                  }
                }
              });
            }
          }
        }
      }

      // Create Performance Task chart
      if (selectedAssessmentType.value === 'Performance Task') {
        const performanceChartElement = document.getElementById(`performance-${chartIdBase}`);
        if (performanceChartElement) {
          const ctx = performanceChartElement.getContext('2d');
          if (ctx) {
            const data = assessmentsByType['Performance Task'].sort((a, b) => new Date(a.date) - new Date(b.date));
            
            if (data.length === 0) {
              // Display no data message
              const container = performanceChartElement.parentElement;
              if (container) {
                container.innerHTML = '';
                const noDataMessage = document.createElement('div');
                noDataMessage.className = 'text-center py-5 text-muted';
                noDataMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>No performance task data available for this student in the selected date range.';
                container.appendChild(noDataMessage);
              }
            } else {
              // Create time series data
              const timeSeriesData = data.map(item => ({
                x: new Date(item.date),
                y: item.score,
                rawScore: item.rawScore,
                maxScore: item.maxScore,
                number: item.number
              }));
              
              // Create chart
              new Chart(ctx, {
                type: 'line',
                data: {
                  datasets: [{
                    label: 'Performance Task Scores',
                    data: timeSeriesData,
                    borderColor: '#FBBC05',
                    backgroundColor: 'rgba(251, 188, 5, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#FBBC05',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      type: 'time',
                      time: {
                        unit: 'day',
                        displayFormats: {
                          day: 'MMM D, YYYY'
                        },
                        tooltipFormat: 'MMM D, YYYY'
                      },
                      adapters: {
                        date: {
                          locale: 'en'
                        }
                      },
                      title: {
                        display: true,
                        text: 'Date'
                      },
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Score (%)'
                      },
                      ticks: {
                        callback: value => value + '%'
                      }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        title: (context) => {
                          return moment(context[0].parsed.x).format('MMMM D, YYYY');
                        },
                        label: (context) => {
                          const item = context.raw;
                          return [
                            `Performance Task #${item.number}`,
                            `Score: ${item.rawScore}/${item.maxScore} (${item.y.toFixed(1)}%)`
                          ];
                        }
                      }
                    }
                  }
                }
              });
            }
          }
        }
      }
    };

    // Helper function to create individual charts
    const createChartInstance = (ctx, type, data) => {
      if (!ctx) return null;

      // Generate a unique ID for the chart
      const chartId = `${type.toLowerCase()}-${Date.now()}`;
      ctx.canvas.id = chartId;

      if (data.length === 0) {
        try {
          // Find the parent container safely
          const canvas = ctx.canvas;
          if (!canvas) return null;
          
          const container = canvas.parentElement;
          if (!container) return null;
          
          // Create a wrapper div for the message
          const messageWrapper = document.createElement('div');
          messageWrapper.className = 'text-center py-4 text-muted';
          messageWrapper.innerHTML = `<i class="fas fa-info-circle me-2"></i>No ${type.toLowerCase()} data available`;
          
          // Clear the container and append the message
          container.innerHTML = '';
          container.appendChild(messageWrapper);
          
          return null;
        } catch (error) {
          console.error('Error displaying no data message:', error);
          return null;
        }
      }

      // Define chart colors based on type
      const getChartColors = (type) => {
        switch(type) {
          case 'Quiz':
            return {
              gradient: ['rgba(66, 133, 244, 0.8)', 'rgba(66, 133, 244, 0.1)'],
              border: '#4285F4',
              point: '#4285F4',
              pointHover: '#3367D6'
            };
          case 'Activity':
            return {
              gradient: ['rgba(52, 168, 83, 0.8)', 'rgba(52, 168, 83, 0.1)'],
              border: '#34A853',
              point: '#34A853',
              pointHover: '#2E7D32'
            };
          case 'Performance Task':
            return {
              gradient: ['rgba(251, 188, 5, 0.8)', 'rgba(251, 188, 5, 0.1)'],
              border: '#FBBC05',
              point: '#FBBC05',
              pointHover: '#F57F17'
            };
          default:
            return {
              gradient: ['rgba(66, 133, 244, 0.8)', 'rgba(66, 133, 244, 0.1)'],
              border: '#4285F4',
              point: '#4285F4',
              pointHover: '#3367D6'
            };
        }
      };

      const colors = getChartColors(type);
      
      // Create gradient for background
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, colors.gradient[0]);
      gradient.addColorStop(1, colors.gradient[1]);

      // Convert data to time series format
      const timeSeriesData = data.map(item => ({
        x: new Date(item.date),
        y: item.score
      }));

      return new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [{
            label: `${type} Scores`,
            data: timeSeriesData,
            borderColor: colors.border,
            backgroundColor: gradient,
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors.point,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: colors.pointHover,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animations: {
            tension: {
              duration: 1000,
              easing: 'linear',
              from: 0.4,
              to: 0.4,
              loop: false
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
                displayFormats: {
                  day: 'MMM D, YYYY'
                },
                tooltipFormat: 'MMM D, YYYY'
              },
              adapters: {
                date: {
                  locale: 'en'
                }
              },
              title: {
                display: true,
                text: 'Date'
              },
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12,
                  weight: 'bold'
                },
                padding: 10
              }
            },
            y: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                borderDash: [5, 5]
              },
              ticks: {
                font: {
                  size: 12,
                  weight: 'bold'
                },
                padding: 10,
                callback: value => value + '%'
              },
              title: {
                display: true,
                text: 'Score (%)'
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                boxWidth: 15,
                padding: 15,
                font: {
                  size: 14,
                  weight: 'bold'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 14,
                weight: 'bold'
              },
              bodyFont: {
                size: 13
              },
              padding: 15,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: (tooltipItems) => {
                  return moment(tooltipItems[0].parsed.x).format('MMMM D, YYYY');
                },
                label: (context) => {
                  const index = context.dataIndex;
                  const item = data[index];
                  return [
                    `${type} #${item.number}`,
                    `Score: ${item.rawScore}/${item.maxScore} (${item.score.toFixed(1)}%)`
                  ];
                }
              }
            }
          }
        }
      });
    };

    // Clean up charts when component unmounts
    onUnmounted(() => {
      // Clean up all charts
      const chartIdBase = selectedStudent.value ? `performanceChart-${selectedStudent.value.studentNumber}` : '';
      
      if (chartIdBase) {
        // Destroy all charts
        const chartIds = [
          `all-${chartIdBase}`,
          `quiz-${chartIdBase}`,
          `activity-${chartIdBase}`,
          `performance-${chartIdBase}`
        ];
        
        chartIds.forEach(id => {
          const chartElement = document.getElementById(id);
          if (chartElement) {
            const chart = Chart.getChart(chartElement);
            if (chart) {
              chart.destroy();
            }
          }
        });
      }
    });

    // Watch for changes in selected student to update charts
    watch(selectedStudent, () => {
      if (selectedStudent.value) {
        nextTick(() => {
          createPerformanceChart();
        });
      } else {
        // Clean up all charts when student is deselected
        const chartIdBase = `performanceChart-${selectedStudent.value?.studentNumber}`;
        
        if (chartIdBase) {
          // Destroy all charts
          const chartIds = [
            `all-${chartIdBase}`,
            `quiz-${chartIdBase}`,
            `activity-${chartIdBase}`,
            `performance-${chartIdBase}`
          ];
          
          chartIds.forEach(id => {
            const chartElement = document.getElementById(id);
            if (chartElement) {
              const chart = Chart.getChart(chartElement);
              if (chart) {
                chart.destroy();
              }
            }
          });
        }
      }
    });

    // Watch for changes in date range to update charts
    watch([chartDateRange, historyDateRange], () => {
      if (selectedStudent.value) {
        nextTick(() => {
          createPerformanceChart();
        });
      }
    });

    // Watch for changes in current date to refresh data
    watch(currentDate, async () => {
      await fetchAssessments();
      if (selectedStudent.value) {
        await viewStudentDetails(selectedStudent.value);
      }
    });

    // Function to fetch user preferences from the API
    const fetchUserPreferences = async () => {
      try {
        console.log('Fetching user preferences...');
        
        // First try to get from localStorage
        const localPrefs = localStorage.getItem('classRecordPreferences');
        let localPrefsObj = null;
        
        if (localPrefs) {
          try {
            localPrefsObj = JSON.parse(localPrefs);
            console.log('Found preferences in localStorage:', localPrefsObj);
            
            // Apply local preferences first
            if (localPrefsObj.selectedYear) selectedYear.value = localPrefsObj.selectedYear;
            if (localPrefsObj.selectedSection) selectedSection.value = localPrefsObj.selectedSection;
            if (localPrefsObj.selectedSubject) selectedSubject.value = localPrefsObj.selectedSubject;
            if (localPrefsObj.currentPage) currentPage.value = parseInt(localPrefsObj.currentPage) || 1;
          } catch (parseError) {
            console.error('Error parsing localStorage preferences:', parseError);
            localStorage.removeItem('classRecordPreferences');
          }
        } else {
          console.log('No preferences found in localStorage');
        }

        // Then try to get from backend
        const token = store.state.auth.token;
        const userId = store.state.auth.user?._id;
        
        if (!userId) {
          console.error('User ID not available for fetching preferences');
          return;
        }
        
        console.log('Fetching preferences from backend for user:', userId);
        
        const response = await api.get('/users/preferences', {
          params: { userId },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Backend preferences response:', response.data);
        
        if (response.data && response.data.preferences) {
          const prefs = response.data.preferences;
          
          // Update preferences if available
          if (prefs.selectedYear) selectedYear.value = prefs.selectedYear;
          if (prefs.selectedSection) selectedSection.value = prefs.selectedSection;
          if (prefs.selectedSubject) selectedSubject.value = prefs.selectedSubject;
          if (prefs.currentPage) currentPage.value = parseInt(prefs.currentPage) || 1;
          
          // Save to localStorage to ensure consistency
          localStorage.setItem('classRecordPreferences', JSON.stringify(prefs));
          console.log('Updated preferences from backend:', prefs);
        } else {
          console.log('No preferences found in backend, using localStorage values');
          
          // If we have local preferences but none from backend, save local to backend
          if (localPrefsObj) {
            await saveUserPreferences();
          }
        }
        
        console.log('Final preferences after fetching:', {
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value,
          page: currentPage.value
        });
        
        // Fetch data based on preferences in a specific order
        if (selectedYear.value) {
          console.log('Fetching sections for year:', selectedYear.value);
          await fetchAvailableSections();
        
          if (selectedSection.value) {
            console.log('Updating teacher subjects for section:', selectedSection.value);
          await updateTeacherSubjects();
        
            if (selectedSubject.value) {
              console.log('Fetching class data for subject:', selectedSubject.value);
              // Ensure we fetch the data with the current filters
          await fetchClassData();
              
              // Ensure the current page is applied after data is loaded
              console.log('Applying saved page number:', currentPage.value);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Try to use localStorage preferences if API call fails
        const localPrefs = localStorage.getItem('classRecordPreferences');
        if (localPrefs) {
          try {
            const prefs = JSON.parse(localPrefs);
            console.log('Falling back to localStorage preferences:', prefs);
            
            selectedYear.value = prefs.selectedYear || '';
            selectedSection.value = prefs.selectedSection || '';
            selectedSubject.value = prefs.selectedSubject || '';
            if (prefs.currentPage) currentPage.value = parseInt(prefs.currentPage) || 1;
            
            // Try to fetch data with these preferences
            if (selectedYear.value) {
              await fetchAvailableSections();
              
              if (selectedSection.value) {
                await updateTeacherSubjects();
                
                if (selectedSubject.value) {
                  await fetchClassData();
                }
              }
            }
          } catch (parseError) {
            console.error('Error parsing localStorage preferences during fallback:', parseError);
          }
        }
      }
    };
    
    // Function to save user preferences to the API
    const saveUserPreferences = async () => {
      try {
        const token = store.state.auth.token;
        const userId = store.state.auth.user?._id;
        
        if (!userId) {
          console.error('User ID not available for saving preferences');
          return;
        }
        
        const preferences = {
          selectedYear: selectedYear.value,
          selectedSection: selectedSection.value,
          selectedSubject: selectedSubject.value,
          currentPage: currentPage.value
        };

        console.log('Saving preferences:', preferences);

        // Save to localStorage first for immediate persistence
        localStorage.setItem('classRecordPreferences', JSON.stringify(preferences));
        
        // Then save to backend
        const response = await api.post('/users/preferences', 
          { userId, preferences },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        console.log('User preferences saved successfully:', response.data);
      } catch (error) {
        console.error('Error saving user preferences:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Ensure localStorage is still updated even if API call fails
        try {
          const preferences = {
            selectedYear: selectedYear.value,
            selectedSection: selectedSection.value,
            selectedSubject: selectedSubject.value,
            currentPage: currentPage.value
          };
          localStorage.setItem('classRecordPreferences', JSON.stringify(preferences));
          console.log('Preferences saved to localStorage as fallback');
        } catch (localStorageError) {
          console.error('Failed to save preferences to localStorage:', localStorageError);
        }
      }
    };

    // Update the watchers for filter changes
    watch([selectedYear, selectedSection, selectedSubject], async ([newYear, newSection, newSubject], [oldYear, oldSection, oldSubject]) => {
      // Save preferences whenever they change
      await saveUserPreferences();
      
      // Handle year changes
      if (newYear !== oldYear) {
        selectedSection.value = '';
        selectedSubject.value = '';
        if (newYear) {
          await fetchAvailableSections();
        }
      }
      
      // Handle section changes
      if (newSection !== oldSection) {
        selectedSubject.value = '';
        if (newSection) {
          await updateTeacherSubjects();
        }
      }
      
      // Handle subject changes
      if (newSubject !== oldSubject && newSubject) {
        await fetchClassData();
      }
    });

    // Add watcher for currentPage
    watch(currentPage, () => {
      console.log('Current page changed to:', currentPage.value);
      saveUserPreferences();
    });

    // Add cleanup on component unmount
    onUnmounted(() => {
      // Save preferences before unmounting
      saveUserPreferences();
      
      // Clear intervals if any
      if (dateUpdateInterval) {
        clearInterval(dateUpdateInterval);
      }
    });

    // Add a function to load the last used filters
    const loadLastUsedFilters = async () => {
      try {
        console.log('Attempting to load last used filters');
        const token = store.state.auth.token;
        const userId = store.state.auth.user?._id;
        
        if (!userId) {
          console.error('User ID not available for loading last used filters');
          return false;
        }
        
        // First check if we have any recent filters in localStorage
        const recentFilters = localStorage.getItem('recentFilters');
        if (recentFilters) {
          try {
            const filters = JSON.parse(recentFilters);
            console.log('Found recent filters in localStorage:', filters);
            
            if (filters.length > 0) {
              // Get the most recent filter
              const mostRecent = filters[0];
              
              // Apply the values
              if (mostRecent.year) selectedYear.value = mostRecent.year;
              if (mostRecent.section) selectedSection.value = mostRecent.section;
              if (mostRecent.subject) selectedSubject.value = mostRecent.subject;
              
              // Save to classRecordPreferences
              const preferences = {
                selectedYear: selectedYear.value,
                selectedSection: selectedSection.value,
                selectedSubject: selectedSubject.value,
                currentPage: currentPage.value
              };
              
              localStorage.setItem('classRecordPreferences', JSON.stringify(preferences));
              console.log('Recent filters applied from localStorage:', preferences);
              
              return true;
            }
          } catch (parseError) {
            console.error('Error parsing recent filters from localStorage:', parseError);
          }
        }
        
        // If no recent filters in localStorage, try to get from API
        try {
          // First try to get the user's teaching assignments
          const response = await api.get('/users/teaching-assignments', {
            params: { userId },
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.data && response.data.assignments && response.data.assignments.length > 0) {
            // Sort by last accessed timestamp if available
            const sortedAssignments = [...response.data.assignments].sort((a, b) => {
              // If lastAccessed is available, use it for sorting
              if (a.lastAccessed && b.lastAccessed) {
                return new Date(b.lastAccessed) - new Date(a.lastAccessed);
              }
              return 0;
            });
            
            // Use the most recently accessed assignment
            const mostRecent = sortedAssignments[0];
            console.log('Most recently used assignment from API:', mostRecent);
            
            // Apply the values
            if (mostRecent.year) selectedYear.value = mostRecent.year;
            if (mostRecent.section) selectedSection.value = mostRecent.section;
            if (mostRecent.subject) selectedSubject.value = mostRecent.subject;
            
            // Save to localStorage
            const preferences = {
              selectedYear: selectedYear.value,
              selectedSection: selectedSection.value,
              selectedSubject: selectedSubject.value,
              currentPage: currentPage.value
            };
            
            localStorage.setItem('classRecordPreferences', JSON.stringify(preferences));
            console.log('Last used filters applied from API:', preferences);
            
            // Also save to recentFilters
            saveToRecentFilters({
              year: selectedYear.value,
              section: selectedSection.value,
              subject: selectedSubject.value,
              timestamp: new Date().toISOString()
            });
            
            return true;
          } else {
            console.log('No teaching assignments found in API');
            return false;
          }
        } catch (apiError) {
          console.error('Error fetching teaching assignments from API:', apiError);
          return false;
        }
      } catch (error) {
        console.error('Error loading last used filters:', error);
        return false;
      }
    };

    // Function to save a filter combination to the recent filters list
    const saveToRecentFilters = (filter) => {
      try {
        // Get existing recent filters or initialize empty array
        const recentFiltersStr = localStorage.getItem('recentFilters');
        let recentFilters = [];
        
        if (recentFiltersStr) {
          try {
            recentFilters = JSON.parse(recentFiltersStr);
          } catch (parseError) {
            console.error('Error parsing recent filters, resetting:', parseError);
          }
        }
        
        // Check if this filter combination already exists
        const existingIndex = recentFilters.findIndex(f => 
          f.year === filter.year && 
          f.section === filter.section && 
          f.subject === filter.subject
        );
        
        // If it exists, remove it (we'll add it back at the top)
        if (existingIndex !== -1) {
          recentFilters.splice(existingIndex, 1);
        }
        
        // Add the new filter at the beginning
        recentFilters.unshift(filter);
        
        // Keep only the 5 most recent filters
        if (recentFilters.length > 5) {
          recentFilters = recentFilters.slice(0, 5);
        }
        
        // Save back to localStorage
        localStorage.setItem('recentFilters', JSON.stringify(recentFilters));
        console.log('Updated recent filters:', recentFilters);
      } catch (error) {
        console.error('Error saving to recent filters:', error);
      }
    };

    // Update assessment history table
    const updateAssessmentHistoryTable = (assessmentsByType) => {
      if (!selectedStudent.value) return;
      
      console.log('Updating assessment history table with date range:', historyDateRange.value);
      
      // If assessmentsByType is not provided, use the current assessments
      if (!assessmentsByType) {
        // Group assessments by type
        assessmentsByType = {
          'Quiz': [],
          'Activity': [],
          'Performance Task': []
        };
        
        // Filter assessments for the selected student
        if (selectedStudent.value.assessments && selectedStudent.value.assessments.length > 0) {
          selectedStudent.value.assessments.forEach(assessment => {
            // Get the score for this student
            const studentNumber = selectedStudent.value.studentNumber;
            let scoreValue = null;
            
            // Check if scores is a Map or an object
            if (assessment.scores) {
              if (assessment.scores instanceof Map) {
                scoreValue = assessment.scores.get(studentNumber);
              } else if (typeof assessment.scores === 'object') {
                scoreValue = assessment.scores[studentNumber];
              }
            }
            
            // If score is not found in assessment.scores, check student.scores
            if ((scoreValue === null || scoreValue === undefined) && 
                selectedStudent.value.scores && 
                (assessment._id in selectedStudent.value.scores || assessment.id in selectedStudent.value.scores)) {
              scoreValue = selectedStudent.value.scores[assessment._id] || selectedStudent.value.scores[assessment.id];
            }
            
            if (scoreValue !== null && scoreValue !== undefined) {
              const maxScore = assessment.maxScore || 100;
              const scorePercentage = (scoreValue / maxScore) * 100;
              
              // Apply date filter if set
              const assessmentDate = new Date(assessment.date);
              const startDate = historyDateRange.value.start ? new Date(historyDateRange.value.start) : null;
              const endDate = historyDateRange.value.end ? new Date(historyDateRange.value.end) : null;
              
              // Skip if outside date range
              if ((startDate && assessmentDate < startDate) || 
                  (endDate && assessmentDate > endDate)) {
                return;
              }
              
              const type = assessment.type || 'Quiz'; // Default to Quiz if type is not specified
              
              assessmentsByType[type].push({
                ...assessment,
                date: assessment.date,
                rawScore: scoreValue,
                score: scorePercentage,
                maxScore: maxScore,
                number: assessment.number,
                title: `${assessment.type} #${assessment.number}`
              });
            }
          });
        }
      }
      
      // Get all assessments across all types
      const allAssessments = [
        ...(assessmentsByType['Quiz'] || []),
        ...(assessmentsByType['Activity'] || []),
        ...(assessmentsByType['Performance Task'] || [])
      ];
      
      // Apply date filter to the history table
      const filteredAssessments = allAssessments.filter(assessment => {
        const assessmentDate = new Date(assessment.date);
        const startDate = historyDateRange.value.start ? new Date(historyDateRange.value.start) : null;
        const endDate = historyDateRange.value.end ? new Date(historyDateRange.value.end) : null;
        
        return (!startDate || assessmentDate >= startDate) && 
               (!endDate || assessmentDate <= endDate);
      });
      
      // Sort by date (newest first)
      filteredAssessments.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Store in the selected student object
      selectedStudent.value.assessmentHistory = filteredAssessments.map(assessment => ({
        date: assessment.date,
        type: assessment.title || `${assessment.type} #${assessment.number}`,
        score: assessment.rawScore,
        maxScore: assessment.maxScore,
        percentage: assessment.score
      }));
      
      console.log(`Updated assessment history with ${selectedStudent.value.assessmentHistory.length} records`);
    };

    // Helper function to get the student's score for an assessment
    const getStudentScore = (student, assessment) => {
      // Get the assessment ID
      const assessmentId = assessment._id || assessment.id;
      
      // Check if the student has a score for this assessment
      if (student.scores && (assessmentId in student.scores)) {
        return student.scores[assessmentId];
      }
      
      // Check if the assessment has a score for this student
      if (assessment.scores) {
        let score;
        
        // Handle both Map and plain object
        if (assessment.scores instanceof Map) {
          score = assessment.scores.get(student.studentNumber);
        } else if (typeof assessment.scores === 'object') {
          score = assessment.scores[student.studentNumber];
        }
        
        if (score !== undefined) {
          // Store the score in the student object for future reference
          if (!student.scores) {
            student.scores = {};
          }
          student.scores[assessmentId] = score;
          return score;
        }
      }
      
      // No score found
      return '';
    };

    return {
      selectedYear,
      selectedSection,
      selectedSubject,
      searchQuery,
      students,
      assessments,
      filteredAssessmentsByDate,
      currentDate,
      showAddAssessmentModal,
      newAssessment,
      selectedStudent,
      quizChart,
      activityChart,
      performanceChart,
      handleAddAssessment,
      updateScore,
      viewStudentDetails,
      formatDate,
      formatDateForDisplay,
      navigateDate,
      user,
      showAddStudentRecordModal,
      newStudentRecord,
      canAddStudentRecord,
      handleAddStudentRecord,
      clearFilters,
      sortField,
      sortOrder,
      sortBy,
      getSortIcon,
      sortedStudents,
      showSearch,
      toggleSearch,
      handleSearch,
      applyFilters,
      getAssessmentBadgeClass,
      getScoreClass,
      updateCharts,
      showEditAssessmentModal,
      editingAssessment,
      editAssessment,
      handleEditAssessment,
      handleDeleteAssessment,
      selectedAssessmentType,
      showChartDateFilter,
      showHistoryDateFilter,
      chartDateRange,
      historyDateRange,
      filteredAssessments,
      applyChartDateFilter,
      clearChartDateFilter,
      applyHistoryDateFilter,
      clearHistoryDateFilter,
      handleLogout,
      availableYears,
      availableSections,
      teacherSubjects,
      openChartDateFilter,
      openHistoryDateFilter,
      slideDirection,
      isNextDayDisabled,
      openAddStudentRecordModal,
      filteredSections,
      canSelectSection,
      canSelectSubject,
      attendanceRecords,
      attendanceStatistics,
      fetchAttendance,
      syncStudentRecords,
      redirectToAttendance,
      currentPage,
      totalPages,
      paginatedStudents,
      paginationInfo,
      nextPage,
      previousPage,
      createPerformanceChart,
      loadLastUsedFilters, // Add the new function
      saveToRecentFilters, // Add the new function
      getStudentScore,
    }
  }
}
</script>

<style scoped>
/* Remove all modal-related styles since they're now in StudentDetailsModal.vue */
/* Keep only the styles needed for the main component */
.class-records {
  padding: 1.5rem;
}

.table-controls {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.btn-control {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  position: relative;
}

.btn-control:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #2d3748;
}

.control-menu {
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  margin-top: 0.5rem;
}

.dropdown-item {
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #e53e3e;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.search-control {
  flex: 1;
  max-width: 400px;
}

.table-responsive {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table th {
  background-color: #f8f9fa;
  color: #666;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-top: none;
  white-space: nowrap;
}

.table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  border-color: #eee;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
  cursor: pointer;
}

.score-input {
  width: 80px;
  text-align: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.25rem;
}

.score-input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
  outline: none;
}

.date-display {
  font-size: 1.1rem;
  font-weight: 500;
  color: #495057;
  padding: 0.5rem 1rem;
  background: #fff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  text-align: center;
}

.empty-state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6c757d;
}

.empty-state-message i {
  font-size: 2rem;
}

.pagination-controls {
  background: white;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
}

.pagination-info {
  color: #4a5568;
  font-size: 0.9rem;
}

.pagination-buttons .btn {
  min-width: 100px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
}

.modal-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-dialog {
  position: relative;
  width: 90%;
  max-width: 600px;
  margin: 1.75rem auto;
  pointer-events: auto;
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  background-clip: padding-box;
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  outline: 0;
  max-height: calc(100vh - 3.5rem);
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  border-top-left-radius: calc(0.5rem - 1px);
  border-top-right-radius: calc(0.5rem - 1px);
}

.modal-body {
  position: relative;
  flex: 1 1 auto;
  padding: 1.5rem;
}

.modal-xxl {
  max-width: 1400px;
}
</style>