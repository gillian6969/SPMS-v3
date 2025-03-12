<template>
  <div class="attendance-view">
    <!-- Control Buttons and Date Navigation -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex gap-2">
        <!-- Any attendance-specific buttons can go here -->
        <button 
          class="btn btn-outline-secondary" 
          @click="refreshAttendance"
          title="Refresh attendance data from database"
        >
          <i class="fas fa-sync-alt me-2"></i> Refresh Attendance
          </button>
      </div>
      
      <!-- Date Navigation -->
      <div class="d-flex align-items-center gap-3">
        <button class="btn btn-outline-primary" @click="navigateDate(-1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <div class="date-display" @click="openCalendarPopup" role="button">
          {{ formatDate(currentDate) }}
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

    <!-- Attendance Table -->
    <div class="card">
      <div class="card-body">
        <!-- Table Controls -->
        <div class="table-controls mb-4" style="z-index: 10000 !important; position: relative;">
          <div class="d-flex gap-3 align-items-center">
            <div class="d-flex gap-3" style="z-index: 10000 !important; position: relative;">
              <!-- Sort Dropdown -->
              <div class="dropdown" style="z-index: 10000 !important; position: relative;">
                <button class="btn btn-control" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-sort me-2"></i> Sort by
                </button>
                <ul class="dropdown-menu control-menu" style="z-index: 10000 !important; position: absolute !important;">
                  <li>
                    <a class="dropdown-item d-flex align-items-center" href="#" @click="sortBy('studentNumber')">
                      <i class="fas fa-sort-numeric-down me-2"></i> Student Number
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
              <div class="dropdown" style="z-index: 10000 !important; position: relative;">
                <button class="btn btn-control" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <i class="fas fa-filter me-2"></i> Filter
                  <span v-if="selectedYear || selectedSection || selectedSubject" class="filter-badge">!</span>
                </button>
                <div class="dropdown-menu control-menu p-3" style="width: 280px; z-index: 10000 !important; position: absolute !important;">
                  <h6 class="dropdown-header mb-2">Filter Options</h6>
                  <div class="mb-3">
                    <label class="form-label">Year Level</label>
                    <select class="form-select form-select-sm" v-model="selectedYear" @change="applyFilters">
                      <option value="">Select Year</option>
                      <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Section</label>
                    <select class="form-select form-select-sm" v-model="selectedSection" :disabled="!selectedYear" @change="applyFilters">
                      <option value="">Select Section</option>
                      <option v-for="section in filteredSections" :key="section" :value="section">{{ section }}</option>
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Subject</label>
                    <select class="form-select form-select-sm" v-model="selectedSubject" :disabled="!selectedSection" @change="applyFilters">
                      <option value="">Select Subject</option>
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
            <div class="search-control" style="flex: 1; max-width: 400px; z-index: 10000 !important; position: relative;">
              <div class="input-group">
                <span class="input-group-text border-end-0">
                  <i class="fas fa-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control border-start-0" 
                  v-model="searchQuery"
                  placeholder="Search students..."
                  @input="handleSearch"
                >
                <button 
                  v-if="searchQuery"
                  class="btn btn-outline-secondary border-start-0" 
                  type="button"
                  @click="clearSearch"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
            <th>Student Number</th>
                <th>Last Name</th>
                <th>First Name</th>
                  <th>Status</th>
              </tr>
            </thead>
            <tbody>
            <tr 
                v-for="student in paginatedStudents" 
                  :key="student.studentNumber" 
                  class="clickable-row" 
                  @click="viewStudentDetails(student)"
                  :class="{
                    'status-row-present': student.currentStatus === 'present',
                    'status-row-absent': student.currentStatus === 'absent',
                    'status-row-late': student.currentStatus === 'late'
                  }"
            >
              <td>{{ student.studentNumber }}</td>
                  <td>{{ student.lastName }}</td>
                  <td>{{ student.firstName }}</td>
                  <td>
                    <div class="attendance-status-container">
                      <select 
                        class="form-select form-select-sm attendance-select"
                        :class="{
                          'select-present': student.currentStatus === 'present',
                          'select-absent': student.currentStatus === 'absent',
                          'select-late': student.currentStatus === 'late',
                          'select-none': student.currentStatus === 'none'
                        }"
                        v-model="student.currentStatus"
                        @change="markAttendance(student, $event.target.value)"
                        @click.stop
                      >
                        <option value="none">Not marked</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                      </select>
                      <div 
                        class="status-indicator" 
                        :class="{
                          'indicator-present': student.currentStatus === 'present',
                          'indicator-absent': student.currentStatus === 'absent',
                          'indicator-late': student.currentStatus === 'late',
                          'indicator-none': student.currentStatus === 'none'
                        }"
                      >
                        <i 
                          class="fas" 
                          :class="{
                            'fa-check-circle': student.currentStatus === 'present',
                            'fa-times-circle': student.currentStatus === 'absent',
                            'fa-exclamation-circle': student.currentStatus === 'late',
                            'fa-question-circle': student.currentStatus === 'none'
                          }"
                        ></i>
                      </div>
                    </div>
                  </td>
              </tr>
              <tr v-if="paginatedStudents.length === 0">
                <td colspan="4" class="text-center py-4">
                  <div class="empty-state-message">
                    <i class="fas fa-users text-muted mb-2"></i>
                    <p class="mb-0">No students found</p>
                    <p class="text-muted small" v-if="selectedYear || selectedSection || selectedSubject">
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

    <!-- Calendar Popup -->
    <div class="calendar-popup" v-if="showCalendarPopup" @click.self="showCalendarPopup = false">
      <div class="calendar-container">
        <div class="calendar-header">
          <h6 class="mb-0">Select Date</h6>
          <button type="button" class="btn-close" @click="showCalendarPopup = false"></button>
        </div>
        <div class="calendar-body">
          <div class="input-group">
            <span class="input-group-text"><i class="fas fa-calendar-day"></i></span>
            <input 
              type="date" 
              class="form-control" 
              :value="formatDateForInput(currentDate)"
              :max="formatDateForInput(new Date())"
              @change="setCurrentDate($event.target.value); showCalendarPopup = false"
            >
          </div>
          
          <!-- Quick Date Buttons -->
          <div class="quick-date-buttons mt-3">
            <button class="btn btn-sm btn-outline-secondary" @click="navigateDate(-7); showCalendarPopup = false">
              <i class="fas fa-angle-double-left me-1"></i> Last Week
            </button>
            <button class="btn btn-sm btn-outline-secondary" @click="navigateDate(-1); showCalendarPopup = false">
              <i class="fas fa-angle-left me-1"></i> Yesterday
            </button>
            <button class="btn btn-sm btn-primary" @click="setCurrentDate(formatDateForInput(new Date())); showCalendarPopup = false">
              Today
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Details Modal -->
    <StudentDetailsModal
      :show="!!selectedStudent"
      :student="selectedStudent || {}"
      :year-level="selectedYear"
      :section="selectedSection"
      :subject="selectedSubject"
      title="Student Attendance Details"
      chart-title="Attendance Overview"
      history-title="Attendance History"
      :chart-id="`attendanceChart-${selectedStudent?.studentId}`"
      :is-class-record="false"
      @update:show="(value) => !value && (selectedStudent = null)"
      @close="selectedStudent = null"
    >
      <template #history-table>
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!selectedStudent?.attendanceHistory || selectedStudent.attendanceHistory.length === 0">
              <td colspan="2" class="text-center py-3 text-muted">
                <i class="fas fa-info-circle me-2"></i>No attendance records found.
              </td>
            </tr>
            <tr v-for="record in selectedStudent?.attendanceHistory" :key="record.date">
              <td>{{ formatDate(record.date) }}</td>
              <td>
                <span 
                  class="badge"
                  :class="{
                    'bg-success': record.status === 'present',
                    'bg-danger': record.status === 'absent',
                    'bg-warning': record.status === 'late'
                  }"
                >
                  {{ record.status.charAt(0).toUpperCase() + record.status.slice(1) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </StudentDetailsModal>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import moment from 'moment-timezone'
import Chart from 'chart.js/auto'
import StudentDetailsModal from '@/components/modals/StudentDetailsModal.vue'

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  name: 'Attendance',
  components: {
    StudentDetailsModal
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const students = ref([])
    const searchQuery = ref('')
    const sortField = ref('lastName')
    const sortOrder = ref('asc')
    const selectedStudent = ref(null)
    const currentDate = ref(moment().tz('Asia/Manila').startOf('day').toDate())
    const slideDirection = ref('')
    let attendanceChart = null
    let dateUpdateInterval = null
    
    // Date filter for attendance history
    const historyStartDate = ref(moment().tz('Asia/Manila').subtract(30, 'days').format('YYYY-MM-DD'))
    const historyEndDate = ref(moment().tz('Asia/Manila').format('YYYY-MM-DD'))
    const showHistoryDatePicker = ref(false)
    const showCalendarPopup = ref(false)

    // Add refs for query parameters
    const selectedYear = ref(route.query.year || localStorage.getItem('selectedYear') || '')
    const selectedSection = ref(route.query.section || localStorage.getItem('selectedSection') || '')
    const selectedSubject = ref(route.query.subject || localStorage.getItem('selectedSubject') || '')
    
    // Add refs for available options
    const availableYears = ref([])
    const availableSections = ref([])
    const sectionsByYear = ref({})
    const teacherSubjects = ref([])
    
    // Computed property for filtered sections based on selected year
    const filteredSections = computed(() => {
      if (!selectedYear.value) return []
      return sectionsByYear.value[selectedYear.value] || []
    })
    
    // Function to fetch available years and sections
    const fetchAvailableYearsAndSections = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id
        
        if (!teacherId) {
          console.error('Teacher ID not available')
          return
        }

        console.log('Fetching available years and sections for teacher:', teacherId)
        
        // Use the teacher-specific endpoint to get only years and sections for this teacher
        const response = await api.get('/teacher-class-records/available-years-sections', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(error => {
          console.error('Error fetching teacher-specific years and sections:', error)
          
          // Fall back to the general endpoint if teacher-specific one fails
          return api.get('/students/available-years-sections', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        })

        console.log('API Response for years and sections:', response.data)

        if (response.data) {
          // Set available years and sections from the response
          availableYears.value = response.data.years || []
          availableSections.value = response.data.sections || []
          
          // Use sectionsByYear from the API response
          if (response.data.sectionsByYear) {
            sectionsByYear.value = response.data.sectionsByYear
          } else {
            sectionsByYear.value = {}
            
            // If we have years and sections but no sectionsByYear mapping,
            // create a simple mapping where each year has all sections
            if (availableYears.value.length > 0 && availableSections.value.length > 0) {
              availableYears.value.forEach(year => {
                sectionsByYear.value[year] = [...availableSections.value]
              })
            }
          }
          
          console.log('Available years:', availableYears.value)
          console.log('Available sections:', availableSections.value)
          console.log('Sections by year mapping:', sectionsByYear.value)
          
          // If no years are available, don't add default values
          // This ensures teachers only see years they've added
          if (availableYears.value.length === 0) {
            console.log('No years found for this teacher')
          }
          
          // If no sections are available, don't add default values
          if (availableSections.value.length === 0) {
            console.log('No sections found for this teacher')
          }
        }
      } catch (error) {
        console.error('Failed to fetch available years and sections:', error)
        // Don't set default values - teacher should only see what they've added
        availableYears.value = []
        availableSections.value = []
        sectionsByYear.value = {}
      }
    }
    
    // Function to fetch teacher subjects
    const fetchTeacherSubjects = async () => {
      try {
        const token = store.state.auth.token
        const teacherId = store.state.auth.user?._id

        if (!teacherId) {
          console.error('Teacher ID not available')
          return
        }

        // Try to fetch subjects from the teacher class records
        try {
          const response = await api.get('/teacher-class-records/available-years-sections', {
          params: { teacherId },
          headers: { 'Authorization': `Bearer ${token}` }
        })

          if (response.data && response.data.subjects && response.data.subjects.length > 0) {
            teacherSubjects.value = response.data.subjects
            console.log('Subjects loaded from teacher class records:', teacherSubjects.value)
          } else {
            // If no subjects found in class records, try the user endpoint
            const userResponse = await api.get(`/users/${teacherId}/subjects`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (userResponse.data && userResponse.data.subjects && userResponse.data.subjects.length > 0) {
              teacherSubjects.value = userResponse.data.subjects
              console.log('Subjects loaded from user profile:', teacherSubjects.value)
            } else {
              // If still no subjects, use default subjects
              console.log('No subjects found, using default subjects')
            }
          }
        } catch (error) {
          console.error('Failed to fetch teacher subjects from class records:', error)
          
          // Try the user endpoint as fallback
          try {
            const userResponse = await api.get(`/users/${teacherId}/subjects`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            
            if (userResponse.data && userResponse.data.subjects && userResponse.data.subjects.length > 0) {
              teacherSubjects.value = userResponse.data.subjects
              console.log('Subjects loaded from user profile (fallback):', teacherSubjects.value)
            } else {
              teacherSubjects.value = ['Math', 'Science', 'English', 'History']
              console.log('No subjects found in user profile, using default subjects')
            }
          } catch (userError) {
            console.error('Failed to fetch teacher subjects from user profile:', userError)
            teacherSubjects.value = ['Math', 'Science', 'English', 'History']
            console.log('Using default subjects due to API errors')
          }
        }
      } catch (error) {
        console.error('Error in fetchTeacherSubjects:', error)
        teacherSubjects.value = ['Math', 'Science', 'English', 'History']
      }
    }
    
    // Function to apply filters
    const applyFilters = async () => {
      console.log('Applying filters:', {
        year: selectedYear.value,
        section: selectedSection.value,
        subject: selectedSubject.value
      })
      
      // Save selected values to localStorage
      if (selectedYear.value) localStorage.setItem('selectedYear', selectedYear.value)
      if (selectedSection.value) localStorage.setItem('selectedSection', selectedSection.value)
      if (selectedSubject.value) localStorage.setItem('selectedSubject', selectedSubject.value)
      
      // Update URL query parameters
      router.replace({
        query: {
          ...route.query,
          year: selectedYear.value || undefined,
          section: selectedSection.value || undefined,
          subject: selectedSubject.value || undefined
        }
      })
      
      // Always fetch student records when filters are applied
      await fetchStudentRecords()
    }
    
    // Function to clear filters
    const clearFilters = () => {
      selectedYear.value = ''
      selectedSection.value = ''
      selectedSubject.value = ''
      localStorage.removeItem('selectedYear')
      localStorage.removeItem('selectedSection')
      localStorage.removeItem('selectedSubject')
      
      // Update URL query parameters
      router.replace({
        query: {}
      })
    }

    // Function to fetch students and their attendance
    const fetchStudentRecords = async () => {
      try {
        const token = store.state.auth.token;
        const teacherId = store.state.auth.user?._id;

        if (!teacherId) {
          console.error('Teacher ID not available');
          return;
        }

        // Create a params object with the teacher ID
        const params = { teacherId };
        
        // Add any selected filters to the params
        if (selectedYear.value) params.year = selectedYear.value;
        if (selectedSection.value) params.section = selectedSection.value;
        if (selectedSubject.value) params.subject = selectedSubject.value;
        
        console.log('Fetching student records with filters:', params);
        
        try {
          const response = await api.get('/teacher-class-records/students-for-attendance', {
            params,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Students API response:', response.data);

          if (response.data) {
            let studentList = [];
            
            if (Array.isArray(response.data)) {
              studentList = response.data;
            } else if (response.data.students && Array.isArray(response.data.students)) {
              studentList = response.data.students;
            }
            
            // Log each student's data to verify studentId is present
            studentList.forEach(student => {
              console.log('Student data:', {
                studentId: student._id || student.studentId,
                studentNumber: student.studentNumber,
                name: `${student.firstName} ${student.lastName}`
              });
            });
            
            // Initialize students with 'none' status and ensure studentId is set
            students.value = studentList.map(student => ({
              ...student,
              studentId: student._id || student.studentId, // Use _id if studentId is not present
              currentStatus: 'none'
            }));
            
            console.log(`Loaded ${students.value.length} students with IDs`);
            
            // Immediately fetch attendance after loading students
            if (students.value.length > 0) {
              await fetchAttendance();
          }
        }
      } catch (error) {
          console.error('Failed to fetch student records:', error);
        students.value = [];
      }
      } catch (error) {
        console.error('Error in fetchStudentRecords:', error);
        students.value = [];
      }
    };

    // Function to fetch attendance for current date
    const fetchAttendance = async () => {
      try {
        // If there are no students, we can't fetch attendance
        if (!students.value.length) {
          console.log('fetchAttendance: No students to fetch attendance for');
          return;
        }

        const date = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
        console.log('fetchAttendance: Fetching attendance data for date:', date);

        // Create params object with the date and required filters
        const params = {
          teacherId: store.state.auth.user?._id,
          date: date
        };
        
        // Add any selected filters to the params
        if (selectedYear.value) params.year = selectedYear.value;
        if (selectedSection.value) params.section = selectedSection.value;
        if (selectedSubject.value) params.subject = selectedSubject.value;
        
        console.log('Fetching attendance with params:', params);
        
        const response = await api.get(`/attendance/date/${date}`, {
          params,
          headers: { 'Authorization': `Bearer ${store.state.auth.token}` }
        });

        console.log('Attendance data received:', response.data);

        // Create a map to store attendance by student ID
        const studentMap = new Map();

        if (response.data && Array.isArray(response.data)) {
          console.log(`Processing ${response.data.length} attendance records`);
          
          // Group records by student ID to find the most recent one for each student
          const recordsByStudent = {};
          
          response.data.forEach(record => {
            if (record.studentId) {
              // If we don't have this student yet, or this record is newer
              if (!recordsByStudent[record.studentId] || 
                  (record.createdAt && 
                   (!recordsByStudent[record.studentId].createdAt || 
                    new Date(record.createdAt) > new Date(recordsByStudent[record.studentId].createdAt)))) {
                recordsByStudent[record.studentId] = record;
                console.log(`Found newer record for student ${record.studentId}: ${record.status} (created at ${record.createdAt})`);
              }
            } else {
              console.log('Record missing studentId:', record);
            }
          });
          
          // Now use the most recent record for each student
          Object.values(recordsByStudent).forEach(record => {
            studentMap.set(String(record.studentId), record.status || 'none');
            console.log(`Using most recent attendance for student ID ${record.studentId}: ${record.status || 'none'} (created at ${record.createdAt})`);
          });
        }

        // Update students with attendance data
        if (students.value && students.value.length > 0) {
          students.value = students.value.map(student => {
            const studentIdStr = String(student.studentId);
            const status = studentMap.get(studentIdStr);
            
            // Store the attendance status for this date
            if (!student.attendanceByDate) {
              student.attendanceByDate = {};
            }
            
            if (status) {
              student.attendanceByDate[date] = status;
            }
            
            // Use the stored status for this date if available, otherwise use the fetched status
            const currentStatus = student.attendanceByDate[date] || status || student.currentStatus || 'none';
            
            console.log(`Setting status for student ${studentIdStr}: ${currentStatus}`);
            
            return {
              ...student,
              currentStatus: currentStatus
            };
          });
          
          // Force a UI update
          await nextTick();
          students.value = [...students.value];
          console.log('Updated attendance status for all students');
        }
      } catch (error) {
        console.error('Error in fetchAttendance:', error);
      }
    };

    // Create attendance chart
    const createPerformanceChart = () => {
      if (!selectedStudent.value) return;
      
      // Create a unique chart ID for each student
      const chartId = `attendanceChart-${selectedStudent.value.studentId}`;
      const chartElement = document.getElementById('attendanceChart');
      
      // Set a unique ID to the chart element
      if (chartElement) {
        chartElement.id = chartId;
      }
      
      const ctx = document.getElementById(chartId)?.getContext('2d');
      if (!ctx) return;

      // Destroy existing chart if it exists
      if (attendanceChart) {
        attendanceChart.destroy();
        attendanceChart = null;
      }

      // Get the chart container
      const chartContainer = document.querySelector('.chart-container');
      if (!chartContainer) return;

      // Check if we have valid attendance statistics and records
      const stats = selectedStudent.value.attendanceStats;
      const hasAttendanceRecords = selectedStudent.value.attendanceHistory && 
                                  selectedStudent.value.attendanceHistory.length > 0;
      
      if (!hasAttendanceRecords || 
          !stats || 
          (stats.presentPercentage === 0 && stats.absentPercentage === 0 && stats.latePercentage === 0)) {
        // If no attendance data, display a message instead of an empty chart
        chartContainer.innerHTML = '';
        const noDataMessage = document.createElement('div');
        noDataMessage.className = 'text-center py-5 text-muted';
        noDataMessage.innerHTML = '<i class="fas fa-info-circle me-2"></i>No attendance data available for this student in the selected date range.';
        chartContainer.appendChild(noDataMessage);
        return;
      }

      // Clear the container and add canvas back
      chartContainer.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.id = chartId;
      chartContainer.appendChild(canvas);

      // Get the context from the new canvas
      const newCtx = document.getElementById(chartId)?.getContext('2d');
      if (!newCtx) return;

      // Enhanced colors for the chart
      const chartColors = {
        present: {
          backgroundColor: '#4CAF50',
          hoverBackgroundColor: '#388E3C',
          borderColor: '#fff',
          borderWidth: 2
        },
        absent: {
          backgroundColor: '#F44336',
          hoverBackgroundColor: '#D32F2F',
          borderColor: '#fff',
          borderWidth: 2
        },
        late: {
          backgroundColor: '#FFC107',
          hoverBackgroundColor: '#FFA000',
          borderColor: '#fff',
          borderWidth: 2
        }
      };

      // Create the chart
      attendanceChart = new Chart(newCtx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent', 'Late'],
          datasets: [{
            data: [stats.presentPercentage, stats.absentPercentage, stats.latePercentage],
            backgroundColor: [
              chartColors.present.backgroundColor,
              chartColors.absent.backgroundColor,
              chartColors.late.backgroundColor
            ],
            hoverBackgroundColor: [
              chartColors.present.hoverBackgroundColor,
              chartColors.absent.hoverBackgroundColor,
              chartColors.late.hoverBackgroundColor
            ],
            borderColor: [
              chartColors.present.borderColor,
              chartColors.absent.borderColor,
              chartColors.late.borderColor
            ],
            borderWidth: 2,
            borderRadius: 5,
            spacing: 5,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000,
            easing: 'easeOutQuart'
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                boxWidth: 15,
                boxHeight: 15,
                font: {
                  size: 14,
                  weight: 'bold'
                },
                generateLabels: (chart) => {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const meta = chart.getDatasetMeta(0);
                      const style = meta.controller.getStyle(i);
                      
                      return {
                        text: `${label}: ${data.datasets[0].data[i].toFixed(1)}%`,
                        fillStyle: style.backgroundColor,
                        strokeStyle: style.borderColor,
                        lineWidth: style.borderWidth,
                        hidden: isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 16,
                weight: 'bold'
              },
              bodyFont: {
                size: 14
              },
              padding: 15,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  return `${label}: ${value.toFixed(1)}%`;
                }
              }
            }
          }
        }
      });
    }

    // View student details
    const viewStudentDetails = async (student) => {
      try {
        // Reset any existing chart before showing a new student
        if (attendanceChart) {
          attendanceChart.destroy();
          attendanceChart = null;
        }
        
        selectedStudent.value = {
          ...student,
          attendanceHistory: [],
          attendanceStats: { presentPercentage: 0, absentPercentage: 0, latePercentage: 0 }
        }
        
        // Fetch attendance history with the current date filters
        await fetchStudentAttendanceHistory(selectedStudent.value);
      } catch (error) {
        console.error('Error fetching student details:', error)
        alert('Failed to load student details. Please try again.')
      }
    }
    
    // Fetch student attendance history with date filters
    const fetchStudentAttendanceHistory = async (student) => {
      if (!student) return;
      
      try {
        console.log(`Fetching attendance history for student ${student.studentNumber} with date range:`, {
          startDate: historyStartDate.value,
          endDate: historyEndDate.value
        });
        
        const response = await api.get(
          `/attendance/${student.studentId}/history`,
          {
            params: {
              subject: selectedSubject.value,
              startDate: historyStartDate.value,
              endDate: historyEndDate.value
            },
            headers: { 'Authorization': `Bearer ${store.state.auth.token}` }
          }
        )
        
        if (response.data) {
          // Make sure we're updating the correct student
          if (selectedStudent.value && selectedStudent.value.studentId === student.studentId) {
            // Only include records that have a valid status (not null, undefined, or empty string)
            const validRecords = Array.isArray(response.data.records) 
              ? response.data.records.filter(record => record && record.status && record.status !== '')
              : [];
            
            selectedStudent.value.attendanceHistory = validRecords;
            
            // Only calculate statistics based on valid records
            if (validRecords.length > 0) {
              // Count occurrences of each status
              const statusCounts = {
                present: 0,
                absent: 0,
                late: 0
              };
              
              validRecords.forEach(record => {
                if (record.status in statusCounts) {
                  statusCounts[record.status]++;
                }
              });
              
              // Calculate percentages
              const total = validRecords.length;
              const presentPercentage = total > 0 ? (statusCounts.present / total) * 100 : 0;
              const absentPercentage = total > 0 ? (statusCounts.absent / total) * 100 : 0;
              const latePercentage = total > 0 ? (statusCounts.late / total) * 100 : 0;
              
              selectedStudent.value.attendanceStats = {
                presentPercentage,
                absentPercentage,
                latePercentage
              };
      } else {
              // If no valid records, set all percentages to 0
              selectedStudent.value.attendanceStats = {
                presentPercentage: 0,
                absentPercentage: 0,
                latePercentage: 0
              };
            }
            
            console.log(`Loaded ${selectedStudent.value.attendanceHistory.length} attendance records for student ${student.studentNumber}`);
            
            // Create attendance chart on next tick to ensure DOM is ready
            nextTick(() => {
              // Reset any existing chart before creating a new one
              if (attendanceChart) {
                attendanceChart.destroy();
                attendanceChart = null;
              }
              createPerformanceChart();
            });
          } else {
            console.log('Selected student changed, not updating attendance history');
          }
        }
      } catch (error) {
        console.error('Error fetching student attendance history:', error);
        selectedStudent.value.attendanceHistory = [];
        selectedStudent.value.attendanceStats = { 
          presentPercentage: 0, 
          absentPercentage: 0, 
          latePercentage: 0 
        };
        
        // Create chart with empty data
        nextTick(() => {
          if (attendanceChart) {
            attendanceChart.destroy();
            attendanceChart = null;
          }
          createPerformanceChart();
        });
      }
    }

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

    // Sort students
    const sortedStudents = computed(() => {
      if (!Array.isArray(students.value)) {
        return []
      }

      let sortedList = [...students.value]
      if (sortField.value) {
        sortedList.sort((a, b) => {
          let aVal = a[sortField.value]
          let bVal = b[sortField.value]
          if (typeof aVal === 'string') aVal = aVal.toLowerCase()
          if (typeof bVal === 'string') bVal = bVal.toLowerCase()
          if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
          if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
          return 0
        })
      }

      if (!searchQuery.value) {
      return sortedList
      }
      
      const searchLower = searchQuery.value.toLowerCase()
      return sortedList.filter(student => {
        return (
          student.studentNumber.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower)
        )
      })
    })

    // Update attendance status
    const markAttendance = async (student, status) => {
      try {
        if (!status || !student) {
          console.log('Invalid status or student:', { status, student });
          return;
        }
        
        const date = moment(currentDate.value).tz('Asia/Manila').startOf('day').format('YYYY-MM-DD');
        console.log('Marking attendance:', {
          studentId: student.studentId,
          studentNumber: student.studentNumber,
          status,
          date
        });

        const attendanceData = {
          studentId: student.studentId,
          studentNumber: student.studentNumber,
          teacherId: store.state.auth.user._id,
          date: date,
          subject: selectedSubject.value,
          section: selectedSection.value,
          year: selectedYear.value,
          status: status,
          createdAt: new Date().toISOString() // Ensure we have a current timestamp
        };
        
        // Update UI immediately for better responsiveness
        student.currentStatus = status;

        const response = await api.post('/attendance', attendanceData, {
          headers: { 'Authorization': `Bearer ${store.state.auth.token}` }
        });

        if (response.data) {
          console.log('Attendance marked successfully:', response.data);
          
          // Store the attendance status in the student object for this date
          if (!student.attendanceByDate) {
            student.attendanceByDate = {};
          }
          student.attendanceByDate[date] = status;
          
          // If the student is currently selected in the details modal, update their history
          if (selectedStudent.value && selectedStudent.value.studentId === student.studentId) {
            await fetchStudentAttendanceHistory(selectedStudent.value);
          }
        }
      } catch (error) {
        console.error('Error marking attendance:', error);
        // Revert the status on error
        student.currentStatus = 'none';
        alert('Failed to save attendance. Please try again.');
      }
    };

    // Handle search
    const handleSearch = () => {
      // The sortedStudents computed property will automatically filter based on searchQuery
    }

    // Watch for query parameter changes
    watch([selectedYear, selectedSection, selectedSubject], async () => {
      // Save selected values to localStorage
      if (selectedYear.value) localStorage.setItem('selectedYear', selectedYear.value)
      if (selectedSection.value) localStorage.setItem('selectedSection', selectedSection.value)
      if (selectedSubject.value) localStorage.setItem('selectedSubject', selectedSubject.value)
      
      // Fetch student records and attendance when filters change
      if (selectedYear.value && selectedSection.value && selectedSubject.value) {
        await fetchStudentRecords()
      }
      
      // Update navigation title
      if (selectedYear.value && selectedSection.value && selectedSubject.value) {
        try {
          if (router.currentRoute.value.matched[0].components.default.props) {
            router.currentRoute.value.matched[0].components.default.props.selectedInfo = 
              `${selectedYear.value} - ${selectedSection.value} | ${selectedSubject.value}`
          }
        } catch (error) {
          console.error('Error updating navigation title:', error)
        }
      }
    })

    // Watch for date changes
    watch(currentDate, async (newDate, oldDate) => {
      console.log('Current date changed from', moment(oldDate).format('YYYY-MM-DD'), 'to', moment(newDate).format('YYYY-MM-DD'));
      
      // Only fetch if we have the required data
      if (selectedYear.value && selectedSection.value && selectedSubject.value && students.value.length > 0) {
        console.log('Fetching attendance data for new date');
        await fetchAttendance();
      } else {
        console.log('Skipping attendance fetch due to missing data:', {
          year: selectedYear.value,
          section: selectedSection.value,
          subject: selectedSubject.value,
          studentsCount: students.value?.length || 0
        });
      }
    });

    // Clean up chart when component unmounts
    onUnmounted(() => {
      if (attendanceChart) {
        attendanceChart.destroy()
        attendanceChart = null
      }
      
      if (dateUpdateInterval) {
        clearInterval(dateUpdateInterval)
      }
    })

    // Clean up chart when student modal closes
    watch(() => selectedStudent.value, (newValue, oldValue) => {
      if (!newValue && attendanceChart) {
        attendanceChart.destroy();
        attendanceChart = null;
        
        // Reset the chart element ID back to the default
        if (oldValue) {
          const chartElement = document.getElementById(`attendanceChart-${oldValue.studentId}`);
          if (chartElement) {
            chartElement.id = 'attendanceChart';
          }
        }
      }
    });

    // Format date for display
    const formatDate = (date) => {
      if (!date) return 'N/A'
      return moment(date).tz('Asia/Manila').format('MMMM D, YYYY')
    }
    
    // Format date for input fields (YYYY-MM-DD)
    const formatDateForInput = (date) => {
      if (!date) return ''
      return moment(date).tz('Asia/Manila').format('YYYY-MM-DD')
    }

    // Add isNextDayDisabled computed property
    const isNextDayDisabled = computed(() => {
      const now = moment().tz('Asia/Manila').startOf('day')
      const selected = moment(currentDate.value).tz('Asia/Manila').startOf('day')
      return selected.isSameOrAfter(now, 'day')
    })

    // Add navigateDate function
    const navigateDate = (direction) => {
      const now = moment().tz('Asia/Manila').startOf('day')
      const newDate = moment(currentDate.value).tz('Asia/Manila').startOf('day').add(direction, 'days')
      
      // Only allow navigation to past dates or current date
      if (direction < 0 || (direction > 0 && !newDate.isAfter(now, 'day'))) {
        slideDirection.value = direction > 0 ? 'slide-left' : 'slide-right'
        currentDate.value = newDate.toDate()
        
        // Refresh attendance data
        fetchAttendance()
        
        setTimeout(() => {
          slideDirection.value = ''
        }, 300)
      }
    }

    // Setup date auto-update to handle timezone correctly
    const setupDateAutoUpdate = () => {
      const checkAndUpdateDate = () => {
        const now = moment().tz('Asia/Manila').startOf('day')
        const current = moment(currentDate.value).tz('Asia/Manila').startOf('day')
        
        // If it's past midnight and we're showing yesterday's date
        if (now.isAfter(current, 'day')) {
          currentDate.value = now.toDate()
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

    // Add watchers for filter changes
    watch(selectedYear, (newValue) => {
      if (newValue) {
        selectedSection.value = '';
        selectedSubject.value = '';
      }
    });

    watch(selectedSection, (newValue) => {
      if (newValue) {
        selectedSubject.value = '';
      }
    });

    // Get attendance status for display
    const getAttendanceStatus = (student) => {
      // If student has a currentStatus property and it's not 'none', use it
      if (student.currentStatus && student.currentStatus !== 'none') {
        return student.currentStatus;
      }
      
      // If no status is set, return 'none'
      return 'none';
    }

    // Add setCurrentDate function
    const setCurrentDate = (dateString) => {
      if (!dateString) return;
      
      const newDate = moment(dateString).tz('Asia/Manila').startOf('day');
      const now = moment().tz('Asia/Manila').startOf('day');
      
      // Only allow setting dates up to the current date
      if (newDate.isAfter(now, 'day')) {
        return;
      }
      
      // Set animation direction based on whether we're going forward or backward in time
      const currentMoment = moment(currentDate.value).tz('Asia/Manila').startOf('day');
      slideDirection.value = newDate.isAfter(currentMoment) ? 'slide-left' : 'slide-right';
      
      // Update the current date
      currentDate.value = newDate.toDate();
      
      // Refresh attendance data
      fetchAttendance();
      
      // Reset animation after transition completes
      setTimeout(() => {
        slideDirection.value = '';
      }, 300);
    };

    // Reset history date filter to default (last 30 days)
    const resetHistoryDateFilter = () => {
      historyStartDate.value = moment().tz('Asia/Manila').subtract(30, 'days').format('YYYY-MM-DD');
      historyEndDate.value = moment().tz('Asia/Manila').format('YYYY-MM-DD');
      
      // Fetch attendance history with the reset date range
      if (selectedStudent.value) {
        fetchStudentAttendanceHistory(selectedStudent.value);
      }
    };

    // Set history date range based on preset
    const setHistoryDateRange = (preset) => {
      const now = moment().tz('Asia/Manila');
      
      switch (preset) {
        case 'week':
          historyStartDate.value = now.clone().subtract(7, 'days').format('YYYY-MM-DD');
          break;
        case 'month':
          historyStartDate.value = now.clone().subtract(30, 'days').format('YYYY-MM-DD');
          break;
        case 'quarter':
          historyStartDate.value = now.clone().subtract(90, 'days').format('YYYY-MM-DD');
          break;
        case 'semester':
          // Approximately 6 months
          historyStartDate.value = now.clone().subtract(180, 'days').format('YYYY-MM-DD');
          break;
        default:
          historyStartDate.value = now.clone().subtract(30, 'days').format('YYYY-MM-DD');
      }
      
      historyEndDate.value = now.format('YYYY-MM-DD');
      
      // Fetch attendance history with the new date range
      if (selectedStudent.value) {
        fetchStudentAttendanceHistory(selectedStudent.value);
      }
    };

    // Initialize component
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
        try {
          console.log('Component mounted, initializing...');
          
          // Fetch available years, sections, and subjects
          await Promise.all([
            fetchAvailableYearsAndSections(),
            fetchTeacherSubjects()
          ]);
          
          console.log('Initialization complete, checking for saved filters:', {
            year: selectedYear.value,
            section: selectedSection.value,
            subject: selectedSubject.value
          });
          
          // Apply filters if they are set
          if (selectedYear.value && selectedSection.value && selectedSubject.value) {
            console.log('Saved filters found, fetching student records...');
            await fetchStudentRecords();
            console.log('Student records loaded');
          } else {
            console.log('No saved filters found, skipping data fetch');
          }
          
          // Set up date auto-update
          setupDateAutoUpdate();
      } catch (error) {
          console.error('Error during component initialization:', error);
        }
      } else {
        router.push('/login');
      }
    });
    
    // Function to refresh attendance data
    const refreshAttendance = async () => {
      console.log('Manually refreshing attendance data');
      
      // Show loading indicator
      const refreshButton = document.querySelector('.btn-outline-secondary i.fa-sync-alt');
      if (refreshButton) {
        refreshButton.classList.add('fa-spin');
      }
      
      try {
      // Fetch fresh attendance data from the server
      await fetchAttendance();
      
      // Force a UI update to ensure the changes are reflected
      nextTick(() => {
        students.value = [...students.value];
          console.log('Attendance data refreshed successfully');
        });
      } catch (error) {
        console.error('Error refreshing attendance data:', error);
      } finally {
        // Remove loading indicator
        setTimeout(() => {
          if (refreshButton) {
            refreshButton.classList.remove('fa-spin');
          }
        }, 500);
      }
    };

    // Add openDatePicker function
    const openDatePicker = () => {
      const datePicker = document.querySelector('.date-picker-hidden');
      if (datePicker) {
        datePicker.click();
      }
    }

    // Add openHistoryDatePicker function
    const openHistoryDatePicker = () => {
      showHistoryDatePicker.value = true;
    }
    
    // Add applyHistoryDateFilter function
    const applyHistoryDateFilter = () => {
      if (selectedStudent.value) {
        fetchStudentAttendanceHistory(selectedStudent.value);
      }
      showHistoryDatePicker.value = false;
    }

    // Add openCalendarPopup function
    const openCalendarPopup = () => {
      showCalendarPopup.value = true;
    }

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
      }
    }

    const previousPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--
      }
    }

    // Reset pagination when filters change
    watch([searchQuery, selectedYear, selectedSection, selectedSubject], () => {
      currentPage.value = 1
    })

    // Add clearSearch function if it doesn't exist
    const clearSearch = () => {
      searchQuery.value = ''
      handleSearch()
    }

    return {
      students,
      searchQuery,
      sortedStudents,
      selectedStudent,
      currentDate,
      formatDate,
      formatDateForInput,
      navigateDate,
      isNextDayDisabled,
      markAttendance,
      slideDirection,
      selectedYear,
      selectedSection,
      selectedSubject,
      sortBy,
      getSortIcon,
      handleSearch,
      viewStudentDetails,
      fetchStudentAttendanceHistory,
      historyStartDate,
      historyEndDate,
      availableYears,
      availableSections,
      sectionsByYear,
      teacherSubjects,
      filteredSections,
      fetchAvailableYearsAndSections,
      fetchTeacherSubjects,
      applyFilters,
      clearFilters,
      getAttendanceStatus,
      setCurrentDate,
      resetHistoryDateFilter,
      setHistoryDateRange,
      openDatePicker,
      showHistoryDatePicker,
      openHistoryDatePicker,
      applyHistoryDateFilter,
      showCalendarPopup,
      openCalendarPopup,
      refreshAttendance,
      currentPage,
      totalPages,
      paginatedStudents,
      paginationInfo,
      nextPage,
      previousPage,
      clearSearch,
    }
  }
}
</script>

