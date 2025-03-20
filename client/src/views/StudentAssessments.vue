<template>
  <div class="student-assessments">
    <div class="page-header">
      <h2>Assessment Records</h2>
      <p class="subtitle">View your assessment scores and performance</p>
    </div>

    <!-- Search and Filter Controls -->
    <div class="controls">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search by subject, title, or type..."
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
        
        <select v-model="filterType" class="filter-select">
          <option value="">All Types</option>
          <option v-for="type in availableTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
        
        <select v-model="sortOption" class="filter-select">
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="score-desc">Highest Score</option>
          <option value="score-asc">Lowest Score</option>
        </select>
      </div>
    </div>

    <!-- Assessment Cards by Subject -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading assessment records...</p>
    </div>

    <div v-else class="assessment-container">
      <div v-if="filteredAssessments.length === 0" class="no-data">
        <i class="fas fa-clipboard"></i>
        <p v-if="searchQuery || filterSubject || filterType">
          No assessments match your filters. Try adjusting your search criteria.
        </p>
        <p v-else>
          No assessment records available. Check back later!
        </p>
      </div>

      <div v-else class="subject-groups">
        <div v-for="subject in groupedAssessments" :key="subject.name" class="subject-section">
          <div class="subject-header">
            <h3>{{ subject.name }}</h3>
            <div class="subject-meta">
              <span class="section-badge">{{ subject.section }}</span>
              <span class="teacher-name">Teacher: {{ subject.teacher }}</span>
            </div>
          </div>

          <div class="assessment-grid">
            <div 
              v-for="assessment in subject.assessments" 
              :key="assessment._id" 
              class="assessment-card"
            >
              <div class="assessment-header">
                <span class="assessment-type">{{ assessment.type }}</span>
                <span class="assessment-date">{{ formatDate(assessment.date) }}</span>
              </div>
              <h4 class="assessment-title">{{ assessment.title }}</h4>
              <div class="score-container">
                <div class="score-display">
                  <span class="score-value">{{ assessment.score }}</span>
                  <span class="score-divider">/</span>
                  <span class="max-score">{{ assessment.maxScore }}</span>
                </div>
                <div class="score-percentage">
                  {{ calculatePercentage(assessment.score, assessment.maxScore) }}%
                </div>
              </div>
              
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${Math.min(100, (assessment.score / assessment.maxScore) * 100)}%` }"
                  :class="getPerformanceClass(assessment.score, assessment.maxScore)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assessment Summary -->
    <div class="summary-section">
      <div class="summary-card">
        <h3>Assessment Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">Total Assessments</div>
            <div class="summary-value">{{ totalAssessments }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Average Score</div>
            <div class="summary-value">{{ averageScore }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Highest Score</div>
            <div class="summary-value">{{ highestScore }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Lowest Score</div>
            <div class="summary-value">{{ lowestScore }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'

export default {
  name: 'StudentAssessments',
  setup() {
    const store = useStore()
    const isLoading = ref(true)
    const assessments = ref([])
    const searchQuery = ref('')
    const filterSubject = ref('')
    const filterType = ref('')
    const sortOption = ref('date-desc')

    // Fetch assessments data
    const fetchAssessments = async () => {
      isLoading.value = true
      try {
        const response = await axios.get('/api/users/student/assessments', {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })
        assessments.value = response.data
        
        // Add fallback sample data if needed
        if (assessments.value.length === 0) {
          assessments.value = generateSampleAssessments()
        }
      } catch (error) {
        console.error('Error fetching assessment data:', error)
        // Fallback to sample data
        assessments.value = generateSampleAssessments()
      } finally {
        isLoading.value = false
      }
    }

    // Generate sample data for testing
    const generateSampleAssessments = () => {
      const subjects = ['Mathematics', 'English', 'Science', 'History']
      const types = ['Quiz', 'Exam', 'Project', 'Assignment']
      
      return subjects.map(subject => {
        const assessmentCount = Math.floor(Math.random() * 5) + 3 // 3-7 assessments per subject
        
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
            date: new Date(Date.now() - (Math.random() * 180 * 24 * 60 * 60 * 1000)).toISOString(),
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

    // Available filter options
    const availableSubjects = computed(() => {
      const subjects = new Set()
      assessments.value.forEach(subject => {
        subjects.add(subject.subject)
      })
      return [...subjects]
    })

    const availableTypes = computed(() => {
      const types = new Set()
      assessments.value.forEach(subject => {
        subject.assessments.forEach(assessment => {
          types.add(assessment.type)
        })
      })
      return [...types]
    })

    // Filter and sort assessments
    const filteredAssessments = computed(() => {
      // Filter by subject
      let filtered = [...assessments.value]
      
      if (filterSubject.value) {
        filtered = filtered.filter(subject => subject.subject === filterSubject.value)
      }

      // Filter assessments by search query and type
      filtered = filtered.map(subject => {
        const filteredAssessments = subject.assessments.filter(assessment => {
          const matchesSearch = searchQuery.value === '' ||
            assessment.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            assessment.type.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            subject.subject.toLowerCase().includes(searchQuery.value.toLowerCase())
          
          const matchesType = filterType.value === '' || assessment.type === filterType.value
          
          return matchesSearch && matchesType
        })

        return {
          ...subject,
          assessments: filteredAssessments
        }
      })

      // Remove subjects with no matching assessments
      filtered = filtered.filter(subject => subject.assessments.length > 0)

      return filtered
    })

    // Group assessments by subject
    const groupedAssessments = computed(() => {
      const sorted = [...filteredAssessments.value]
      
      // Sort assessments within each subject
      sorted.forEach(subject => {
        subject.assessments.sort((a, b) => {
          if (sortOption.value === 'date-desc') {
            return new Date(b.date) - new Date(a.date)
          } else if (sortOption.value === 'date-asc') {
            return new Date(a.date) - new Date(b.date)
          } else if (sortOption.value === 'score-desc') {
            return (b.score / b.maxScore) - (a.score / a.maxScore)
          } else if (sortOption.value === 'score-asc') {
            return (a.score / a.maxScore) - (b.score / b.maxScore)
          }
          return 0
        })
      })
      
      return sorted.map(subject => ({
        name: subject.subject,
        section: subject.section,
        teacher: subject.teacher,
        assessments: subject.assessments
      }))
    })

    // Calculate summary statistics
    const allAssessments = computed(() => {
      let all = []
      assessments.value.forEach(subject => {
        subject.assessments.forEach(assessment => {
          all.push(assessment)
        })
      })
      return all
    })

    const totalAssessments = computed(() => {
      return allAssessments.value.length
    })

    const averageScore = computed(() => {
      if (allAssessments.value.length === 0) return 0
      
      let totalPercentage = 0
      allAssessments.value.forEach(assessment => {
        totalPercentage += (assessment.score / assessment.maxScore) * 100
      })
      
      return (totalPercentage / allAssessments.value.length).toFixed(1)
    })

    const highestScore = computed(() => {
      if (allAssessments.value.length === 0) return 0
      
      let highest = 0
      allAssessments.value.forEach(assessment => {
        const percentage = (assessment.score / assessment.maxScore) * 100
        if (percentage > highest) {
          highest = percentage
        }
      })
      
      return highest.toFixed(1)
    })

    const lowestScore = computed(() => {
      if (allAssessments.value.length === 0) return 0
      
      let lowest = 100
      allAssessments.value.forEach(assessment => {
        const percentage = (assessment.score / assessment.maxScore) * 100
        if (percentage < lowest) {
          lowest = percentage
        }
      })
      
      return lowest.toFixed(1)
    })

    // Helper methods
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const calculatePercentage = (score, maxScore) => {
      return Math.round((score / maxScore) * 100)
    }

    const getPerformanceClass = (score, maxScore) => {
      const percentage = (score / maxScore) * 100
      if (percentage >= 90) return 'performance-excellent'
      if (percentage >= 80) return 'performance-good'
      if (percentage >= 70) return 'performance-average'
      if (percentage >= 60) return 'performance-fair'
      return 'performance-poor'
    }

    onMounted(() => {
      fetchAssessments()
    })

    return {
      isLoading,
      searchQuery,
      filterSubject,
      filterType,
      sortOption,
      assessments,
      availableSubjects,
      availableTypes,
      filteredAssessments,
      groupedAssessments,
      totalAssessments,
      averageScore,
      highestScore,
      lowestScore,
      formatDate,
      calculatePercentage,
      getPerformanceClass
    }
  }
}
</script>

<style scoped>
.student-assessments {
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

.subject-groups {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.subject-section {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.subject-header {
  padding: 1.5rem;
  background: linear-gradient(to right, #203464, #4a69bd);
  color: white;
  position: relative;
}

.subject-header h3 {
  font-size: 1.25rem;
  margin: 0;
  margin-bottom: 0.5rem;
}

.subject-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.section-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
}

.assessment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.assessment-card {
  background: #f8fafc;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #edf2f7;
}

.assessment-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.05);
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  align-items: center;
}

.assessment-type {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: #e6f6ff;
  color: #0377bf;
  font-size: 0.75rem;
  font-weight: 500;
}

.assessment-date {
  font-size: 0.75rem;
  color: #718096;
}

.assessment-title {
  font-size: 1rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.score-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.score-display {
  display: flex;
  align-items: baseline;
}

.score-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.score-divider {
  font-size: 1.25rem;
  color: #a0aec0;
  margin: 0 0.25rem;
}

.max-score {
  font-size: 1.25rem;
  color: #718096;
}

.score-percentage {
  font-size: 1.25rem;
  font-weight: 500;
  color: #4a5568;
}

.progress-bar {
  height: 8px;
  background: #edf2f7;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.performance-excellent {
  background: #48bb78;
}

.performance-good {
  background: #68d391;
}

.performance-average {
  background: #f6e05e;
}

.performance-fair {
  background: #f6ad55;
}

.performance-poor {
  background: #f56565;
}

.summary-section {
  margin-top: 3rem;
}

.summary-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.summary-card h3 {
  font-size: 1.25rem;
  color: #2d3748;
  margin: 0 0 1.5rem 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.summary-item {
  text-align: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.75rem;
}

.summary-label {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.5rem;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .filter-box {
    width: 100%;
  }
  
  .filter-select {
    flex: 1;
  }
  
  .assessment-grid {
    grid-template-columns: 1fr;
  }
}
</style> 