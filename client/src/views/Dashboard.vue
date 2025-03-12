<template>
  <div class="dashboard" ref="dashboardContainer">
    <!-- Year Filter -->
    <div class="filter-section mb-4">
      <div v-if="isCITHead" class="d-flex gap-3 align-items-center">
        <div class="filter-group">
          <select class="form-select" v-model="selectedYear" @change="handleYearChange">
            <option value="">All Academic Years</option>
            <option value="1st">1st Year</option>
            <option value="2nd">2nd Year</option>
            <option value="3rd">3rd Year</option>
            <option value="4th">4th Year</option>
          </select>
        </div>
        <button class="btn btn-refresh" @click="refreshDashboard">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div id="analytics" class="analytics-grid mb-4">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-user-graduate"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalStudents }}</h3>
          <p class="stat-label">Total Students</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chalkboard-teacher"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalTeachers }}</h3>
          <p class="stat-label">Total Teachers</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-user-tie"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalAdvisers }}</h3>
          <p class="stat-label">SSP Advisers</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ activeSections }}</h3>
          <p class="stat-label">Active Sections</p>
        </div>
      </div>
    </div>

    <!-- Performance Stats -->
    <div class="performance-grid mb-4">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value" v-if="hasAttendanceData">{{ averageAttendance }}%</h3>
          <p class="stat-label">Average Attendance</p>
          <p v-if="!hasAttendanceData" class="no-data">No data available</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-content">
          <h3 class="stat-value" v-if="hasScoreData">{{ averageScore }}%</h3>
          <p class="stat-label">Average Score</p>
          <p v-if="!hasScoreData" class="no-data">No data available</p>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid mb-4">
      <div class="chart-card">
        <h5 class="chart-title">Performance Distribution</h5>
        <div class="chart-container">
          <canvas ref="performanceChart"></canvas>
          <p v-if="!hasPerformanceData" class="no-data-message">No data available</p>
        </div>
      </div>
      
      <div class="chart-card">
        <h5 class="chart-title">Assessment Types</h5>
        <div class="chart-container">
          <canvas ref="assessmentTypeChart"></canvas>
          <p v-if="!data?.assessmentTypeDistribution" class="no-data-message">No data available</p>
        </div>
      </div>
    </div>

    <!-- Attendance Trends -->
    <div class="chart-card mb-4">
      <h5 class="chart-title">Attendance Trends</h5>
      <div class="chart-container">
        <canvas ref="attendanceChart"></canvas>
        <p v-if="!hasAttendanceData" class="no-data-message">No data available</p>
      </div>
    </div>

    <!-- Section Performance -->
    <div class="chart-card">
      <h5 class="chart-title">Section Performance</h5>
      <div class="chart-container">
        <canvas ref="sectionChart"></canvas>
        <p v-if="!hasSectionData" class="no-data-message">No data available</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import Chart from 'chart.js/auto'
import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