<style scoped>
/* Base z-index hierarchy - significantly increased values */
:root {
  --z-base: 1;
  --z-table: 10;
  --z-controls: 1000;
  --z-dropdown: 10000;
  --z-modal-backdrop: 20000;
  --z-modal-wrapper: 20100;
  --z-modal-content: 20200;
  --z-table-header: 20;
}

.attendance-view {
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
  position: relative;
}

/* Controls container */
.controls-container {
  position: relative;
  z-index: var(--z-controls);
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
}

/* Dropdown styles */
.dropdown {
  position: relative;
  z-index: var(--z-dropdown);
}

.dropdown-menu {
  position: absolute !important;
  z-index: var(--z-dropdown) !important;
  transform: none !important;
  top: 100% !important;
  left: 0 !important;
  float: none !important;
  min-width: 10rem !important;
  background-color: #fff !important;
  border: none !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  padding: 0.5rem 0 !important;
  margin-top: 0.5rem !important;
}

/* Table container - lower z-index than controls */
.table-responsive {
  position: relative;
  z-index: var(--z-table);
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: visible;
  margin-top: 1rem;
}

.card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: visible !important;
  position: relative;
}

.card-body {
  padding: 1.5rem;
  position: relative;
}

.table-controls {
  position: relative;
  z-index: 10000 !important; /* Same as dropdown z-index to ensure it stays on top */
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: visible !important;
}

