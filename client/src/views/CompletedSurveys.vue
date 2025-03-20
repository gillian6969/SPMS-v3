<template>
  <div class="completed-surveys">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="page-title">
          <i class="fas fa-clipboard-check me-2"></i>
          Completed Surveys
        </h2>

        <div class="filters d-flex align-items-center gap-3">
          <div class="search-box">
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Search student, year, or section..." 
                v-model="searchQuery"
              >
              <span class="input-group-text">
                <i class="fas fa-search"></i>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="text-center my-5" v-if="loading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading completed surveys...</p>
      </div>

      <!-- No Results -->
      <div class="card no-results" v-else-if="!loading && filteredSurveys.length === 0">
        <div class="card-body text-center py-5">
          <i class="fas fa-clipboard fa-3x mb-3 text-muted"></i>
          <h5>No Completed Surveys Found</h5>
          <p class="text-muted">
            {{ searchQuery ? "No students match your search query." : "No students have completed surveys yet." }}
          </p>
        </div>
      </div>

      <!-- Results Table -->
      <div class="card" v-else>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover survey-table mb-0">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Year & Section</th>
                  <th>Submission Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="survey in filteredSurveys" :key="survey._id">
                  <td>{{ survey.studentDisplayId }}</td>
                  <td>{{ survey.studentName }}</td>
                  <td>{{ survey.year }} - {{ survey.section }}</td>
                  <td>{{ formatDate(survey.updatedAt) }}</td>
                  <td>
                    <div class="btn-group">
                      <button 
                        class="btn btn-sm btn-outline-primary" 
                        @click="viewSurveyResults(survey)"
                        title="View Survey Responses"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Survey Details Modal -->
    <div v-if="selectedSurvey" class="modal-wrapper" @click.self="closeModal">
      <div class="modal-backdrop" @click="closeModal"></div>
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-clipboard-check me-2"></i>
              Survey Results: {{ selectedSurvey.studentName }}
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="loadingSurveyDetails" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading survey details...</span>
              </div>
              <p class="mt-2">Loading survey details...</p>
            </div>
            <div v-else>
              <!-- Student Badge Card -->
              <div class="student-badge-card mb-4">
                <div class="d-flex align-items-center justify-content-between">
                  <div class="student-info-compact d-flex align-items-center">
                    <div class="student-avatar">
                      <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="ms-3">
                      <h5 class="student-name mb-0">{{ selectedSurvey.studentName }}</h5>
                      <div class="student-meta">
                        <span class="student-id">{{ selectedSurvey.studentDisplayId }}</span>
                        <span class="mx-2">•</span>
                        <span class="submission-date">Submitted: {{ formatDate(selectedSurvey.updatedAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="student-badges">
                    <span class="badge bg-primary me-1">{{ selectedSurvey.year }}</span>
                    <span class="badge bg-secondary">{{ selectedSurvey.section }}</span>
                  </div>
                </div>
              </div>

              <!-- Tabs Navigation -->
              <ul class="nav nav-tabs mb-4" id="surveyTabs" role="tablist">
                <li class="nav-item" role="presentation">
                  <button class="nav-link active" id="summary-tab" data-bs-toggle="tab" data-bs-target="#summary" 
                    type="button" role="tab" aria-controls="summary" aria-selected="true">
                    <i class="fas fa-chart-pie me-2"></i>Summary
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="details-tab" data-bs-toggle="tab" data-bs-target="#details" 
                    type="button" role="tab" aria-controls="details" aria-selected="false">
                    <i class="fas fa-list-ul me-2"></i>Detailed Information
                  </button>
                </li>
                <li class="nav-item" role="presentation">
                  <button class="nav-link" id="statistics-tab" data-bs-toggle="tab" data-bs-target="#statistics" 
                    type="button" role="tab" aria-controls="statistics" aria-selected="false">
                    <i class="fas fa-table me-2"></i>Statistics
                  </button>
                </li>
              </ul>

              <!-- Tabs Content -->
              <div class="tab-content" id="surveyTabsContent">
                <!-- Summary Tab -->
                <div class="tab-pane fade show active" id="summary" role="tabpanel" aria-labelledby="summary-tab">
                  <div class="survey-chart">
                    <div class="chart-container">
                      <StudentSurveyStat :_id="selectedSurvey.studentId" />
                    </div>
                    <div class="text-muted survey-note mt-3">
                      <i class="fas fa-info-circle me-1"></i>
                      <small>This chart shows the distribution of problem areas identified in the student's survey responses.</small>
                    </div>
                  </div>
                </div>

                <!-- Details Tab -->
                <div class="tab-pane fade" id="details" role="tabpanel" aria-labelledby="details-tab">
                  <div class="student-details">
                    <div class="row">
                      <div class="col-md-6">
                        <div class="detail-card">
                          <h6 class="detail-title">Personal Information</h6>
                          <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-id-card me-2"></i>Student ID:</span>
                            <span class="detail-value">{{ selectedSurvey.studentDisplayId }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-user me-2"></i>Full Name:</span>
                            <span class="detail-value">{{ selectedSurvey.studentName }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-envelope me-2"></i>Email:</span>
                            <span class="detail-value">{{ selectedSurvey.email || 'Not provided' }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="detail-card">
                          <h6 class="detail-title">Academic Information</h6>
                          <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-graduation-cap me-2"></i>Year Level:</span>
                            <span class="detail-value">{{ selectedSurvey.year }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-users me-2"></i>Section:</span>
                            <span class="detail-value">{{ selectedSurvey.section }}</span>
                          </div>
                          <div class="detail-item">
                            <span class="detail-label"><i class="fas fa-calendar-alt me-2"></i>Submission:</span>
                            <span class="detail-value">{{ formatDate(selectedSurvey.updatedAt) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Statistics Tab -->
                <div class="tab-pane fade" id="statistics" role="tabpanel" aria-labelledby="statistics-tab">
                  <div v-if="selectedSurvey.surveyStats && selectedSurvey.surveyStats.length > 0" class="survey-stats">
                    <div class="table-responsive">
                      <table class="table table-hover stats-table">
                        <thead class="table-light">
                          <tr>
                            <th>Problem Type</th>
                            <th>Average Score</th>
                            <th>Severity</th>
                            <th>Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(stat, index) in selectedSurvey.surveyStats" :key="index">
                            <td>
                              <span class="problem-type">{{ stat.type }}</span>
                            </td>
                            <td>
                              <div class="d-flex align-items-center">
                                <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                  <div 
                                    class="progress-bar" 
                                    :class="getSeverityClass(stat.average)"
                                    :style="`width: ${Math.min(stat.average * 10, 100)}%`"
                                  ></div>
                                </div>
                                <span>{{ stat.average.toFixed(2) }}</span>
                              </div>
                            </td>
                            <td>
                              <span 
                                class="badge" 
                                :class="getSeverityBadgeClass(stat.average)"
                              >
                                {{ getSeverityLabel(stat.average) }}
                              </span>
                            </td>
                            <td>
                              <span class="recommendation">{{ getRecommendation(stat.average) }}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div class="text-muted survey-note mt-3">
                      <i class="fas fa-info-circle me-1"></i>
                      <small>Higher scores indicate more significant student concerns in that problem area.</small>
                    </div>
                  </div>
                  <div v-else class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No detailed statistics available for this survey.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import moment from 'moment'
import StudentSurveyStat from '../components/StudentSurveyStat.vue'

const store = useStore()
const surveys = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedSurvey = ref(null)
const loadingSurveyDetails = ref(false)

// Filter surveys based on search query
const filteredSurveys = computed(() => {
  if (!searchQuery.value) return surveys.value;
  
  const query = searchQuery.value.toLowerCase();
  return surveys.value.filter(survey => 
    survey.studentDisplayId?.toLowerCase().includes(query) || 
    survey.studentName?.toLowerCase().includes(query) ||
    survey.year?.toLowerCase().includes(query) ||
    survey.section?.toLowerCase().includes(query)
  );
})

// Format date
const formatDate = (dateString) => {
  return moment(dateString).format('MMM D, YYYY h:mm A')
}

// Get severity class for progress bar
const getSeverityClass = (score) => {
  if (score >= 7) return 'bg-danger';
  if (score >= 5) return 'bg-warning';
  if (score >= 3) return 'bg-info';
  return 'bg-success';
}

// Get severity badge class
const getSeverityBadgeClass = (score) => {
  if (score >= 7) return 'bg-danger';
  if (score >= 5) return 'bg-warning';
  if (score >= 3) return 'bg-info';
  return 'bg-success';
}

// Get severity label
const getSeverityLabel = (score) => {
  if (score >= 7) return 'High';
  if (score >= 5) return 'Medium';
  if (score >= 3) return 'Low';
  return 'Minimal';
}

// Get recommendation
const getRecommendation = (score) => {
  if (score >= 7) return 'Immediate attention required';
  if (score >= 5) return 'Consider additional support';
  if (score >= 3) return 'Monitor closely';
  return 'No concerns';
}

// Fetch all submitted surveys
const fetchCompletedSurveys = async () => {
  try {
    loading.value = true
    const token = store.state.auth.token
    
    // Get all completed surveys
    const response = await axios.get('http://localhost:8000/api/survey/submitted', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.data) {
      surveys.value = response.data
    }
  } catch (error) {
    console.error('Error fetching completed surveys:', error)
    surveys.value = []
  } finally {
    loading.value = false
  }
}

// View survey results
const viewSurveyResults = async (survey) => {
  try {
    loadingSurveyDetails.value = true;
    selectedSurvey.value = {
      ...survey
    };
  } catch (error) {
    console.error('Error fetching survey details:', error);
  } finally {
    loadingSurveyDetails.value = false;
  }
};

// Close modal
const closeModal = () => {
  selectedSurvey.value = null
}

onMounted(() => {
  fetchCompletedSurveys()
})
</script>

<style scoped>
.completed-surveys {
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #003366;
  margin-bottom: 1rem;
}

.search-box .input-group {
  width: 300px;
}

.search-box .form-control {
  border-right: none;
}

.search-box .input-group-text {
  background-color: white;
  border-left: none;
}

.survey-table th {
  font-weight: 600;
  color: #4a5568;
  padding: 1rem;
  white-space: nowrap;
}

.survey-table td {
  padding: 1rem;
  vertical-align: middle;
}

.no-results {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.btn-outline-primary {
  color: #003366;
  border-color: #003366;
}

.btn-outline-primary:hover {
  background-color: #003366;
  color: white;
}

/* Modal Styles */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: -1;
}

.modal-dialog {
  max-width: 800px;
  width: 100%;
  margin: 1.75rem auto;
}

.modal-content {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  background-color: #ffffff;
}

.modal-header {
  border-bottom: none;
}

.modal-body {
  background-color: #ffffff;
  padding: 1.5rem;
}

.modal-title {
  font-weight: 600;
}

.info-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #2d3748;
}

.info-card {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.student-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.student-id {
  color: #64748b;
  font-size: 0.9rem;
}

.student-badges {
  display: flex;
  flex-wrap: wrap;
}

.info-item {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: baseline;
}

.info-label {
  font-weight: 500;
  color: #4b5563;
  margin-right: 0.5rem;
  min-width: 100px;
}

.info-value {
  color: #1e293b;
}

.chart-container {
  min-height: 300px;
  position: relative;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stats-table {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.problem-type {
  font-weight: 500;
}

.progress {
  background-color: #e2e8f0;
  border-radius: 10px;
}

.survey-note {
  font-style: italic;
  padding: 0.5rem 0.75rem;
  background-color: #f8fafc;
  border-radius: 8px;
}

.student-badge-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.student-info-compact {
  align-items: center;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.student-meta {
  display: flex;
  flex-wrap: wrap;
}

.submission-date {
  color: #64748b;
  font-size: 0.9rem;
}

.student-details {
  margin-top: 1rem;
}

.detail-card {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.detail-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #2d3748;
}

.detail-item {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: baseline;
}

.detail-label {
  font-weight: 500;
  color: #4b5563;
  margin-right: 0.5rem;
  min-width: 100px;
}

.detail-value {
  color: #1e293b;
}

.tab-content {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 0 0 8px 8px;
}

.tab-pane {
  background-color: #ffffff;
}
</style> 