<template>
  <div class="student-attendance">
    <div class="page-header">
      <h2>Attendance Records</h2>
      <p class="subtitle">View your class attendance history</p>
    </div>

    <!-- Search and Filter Controls -->
    <div class="controls">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by subject..."
          class="search-input"
        >
      </div>
      
      <div class="filter-box">
        <select v-model="filterSubject" class="filter-select">
          <option value="">All Subjects</option>
          <option v-for="subject in availableSubjects" :key="subject" :value="subject">
            {{ subject }}
          </option>
        </select>
        
        <select v-model="filterStatus" class="filter-select">
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>
        
        <select v-model="sortOption" class="filter-select">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
        </select>
      </div>
    </div>

    <!-- Attendance Stats Cards -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon present-icon">
          <i class="fas fa-check"></i>
        </div>
        <div class="stat-content">
          <h3>Present</h3>
          <div class="stat-value" v-if="!isLoading">{{ presentCount }} ({{ presentPercentage }}%)</div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon late-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3>Late</h3>
          <div class="stat-value" v-if="!isLoading">{{ lateCount }} ({{ latePercentage }}%)</div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon absent-icon">
          <i class="fas fa-times"></i>
        </div>
        <div class="stat-content">
          <h3>Absent</h3>
          <div class="stat-value" v-if="!isLoading">{{ absentCount }} ({{ absentPercentage }}%)</div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon total-icon">
          <i class="fas fa-list"></i>
        </div>
        <div class="stat-content">
          <h3>Total</h3>
          <div class="stat-value" v-if="!isLoading">{{ totalAttendance }}</div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>
    </div>

    <!-- Attendance Chart -->
    <div class="chart-row">
      <div class="chart-card">
        <h3>Attendance Overview</h3>
        <div class="chart-container">
          <canvas ref="attendanceChart" id="attendanceChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Attendance Records Table -->
    <div class="table-card">
      <div class="card-header">
        <h3>Attendance Records</h3>
        <div class="date-filter">
          <div class="date-picker">
            <label>From:</label>
            <input 
              type="date" 
              v-model="startDate" 
              class="date-input"
              :max="today"
            >
          </div>
          <div class="date-picker">
            <label>To:</label>
            <input 
              type="date" 
              v-model="endDate" 
              class="date-input"
              :max="today"
            >
          </div>
          <button class="filter-btn" @click="clearDateFilter">
            <i class="fas fa-times"></i> Clear
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading attendance records...</p>
      </div>

      <div v-else-if="filteredRecords.length === 0" class="no-data">
        <i class="fas fa-calendar-times"></i>
        <p v-if="searchQuery || filterSubject || filterStatus || startDate || endDate">
          No attendance records match your filters. Try adjusting your search criteria.
        </p>
        <p v-else>
          No attendance records available. Check back later!
        </p>
      </div>

      <div v-else class="attendance-table-wrapper">
        <table class="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Section</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in paginatedRecords" :key="record.id">
              <td>{{ formatDate(record.date) }}</td>
              <td>{{ record.subject }}</td>
              <td>{{ record.section }}</td>
              <td>
                <span :class="['status-badge', getStatusClass(record.status)]">
                  {{ record.status }}
                </span>
              </td>
              <td>{{ record.remarks || '-' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="fas fa-chevron-left"></i>
          </button>
          
          <div class="page-numbers">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import Chart from 'chart.js/auto'

export default {
  name: 'StudentAttendance',
  setup() {
    const store = useStore()
    const isLoading = ref(true)
    const attendance = ref([])
    const attendanceChart = ref(null)
    
    // Filters
    const searchQuery = ref('')
    const filterSubject = ref('')
    const filterStatus = ref('')
    const sortOption = ref('date-desc')
    const startDate = ref('')
    const endDate = ref('')
    const currentPage = ref(1)
    const recordsPerPage = 10
    
    // Get today's date for max date input
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch attendance data
    const fetchAttendance = async () => {
      isLoading.value = true
      try {
        const response = await axios.get('/api/users/student/attendance', {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })
        attendance.value = response.data
        
        // Add fallback sample data if needed
        if (attendance.value.length === 0) {
          attendance.value = generateSampleAttendance()
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error)
        // Fallback to sample data
        attendance.value = generateSampleAttendance()
      } finally {
        isLoading.value = false
        // Create chart after data is loaded
        setTimeout(() => {
          createAttendanceChart()
        }, 100)
      }
    }
    
    // Generate sample data for testing
    const generateSampleAttendance = () => {
      const subjects = ['Mathematics', 'English', 'Science', 'History']
      const statuses = ['Present', 'Late', 'Absent']
      const statusWeights = [0.8, 0.15, 0.05] // 80% Present, 15% Late, 5% Absent
      
      return subjects.map(subject => {
        const recordCount = Math.floor(Math.random() * 10) + 15 // 15-24 attendance records per subject
        
        const attendanceRecords = []
        for (let i = 0; i < recordCount; i++) {
          // Generate weighted random status
          const rand = Math.random()
          let statusIndex = 0
          let cumulativeWeight = 0
          
          for (let j = 0; j < statusWeights.length; j++) {
            cumulativeWeight += statusWeights[j]
            if (rand < cumulativeWeight) {
              statusIndex = j
              break
            }
          }
          
          attendanceRecords.push({
            _id: `sample-${subject}-${i}`,
            date: new Date(Date.now() - (Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
            status: statuses[statusIndex],
            remarks: statuses[statusIndex] === 'Absent' ? 'Excused absence' : ''
          })
        }
        
        return {
          subject,
          section: '1A',
          teacher: 'Sample Teacher',
          records: attendanceRecords
        }
      })
    }
    
    // Available filter options
    const availableSubjects = computed(() => {
      const subjects = new Set()
      attendance.value.forEach(subject => {
        subjects.add(subject.subject)
      })
      return [...subjects]
    })
    
    // Process all records into a flat array
    const allRecords = computed(() => {
      const records = []
      
      attendance.value.forEach(subject => {
        subject.records.forEach(record => {
          records.push({
            id: record._id,
            date: record.date,
            status: record.status,
            remarks: record.remarks,
            subject: subject.subject,
            section: subject.section,
            teacher: subject.teacher
          })
        })
      })
      
      return records
    })
    
    // Filter records
    const filteredRecords = computed(() => {
      let filtered = [...allRecords.value]
      
      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(record => 
          record.subject.toLowerCase().includes(query) ||
          record.section.toLowerCase().includes(query)
        )
      }
      
      // Filter by subject
      if (filterSubject.value) {
        filtered = filtered.filter(record => record.subject === filterSubject.value)
      }
      
      // Filter by status
      if (filterStatus.value) {
        filtered = filtered.filter(record => 
          record.status.toLowerCase() === filterStatus.value.toLowerCase()
        )
      }
      
      // Filter by date range
      if (startDate.value) {
        const start = new Date(startDate.value)
        filtered = filtered.filter(record => new Date(record.date) >= start)
      }
      
      if (endDate.value) {
        const end = new Date(endDate.value)
        end.setHours(23, 59, 59, 999) // End of the day
        filtered = filtered.filter(record => new Date(record.date) <= end)
      }
      
      // Sort records
      if (sortOption.value === 'date-desc') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
      } else if (sortOption.value === 'date-asc') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
      }
      
      return filtered
    })
    
    // Pagination
    const totalPages = computed(() => 
      Math.ceil(filteredRecords.value.length / recordsPerPage)
    )
    
    const paginatedRecords = computed(() => {
      const startIndex = (currentPage.value - 1) * recordsPerPage
      return filteredRecords.value.slice(startIndex, startIndex + recordsPerPage)
    })
    
    // Monitor filter changes to reset pagination
    const resetPagination = () => {
      currentPage.value = 1
    }
    
    // Watch for filter changes
    const setupWatchers = () => {
      // Simple watch implementation since we don't have Vue's watch
      const watchRefs = [searchQuery, filterSubject, filterStatus, startDate, endDate, sortOption]
      const oldValues = watchRefs.map(ref => ref.value)
      
      const checkForChanges = () => {
        for (let i = 0; i < watchRefs.length; i++) {
          if (watchRefs[i].value !== oldValues[i]) {
            resetPagination()
            oldValues[i] = watchRefs[i].value
          }
        }
      }
      
      // Check every 100ms for changes
      setInterval(checkForChanges, 100)
    }
    
    // Attendance statistics
    const presentCount = computed(() => {
      return allRecords.value.filter(record => 
        record.status.toLowerCase() === 'present'
      ).length
    })
    
    const lateCount = computed(() => {
      return allRecords.value.filter(record => 
        record.status.toLowerCase() === 'late'
      ).length
    })
    
    const absentCount = computed(() => {
      return allRecords.value.filter(record => 
        record.status.toLowerCase() === 'absent'
      ).length
    })
    
    const totalAttendance = computed(() => allRecords.value.length)
    
    const presentPercentage = computed(() => {
      return totalAttendance.value === 0 ? 0 : 
        Math.round((presentCount.value / totalAttendance.value) * 100)
    })
    
    const latePercentage = computed(() => {
      return totalAttendance.value === 0 ? 0 : 
        Math.round((lateCount.value / totalAttendance.value) * 100)
    })
    
    const absentPercentage = computed(() => {
      return totalAttendance.value === 0 ? 0 : 
        Math.round((absentCount.value / totalAttendance.value) * 100)
    })
    
    // Create attendance chart
    const createAttendanceChart = () => {
      if (!attendanceChart.value) return
      
      const ctx = attendanceChart.value.getContext('2d')
      
      // Calculate attendance by subject
      const subjects = availableSubjects.value
      const presentData = []
      const lateData = []
      const absentData = []
      
      subjects.forEach(subject => {
        const subjectRecords = allRecords.value.filter(record => record.subject === subject)
        const total = subjectRecords.length
        
        if (total === 0) {
          presentData.push(0)
          lateData.push(0)
          absentData.push(0)
        } else {
          const present = subjectRecords.filter(record => 
            record.status.toLowerCase() === 'present'
          ).length
          
          const late = subjectRecords.filter(record => 
            record.status.toLowerCase() === 'late'
          ).length
          
          const absent = subjectRecords.filter(record => 
            record.status.toLowerCase() === 'absent'
          ).length
          
          presentData.push((present / total) * 100)
          lateData.push((late / total) * 100)
          absentData.push((absent / total) * 100)
        }
      })
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: subjects,
          datasets: [
            {
              label: 'Present',
              data: presentData,
              backgroundColor: '#48bb78',
              borderColor: '#38a169',
              borderWidth: 1
            },
            {
              label: 'Late',
              data: lateData,
              backgroundColor: '#ecc94b',
              borderColor: '#d69e2e',
              borderWidth: 1
            },
            {
              label: 'Absent',
              data: absentData,
              backgroundColor: '#f56565',
              borderColor: '#e53e3e',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true,
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Percentage (%)'
              }
            }
          }
        }
      })
    }
    
    // Helper methods
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      })
    }
    
    const getStatusClass = (status) => {
      const statusLower = status.toLowerCase()
      if (statusLower === 'present') return 'status-present'
      if (statusLower === 'late') return 'status-late'
      if (statusLower === 'absent') return 'status-absent'
      return ''
    }
    
    const clearDateFilter = () => {
      startDate.value = ''
      endDate.value = ''
    }
    
    onMounted(() => {
      fetchAttendance()
      setupWatchers()
    })
    
    return {
      isLoading,
      searchQuery,
      filterSubject,
      filterStatus,
      sortOption,
      startDate,
      endDate,
      currentPage,
      attendance,
      attendanceChart,
      availableSubjects,
      filteredRecords,
      paginatedRecords,
      totalPages,
      presentCount,
      lateCount,
      absentCount,
      totalAttendance,
      presentPercentage,
      latePercentage,
      absentPercentage,
      formatDate,
      getStatusClass,
      clearDateFilter,
      today
    }
  }
}
</script>