/* Dropdown button */
.btn-control {
  position: relative;
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
  z-index: var(--z-controls);
}

.btn-control:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #2d3748;
}

/* Dropdown menu */
.control-menu {
  border: none !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  padding: 0.5rem 0 !important;
  margin-top: 0.5rem !important;
  z-index: var(--z-dropdown) !important;
  position: absolute !important;
  min-width: 10rem !important;
  background-color: #fff !important;
}

/* Override Bootstrap's dropdown styles */
.dropdown-menu.show {
  display: block !important;
  z-index: var(--z-dropdown) !important;
  position: absolute !important;
}

.dropdown-item {
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-item:hover {
  background-color: #f8fafc;
  color: #2d3748;
}

.dropdown-header {
  color: #2d3748;
  font-weight: 600;
  font-size: 1rem;
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
  position: relative;
  z-index: 10000 !important;
}

/* Table styles from ClassRecords */
.table {
  width: 100%;
  margin-bottom: 0;
  color: #4a5568;
  vertical-align: top;
  border-color: #e2e8f0;
}

.table th {
  position: sticky;
  top: 0;
  z-index: var(--z-table-header);
  background-color: #f8f9fa;
  color: #666;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-top: none;
  white-space: nowrap;
  vertical-align: bottom;
  border-bottom: 2px solid #e2e8f0;
}

.table td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  border-color: #eee;
  border-top: 1px solid #e2e8f0;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.table-hover tbody tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
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
  cursor: pointer;
  transition: all 0.2s;
}