export default {
  name: 'Dashboard',
  setup() {
    const store = useStore()
    const performanceChart = ref(null)
    const attendanceChart = ref(null)
    const sectionChart = ref(null)
    const assessmentTypeChart = ref(null)
    const selectedYear = ref('')

    // Computed properties
    const isCITHead = computed(() => store.getters.isCITHead)
    const token = computed(() => store.state.auth.token)

    // Set auth token for all requests
    watch(token, (newToken) => {
      if (newToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }
    }, { immediate: true });

    // Dashboard stats
    const totalStudents = ref(0)
    const totalTeachers = ref(0)
    const totalAdvisers = ref(0)
    const averageAttendance = ref(0)
    const averageScore = ref(0)
    const activeSections = ref(0)

    // Add computed properties for data availability
    const hasAttendanceData = computed(() => {
      return data.value?.attendanceTrends?.length > 0;
    });

    const hasScoreData = computed(() => {
      return data.value?.averageScore > 0;
    });

    const hasPerformanceData = computed(() => {
      return data.value?.performanceDistribution && 
             Array.isArray(data.value.performanceDistribution) && 
             data.value.performanceDistribution.some(value => value >= 0);
    });

    const hasSectionData = computed(() => {
      return data.value?.sections?.length > 0;
    });

    const data = ref(null);

    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats', {
          params: {
            year: selectedYear.value
          }
        });

        data.value = response.data;
        
        // Debug logging
        console.log('Raw Dashboard Data:', {
          performanceDistribution: {
            data: data.value.performanceDistribution,
            isArray: Array.isArray(data.value.performanceDistribution),
            length: data.value.performanceDistribution?.length
          },
          assessmentTypeDistribution: {
            data: data.value.assessmentTypeDistribution,
            hasDatasets: Boolean(data.value.assessmentTypeDistribution?.datasets),
            datasetsLength: data.value.assessmentTypeDistribution?.datasets?.length,
            labels: data.value.assessmentTypeDistribution?.labels
          }
        });

        totalStudents.value = data.value.totalStudents || 0;
        totalTeachers.value = data.value.totalTeachers || 0;
        totalAdvisers.value = data.value.totalAdvisers || 0;
        averageAttendance.value = data.value.averageAttendance || 0;
        averageScore.value = data.value.averageScore || 0;
        activeSections.value = data.value.activeSections || 0;

        // Update charts with new data
        if (data.value) {
          updateCharts(data.value);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
      }
    };

    const updateCharts = (data) => {
      // Destroy existing charts if they exist
      if (performanceChart.value) {
        const existingChart = Chart.getChart(performanceChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      if (attendanceChart.value) {
        const existingChart = Chart.getChart(attendanceChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      if (sectionChart.value) {
        const existingChart = Chart.getChart(sectionChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      if (assessmentTypeChart.value) {
        const existingChart = Chart.getChart(assessmentTypeChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }

      // Create performance distribution chart (Grade Distribution)
      if (data.performanceDistribution && Array.isArray(data.performanceDistribution)) {
        console.log('Creating performance chart with data:', data.performanceDistribution);
        
        // Ensure we have valid numbers
        const validData = data.performanceDistribution.map(value => Number(value) || 0);
        
        new Chart(performanceChart.value, {
          type: 'pie',
          data: {
            labels: ['90-100', '80-89', '70-79', '60-69', 'Below 60'],
            datasets: [{
              data: validData,
              backgroundColor: [
                '#4CAF50', // Green for highest range
                '#2196F3', // Blue
                '#FFC107', // Yellow
                '#FF9800', // Orange
                '#F44336'  // Red for lowest range
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'right',
                labels: {
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${context.label}: ${value} students (${percentage}%)`;
                  }
                }
              },
              title: {
                display: true,
                text: 'Student Grade Distribution',
                font: {
                  size: 16
                }
              }
            }
          }
        });
      }

      // Create assessment type distribution chart
      if (data.assessmentTypeDistribution) {
        console.log('Creating assessment type chart with data:', data.assessmentTypeDistribution);
        
        const colors = {
          'Quiz': 'rgba(76, 175, 80, 0.7)',
          'Activity': 'rgba(33, 150, 243, 0.7)',
          'Performance Task': 'rgba(255, 193, 7, 0.7)'
        };
        
        const borderColors = {
          'Quiz': '#4CAF50',
          'Activity': '#2196F3',
          'Performance Task': '#FFC107'
        };
        
        // Transform the data structure
        const datasets = data.assessmentTypeDistribution.datasets.map(dataset => ({
          label: dataset.type,
          data: dataset.data.map(value => Number(value) || 0),
          backgroundColor: colors[dataset.type],
          borderColor: borderColors[dataset.type],
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: borderColors[dataset.type],
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }));

        new Chart(assessmentTypeChart.value, {
          type: 'line',
          data: {
            labels: data.assessmentTypeDistribution.labels || [],
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10
              }
            },
            interaction: {
              mode: 'index',
              intersect: false
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Month/Year'
                },
                grid: {
                  display: false
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Assessments'
                },
                ticks: {
                  stepSize: 1,
                  precision: 0
                },
                grid: {
                  color: 'rgba(0,0,0,0.05)'
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  usePointStyle: true,
                  padding: 20,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                backgroundColor: 'rgba(255,255,255,0.9)',
                titleColor: '#000',
                bodyColor: '#000',
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                  label: function(context) {
                    return `${context.dataset.label}: ${context.parsed.y} assessments`;
                  }
                }
              }
            }
          }
        });
      }

      // Only create attendance chart if there's data
      if (data.attendanceTrends && data.attendanceTrends.length > 0) {
        new Chart(attendanceChart.value, {
          type: 'line',
          data: {
            labels: data.attendanceTrends.map(d => {
              const date = new Date(d.date);
              return `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            }),
            datasets: [{
              label: 'Attendance Rate',
              data: data.attendanceTrends.map(d => d.rate),
              borderColor: '#2196F3',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10
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
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Attendance: ${context.parsed.y.toFixed(1)}%`;
                  }
                }
              },
              title: {
                display: true,
                text: 'Monthly Attendance Trends',
                font: {
                  size: 16
                }
              }
            }
          }
        });
      }

      // Create section chart with year information
      if (data.sections && data.sections.length > 0) {
        new Chart(sectionChart.value, {
          type: 'bar',
          data: {
            labels: data.sections.map(s => `${s.year} - ${s.name}`),
            datasets: [{
              label: 'Average Performance',
              data: data.sections.map(s => s.performance),
              backgroundColor: data.sections.map(s => {
                // Different colors for different year levels
                switch(s.year) {
                  case '1st': return '#4CAF50';
                  case '2nd': return '#2196F3';
                  case '3rd': return '#FFC107';
                  case '4th': return '#FF5722';
                  default: return '#9E9E9E';
                }
              }),
              borderColor: '#fff',
              borderWidth: 2
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                titleFont: { size: 14 },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 5,
                callbacks: {
                  label: function(context) {
                    const section = data.sections[context.dataIndex];
                    return [
                      `Performance: ${context.parsed.x.toFixed(1)}%`,
                      `Students: ${section.studentCount}`
                    ];
                  }
                }
              },
              title: {
                display: true,
                text: 'Section Performance by Year Level',
                font: {
                  size: 16
                }
              }
            },
            scales: {
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: '#666',
                  callback: function(value) {
                    return value + '%';
                  }
                },
                title: {
                  display: true,
                  text: 'Performance (%)'
                }
              },
              y: {
                grid: {
                  display: false
                },
                ticks: {
                  color: '#666'
                }
              }
            }
          }
        });
      }
    }

    const dashboardContainer = ref(null)
    const isLoading = ref(false)
    const lastUpdate = ref(null)
    const autoRefreshInterval = ref(null)

    // Scroll handling
    const scrollToSection = (sectionId) => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    // Handle year change
    const handleYearChange = async () => {
      isLoading.value = true
      try {
        await fetchDashboardData()
        // Save selected year to localStorage
        if (selectedYear.value) {
          localStorage.setItem('selectedYear', selectedYear.value)
        } else {
          localStorage.removeItem('selectedYear')
        }
      } catch (error) {
        console.error('Error updating dashboard:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Refresh dashboard
    const refreshDashboard = async () => {
      isLoading.value = true
      try {
        await fetchDashboardData()
        lastUpdate.value = new Date()
      } catch (error) {
        console.error('Error refreshing dashboard:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Auto refresh setup
    const setupAutoRefresh = () => {
      // Clear any existing interval
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value)
      }
      
      // Set up new auto-refresh interval (every 5 minutes)
      autoRefreshInterval.value = setInterval(refreshDashboard, 5 * 60 * 1000)
    }

    // Initialize dashboard with saved filters
    onMounted(() => {
      // Restore saved year filter
      const savedYear = localStorage.getItem('selectedYear')
      if (savedYear) {
        selectedYear.value = savedYear
      }

      fetchDashboardData()
      setupAutoRefresh()
      lastUpdate.value = new Date()
    })

    // Clean up on component unmount
    onUnmounted(() => {
      if (autoRefreshInterval.value) {
        clearInterval(autoRefreshInterval.value)
      }
    })

    return {
      performanceChart,
      attendanceChart,
      sectionChart,
      assessmentTypeChart,
      selectedYear,
      isCITHead,
      totalStudents,
      totalTeachers,
      totalAdvisers,
      averageAttendance,
      averageScore,
      activeSections,
      hasAttendanceData,
      hasScoreData,
      hasPerformanceData,
      hasSectionData,
      dashboardContainer,
      isLoading,
      lastUpdate,
      scrollToSection,
      handleYearChange,
      refreshDashboard
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

.filter-section {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.form-select {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  font-size: 0.95rem;
  color: #2d3748;
  background-color: white;
  transition: all 0.2s ease;
  min-width: 200px;
}

.form-select:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
}

.btn-refresh {
  background: white;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  padding: 0.5rem;
  border-radius: 8px;
  width: 40px;
  height: 40px;
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

/* Analytics Grid */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

/* Stat Cards */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #003366;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  line-height: 1.2;
}

.stat-label {
  color: #718096;
  font-size: 0.95rem;
  margin: 0;
  margin-top: 0.25rem;
}

/* Chart Cards */
.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-title {
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.chart-container {
  position: relative;
  min-height: 300px;
}

.no-data-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #a0aec0;
  font-size: 0.95rem;
  text-align: center;
}

.no-data {
  color: #a0aec0;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .analytics-grid,
  .performance-grid,
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style> 