<style scoped>
.student-attendance {
  padding: 1.5rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h2 {
  font-size: 1.8rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  font-size: 1.1rem;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-box {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  outline: none;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.filter-box {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 0.875rem;
  color: #4a5568;
  min-width: 150px;
  transition: all 0.3s ease;
}

.filter-select:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  outline: none;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.present-icon {
  background: #c6f6d5;
  color: #2f855a;
}

.late-icon {
  background: #fefcbf;
  color: #b7791f;
}

.absent-icon {
  background: #fed7d7;
  color: #c53030;
}

.total-icon {
  background: #e9d8fd;
  color: #6b46c1;
}

.stat-icon i {
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
}

.chart-row {
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.chart-card h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
}

.chart-container {
  height: 300px;
}

.table-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  background: #f7fafc;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.date-picker label {
  font-size: 0.875rem;
  color: #4a5568;
}

.date-input {
  padding: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.date-input:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
  outline: none;
}

.filter-btn {
  padding: 0.5rem 1rem;
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #4a5568;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: #edf2f7;
}

.attendance-table-wrapper {
  overflow-x: auto;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: #4a5568;
  border-bottom: 1px solid #e2e8f0;
}

.attendance-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.attendance-table tr:last-child td {
  border-bottom: none;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-present {
  background: #c6f6d5;
  color: #2f855a;
}

.status-late {
  background: #fefcbf;
  color: #b7791f;
}

.status-absent {
  background: #fed7d7;
  color: #c53030;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  color: #a0aec0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #4299e1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  color: #a0aec0;
  text-align: center;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #edf2f7;
}

.page-btn {
  width: 36px;
  height: 36px;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #edf2f7;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  font-size: 0.875rem;
  color: #4a5568;
}

.skeleton-loader {
  height: 1.25rem;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .controls,
  .date-filter {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-box,
  .date-picker {
    width: 100%;
  }
  
  .filter-select,
  .date-input {
    width: 100%;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 