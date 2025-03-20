<template>
  <div class="all-survey-stat">
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading survey statistics...</p>
    </div>
    
    <div v-else-if="noData" class="text-center py-4">
      <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
      <h5>No Survey Data Available</h5>
      <p class="text-muted">No survey responses have been submitted yet.</p>
    </div>
    
    <div v-else class="survey-charts row g-4">
      <!-- Problem Types Distribution -->
      <div class="col-md-6">
        <div class="chart-container">
          <h6 class="chart-title">Problem Types Distribution</h6>
          <canvas ref="problemTypesChart"></canvas>
        </div>
      </div>
      
      <!-- Severity Levels -->
      <div class="col-md-6">
        <div class="chart-container">
          <h6 class="chart-title">Severity Levels Distribution</h6>
          <canvas ref="severityLevelsChart"></canvas>
        </div>
      </div>
      
      <!-- Response Rates Chart -->
      <div class="col-md-12">
        <div class="chart-container">
          <h6 class="chart-title">Survey Response Rates</h6>
          <canvas ref="responseRatesChart"></canvas>
        </div>
      </div>
    </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import Chart from 'chart.js/auto'
import moment from 'moment'

const store = useStore()
const loading = ref(true)
const noData = ref(false)
const problemTypesChart = ref(null)
const severityLevelsChart = ref(null)
const responseRatesChart = ref(null)
const surveys = ref([])
const problemCounts = ref({})
const severityCounts = ref({
  high: 0,
  medium: 0,
  low: 0,
  minimal: 0
})

// Get severity level based on score
const getSeverityLevel = (score) => {
  if (score >= 7) return 'high';
  if (score >= 5) return 'medium';
  if (score >= 3) return 'low';
  return 'minimal';
}

// Fetch all submitted surveys and process for statistics
const fetchSurveyData = async () => {
  try {
    loading.value = true
    const token = store.state.auth.token
    
    // Get all completed surveys from the survey collection
    const response = await axios.get('http://localhost:8000/api/survey/submitted', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log('Survey data received:', response.data)
      surveys.value = response.data
      noData.value = false
      processSurveyData()
    } else {
      console.log('No survey data found')
      noData.value = true
    }
  } catch (error) {
    console.error('Error fetching survey data:', error)
    noData.value = true
  } finally {
    loading.value = false
  }
}

// Process survey data to generate statistics
const processSurveyData = () => {
  // Reset counts
  problemCounts.value = {}
  severityCounts.value = {
    high: 0,
    medium: 0,
    low: 0,
    minimal: 0
  }
  
  // Process each survey
  surveys.value.forEach(survey => {
    // Count problem types and their severity
    if (survey.surveyStats && Array.isArray(survey.surveyStats)) {
      survey.surveyStats.forEach(stat => {
        // Count problem types
        if (stat.type) {
          if (!problemCounts.value[stat.type]) {
            problemCounts.value[stat.type] = 0
          }
          problemCounts.value[stat.type]++
        }
        
        // Count severity levels
        const severityLevel = getSeverityLevel(stat.average || 0)
        severityCounts.value[severityLevel]++
      })
    }
  })
  
  console.log('Processed problem counts:', problemCounts.value)
  console.log('Processed severity counts:', severityCounts.value)
  
  // Create charts after processing data
  renderProblemTypesChart()
  renderSeverityLevelsChart()
  renderResponseRatesChart()
}

// Create problem types distribution chart
const renderProblemTypesChart = () => {
  if (!problemTypesChart.value) return
  
  const ctx = problemTypesChart.value.getContext('2d')
  if (!ctx) return
  
  const existingChart = Chart.getChart(ctx)
  if (existingChart) existingChart.destroy()
  
  const problemTypes = Object.keys(problemCounts.value)
  const problemData = Object.values(problemCounts.value)
  
  // If no data, show default values
  if (problemTypes.length === 0) {
    const defaultTypes = ['Academic', 'Financial', 'Personal', 'Health', 'Social']
    const defaultData = [0, 0, 0, 0, 0]
    
    // Create chart with default empty data
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: defaultTypes,
        datasets: [{
          data: defaultData,
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              padding: 15
            }
          }
        }
      }
    })
    return
  }
  
  // Chart colors
  const colors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)'
  ]
  
  // Create chart
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: problemTypes,
      datasets: [{
        data: problemData,
        backgroundColor: colors.slice(0, problemTypes.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0
              const total = problemData.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${context.label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// Create severity levels distribution chart
const renderSeverityLevelsChart = () => {
  if (!severityLevelsChart.value) return
  
  const ctx = severityLevelsChart.value.getContext('2d')
  if (!ctx) return
  
  const existingChart = Chart.getChart(ctx)
  if (existingChart) existingChart.destroy()
  
  const labels = ['High', 'Medium', 'Low', 'Minimal']
  const data = [
    severityCounts.value.high,
    severityCounts.value.medium,
    severityCounts.value.low,
    severityCounts.value.minimal
  ]
  
  // Chart colors
  const colors = [
    'rgba(220, 53, 69, 0.7)',   // High (red)
    'rgba(255, 193, 7, 0.7)',   // Medium (yellow)
    'rgba(13, 110, 253, 0.7)',  // Low (blue)
    'rgba(25, 135, 84, 0.7)'    // Minimal (green)
  ]
  
  // Create chart
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw || 0
              const total = data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${context.label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// Create response rates chart (by month)
const renderResponseRatesChart = () => {
  if (!responseRatesChart.value) return
  
  const ctx = responseRatesChart.value.getContext('2d')
  if (!ctx) return
  
  const existingChart = Chart.getChart(ctx)
  if (existingChart) existingChart.destroy()
  
  // Group surveys by month
  const monthlyData = {}
  
  // If no surveys, create sample data for current and past months
  if (surveys.value.length === 0) {
    const currentMonth = moment().format('MMM YYYY')
    const lastMonth = moment().subtract(1, 'month').format('MMM YYYY')
    const twoMonthsAgo = moment().subtract(2, 'month').format('MMM YYYY')
    
    monthlyData[twoMonthsAgo] = 0
    monthlyData[lastMonth] = 0
    monthlyData[currentMonth] = 0
  } else {
    surveys.value.forEach(survey => {
      const date = moment(survey.createdAt || survey.updatedAt)
      const monthKey = date.format('MMM YYYY')
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0
      }
      
      monthlyData[monthKey]++
    })
  }
  
  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    return moment(a, 'MMM YYYY').diff(moment(b, 'MMM YYYY'))
  })
  
  const responseData = sortedMonths.map(month => monthlyData[month])
  
  // Create chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedMonths,
      datasets: [{
        label: 'Survey Responses',
        data: responseData,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
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
            label: (context) => `${context.raw} survey${context.raw !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          title: {
            display: true,
            text: 'Number of Responses'
          }
        }
      }
    }
  })
}

// Initialize component
onMounted(() => {
  fetchSurveyData()
})
</script>

<style scoped>
.all-survey-stat {
  padding: 1rem;
}

.chart-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: 300px;
  position: relative;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1rem;
  text-align: center;
}

canvas {
  max-height: 100%;
}
</style>