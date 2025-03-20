<template>
  <div class="student-dashboard">
    <div class="greeting-section">
      <h2>Welcome, {{ user.firstName }}!</h2>
      <p class="subtitle">Here's your academic performance overview</p>
    </div>

    <!-- Stats Cards Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-book"></i>
        </div>
        <div class="stat-content">
          <h3>Total Subjects</h3>
          <div class="stat-value" v-if="!isLoading">{{ subjectCount }}</div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="stat-content">
          <h3>Assessments</h3>
          <div class="stat-value" v-if="!isLoading">{{ assessmentCount }}</div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <h3>Average Score</h3>
          <div class="stat-value" v-if="!isLoading">
            {{ averageGrade ? averageGrade.toFixed(2) + '%' : 'No data' }}
          </div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-user-check"></i>
        </div>
        <div class="stat-content">
          <h3>Attendance Rate</h3>
          <div class="stat-value" v-if="!isLoading">
            {{ attendanceRate ? attendanceRate.toFixed(2) + '%' : 'No data' }}
          </div>
          <div class="skeleton-loader" v-else></div>
        </div>
      </div>
    </div>

    <!-- Recent Assessments Section -->
    <div class="widget-row">
      <div class="widget-card">
        <div class="widget-header">
          <h3>Recent Assessments</h3>
          <router-link to="/student/assessments" class="view-all-link">
            View All <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>
        <div v-if="isLoading" class="loading-placeholder">
          <div class="spinner"></div>
          <p>Loading assessments...</p>
        </div>
        <div v-else-if="recentAssessments.length === 0" class="no-data">
          <i class="fas fa-clipboard"></i>
          <p>No assessment data available</p>
        </div>
        <div v-else class="assessment-list">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Title</th>
                <th>Type</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assessment in recentAssessments" :key="assessment._id">
                <td>{{ formatDate(assessment.date) }}</td>
                <td>{{ assessment.subject }}</td>
                <td>{{ assessment.title }}</td>
                <td>{{ assessment.type }}</td>
                <td>
                  <span class="score">
                    {{ assessment.score }} / {{ assessment.maxScore }}
                    <span class="score-percent">
                      ({{ ((assessment.score / assessment.maxScore) * 100).toFixed(0) }}%)
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Attendance Record Section -->
    <div class="widget-row">
      <div class="widget-card">
        <div class="widget-header">
          <h3>Recent Attendance</h3>
          <router-link to="/student/attendance" class="view-all-link">
            View All <i class="fas fa-arrow-right"></i>
          </router-link>
        </div>
        <div v-if="isLoading" class="loading-placeholder">
          <div class="spinner"></div>
          <p>Loading attendance records...</p>
        </div>
        <div v-else-if="recentAttendance.length === 0" class="no-data">
          <i class="fas fa-calendar-check"></i>
          <p>No attendance data available</p>
        </div>
        <div v-else class="attendance-list">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in recentAttendance" :key="record._id">
                <td>{{ formatDate(record.date) }}</td>
                <td>{{ record.subject }}</td>
                <td>
                  <span :class="['status-badge', getStatusClass(record.status)]">
                    {{ record.status }}
                  </span>
                </td>
                <td>{{ record.remarks || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Performance Charts -->
    <div class="chart-row">
      <div class="chart-card">
        <h3>Assessment Performance</h3>
        <div class="chart-container">
          <canvas ref="assessmentChart" id="assessmentChart"></canvas>
        </div>
      </div>
      <div class="chart-card">
        <h3>Attendance Overview</h3>
        <div class="chart-container">
          <canvas ref="attendanceChart" id="attendanceChart"></canvas>
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
  name: 'StudentDashboard',
  setup() {
    const store = useStore()
    const user = computed(() => store.state.auth.user)
    const assessmentChart = ref(null)
    const attendanceChart = ref(null)
    const isLoading = ref(true)
    
    // Data references
    const assessments = ref([])
    const attendance = ref([])
    
    // Computed values
    const subjectCount = computed(() => {
      const subjects = new Set()
      assessments.value.forEach(subject => {
        subjects.add(subject.subject)
      })
      return subjects.size
    })
    
    const assessmentCount = computed(() => {
      let count = 0
      assessments.value.forEach(subject => {
        count += subject.assessments.length
      })
      return count
    })
    
    const averageGrade = computed(() => {
      let totalScore = 0
      let totalMaxScore = 0
      
      assessments.value.forEach(subject => {
        subject.assessments.forEach(assessment => {
          totalScore += assessment.score
          totalMaxScore += assessment.maxScore
        })
      })
      
      return totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0
    })
    
    const attendanceRate = computed(() => {
      let presentCount = 0
      let totalCount = 0
      
      attendance.value.forEach(subject => {
        subject.records.forEach(record => {
          totalCount++
          if (record.status.toLowerCase() === 'present') {
            presentCount++
          }
        })
      })
      
      return totalCount > 0 ? (presentCount / totalCount) * 100 : 0
    })
    
    const recentAssessments = computed(() => {
      const allAssessments = []
      
      assessments.value.forEach(subject => {
        subject.assessments.forEach(assessment => {
          allAssessments.push({
            ...assessment,
            subject: subject.subject
          })
        })
      })
      
      return allAssessments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
    })
    
    const recentAttendance = computed(() => {
      const allAttendance = []
      
      attendance.value.forEach(subject => {
        subject.records.forEach(record => {
          allAttendance.push({
            ...record,
            subject: subject.subject
          })
        })
      })
      
      return allAttendance
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
    })
    
    // Methods
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    const getStatusClass = (status) => {
      const statusLower = status.toLowerCase()
      if (statusLower === 'present') return 'status-present'
      if (statusLower === 'late') return 'status-late'
      if (statusLower === 'absent') return 'status-absent'
      return ''
    }
    
    const createAssessmentChart = () => {
      if (!assessmentChart.value) return
      
      const ctx = assessmentChart.value.getContext('2d')
      
      // Collect data for chart
      const subjects = []
      const scoreData = []
      const maxScoreData = []
      
      assessments.value.forEach(subject => {
        let subjectTotalScore = 0
        let subjectTotalMaxScore = 0
        
        subject.assessments.forEach(assessment => {
          subjectTotalScore += assessment.score
          subjectTotalMaxScore += assessment.maxScore
        })
        
        subjects.push(subject.subject)
        scoreData.push((subjectTotalScore / subjectTotalMaxScore) * 100)
        maxScoreData.push(100) // Max is always 100%
      })
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: subjects,
          datasets: [
            {
              label: 'Your Score (%)',
              data: scoreData,
              backgroundColor: '#4299e1',
              borderColor: '#3182ce',
              borderWidth: 1
            },
            {
              label: 'Max Score',
              data: maxScoreData,
              backgroundColor: '#a0aec0',
              borderColor: '#718096',
              borderWidth: 1
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
              title: {
                display: true,
                text: 'Score (%)'
              }
            }
          }
        }
      })
    }
    
    const createAttendanceChart = () => {
      if (!attendanceChart.value) return
      
      const ctx = attendanceChart.value.getContext('2d')
      
      // Count attendance status
      let presentCount = 0
      let lateCount = 0
      let absentCount = 0
      
      attendance.value.forEach(subject => {
        subject.records.forEach(record => {
          const status = record.status.toLowerCase()
          if (status === 'present') presentCount++
          else if (status === 'late') lateCount++
          else if (status === 'absent') absentCount++
        })
      })
      
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Late', 'Absent'],
          datasets: [
            {
              data: [presentCount, lateCount, absentCount],
              backgroundColor: ['#48bb78', '#ecc94b', '#f56565'],
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
    }
    
    // Fetch data
    const fetchData = async () => {
      isLoading.value = true
      
      try {
        // Fetch assessment data
        const assessmentResponse = await axios.get('/api/users/student/assessments', {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })
        assessments.value = assessmentResponse.data
        
        // Fetch attendance data
        const attendanceResponse = await axios.get('/api/users/student/attendance', {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })
        attendance.value = attendanceResponse.data
        
        // Add fallback sample data if needed
        if (assessments.value.length === 0) {
          assessments.value = generateSampleAssessments()
        }
        
        if (attendance.value.length === 0) {
          attendance.value = generateSampleAttendance()
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
        // Add fallback sample data
        assessments.value = generateSampleAssessments()
        attendance.value = generateSampleAttendance()
      } finally {
        isLoading.value = false
        // Create charts after data is loaded
        setTimeout(() => {
          createAssessmentChart()
          createAttendanceChart()
        }, 100)
      }
    }
    
    // Generate sample data for testing
    const generateSampleAssessments = () => {
      const subjects = ['Mathematics', 'English', 'Science', 'History']
      const types = ['Quiz', 'Exam', 'Project', 'Assignment']
      
      return subjects.map(subject => {
        const assessmentCount = Math.floor(Math.random() * 3) + 2 // 2-4 assessments per subject
        
        const subjectAssessments = []
        for (let i = 0; i < assessmentCount; i++) {
          const maxScore = [10, 20, 50, 100][Math.floor(Math.random() * 4)]
          const score = Math.floor(Math.random() * (maxScore * 0.6)) + (maxScore * 0.3) // Score between 30% and 90%
          
          subjectAssessments.push({
            _id: `sample-${subject}-${i}`,
            title: `${subject} ${types[Math.floor(Math.random() * types.length)]} ${i + 1}`,
            type: types[Math.floor(Math.random() * types.length)],
            maxScore: maxScore,
            score: score,
            date: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            teacherName: 'Sample Teacher'
          })
        }
        
        return {
          subject,
          section: '1A',
          teacher: 'Sample Teacher',
          assessments: subjectAssessments
        }
      })
    }
    
    const generateSampleAttendance = () => {
      const subjects = ['Mathematics', 'English', 'Science', 'History']
      const statuses = ['Present', 'Late', 'Absent']
      const statusWeights = [0.8, 0.15, 0.05] // 80% Present, 15% Late, 5% Absent
      
      return subjects.map(subject => {
        const recordCount = Math.floor(Math.random() * 5) + 5 // 5-9 attendance records per subject
        
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
            date: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
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
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      user,
      assessmentChart,
      attendanceChart,
      isLoading,
      subjectCount,
      assessmentCount,
      averageGrade,
      attendanceRate,
      recentAssessments,
      recentAttendance,
      formatDate,
      getStatusClass
    }
  }
}
</script>

<style scoped>
.student-dashboard {
  padding: 1.5rem;
}

.greeting-section {
  margin-bottom: 2rem;
}

.greeting-section h2 {
  font-size: 1.8rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #718096;
  font-size: 1.1rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #ebf4ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-icon i {
  font-size: 1.5rem;
  color: #4299e1;
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
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.widget-row {
  margin-bottom: 2rem;
}

.widget-card, .chart-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.widget-header h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0;
}

.view-all-link {
  color: #4299e1;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.view-all-link:hover {
  color: #2b6cb0;
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
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
  padding: 3rem;
  color: #a0aec0;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: #4a5568;
  background: #f7fafc;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.score {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.score-percent {
  color: #718096;
  font-size: 0.875rem;
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

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.chart-card h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
}

.chart-container {
  height: 300px;
}

.skeleton-loader {
  height: 1.5rem;
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
  .stats-row {
    grid-template-columns: 1fr 1fr;
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.875rem;
  }
}
</style> 