.date-display:hover {
  background: #f8fafc;
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

.status-badge {
  padding: 0.5em 0.75em;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: capitalize;
}

.status-present {
  background-color: #48bb78;
  color: white;
}

.status-absent {
  background-color: #f56565;
  color: white;
}

.status-late {
  background-color: #ed8936;
  color: white;
}

.status-excused {
  background-color: #4299e1;
  color: white;
}

.calendar-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-wrapper);
  background-color: rgba(0, 0, 0, 0.5);
}

.calendar-container {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: var(--z-modal-content);
  max-width: 400px;
  width: 100%;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.calendar-body {
  margin-bottom: 1rem;
}

.quick-date-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: space-between;
}

.student-details {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
}

.chart-section {
  position: relative;
  z-index: var(--z-modal-content);
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-section h6 {
  color: #2d3748;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.attendance-table {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.attendance-table th {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  background: white;
  position: sticky;
  top: 0;
  z-index: var(--z-table-header);
}

.attendance-table td {
  font-size: 1.1rem;
  color: #4a5568;
}

.badge {
  font-size: 1rem;
  padding: 0.5em 1em;
}

/* Chart container */
.chart-container {
  position: relative;
  width: 100%;
  height: 300px;
}

/* Add these styles for attendance status */
.attendance-status-container {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.attendance-select {
  flex: 1;
  padding-right: 2.5rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.select-present {
  border-color: #48bb78;
  background-color: rgba(72, 187, 120, 0.1);
}

.select-absent {
  border-color: #f56565;
  background-color: rgba(245, 101, 101, 0.1);
}

.select-late {
  border-color: #ed8936;
  background-color: rgba(237, 137, 54, 0.1);
}

.select-none {
  border-color: #a0aec0;
  background-color: rgba(160, 174, 192, 0.1);
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 1rem;
  color: white;
}

.indicator-present {
  background-color: #48bb78;
}

.indicator-absent {
  background-color: #f56565;
}

.indicator-late {
  background-color: #ed8936;
}

.indicator-none {
  background-color: #a0aec0;
}

/* Add these styles for status row highlighting */
.status-row-present {
  background-color: rgba(72, 187, 120, 0.05);
}

.status-row-absent {
  background-color: rgba(245, 101, 101, 0.05);
}

.status-row-late {
  background-color: rgba(237, 137, 54, 0.05);
}
</style> 
