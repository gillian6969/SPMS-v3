<template>
  <teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-wrapper" @click.stop>
        <div class="modal-dialog modal-xxl">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title">
                <i class="fas fa-user-graduate me-2"></i>
                {{ title }}
              </h5>
              <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
            </div>
            <div class="modal-body">
              <div class="student-details">
                <!-- Student Information (Left Side) -->
                <div class="student-info">
                  <h6 class="info-title">Student Information</h6>
                  <div class="info-content">
                    <p><strong>Student ID:</strong> {{ student?.studentNumber }}</p>
                    <p><strong>Name:</strong> {{ student?.firstName }} {{ student?.lastName }}</p>
                    <p><strong>Year Level:</strong> {{ yearLevel }}</p>
                    <p><strong>Section:</strong> {{ section }}</p>
                    <p><strong>Subject:</strong> {{ subject }}</p>
                    <slot name="additional-info"></slot>
                  </div>
                </div>

                <!-- Performance and Data (Right Side) -->
                <div class="student-charts">
                  <!-- Multiple Chart Sections for Class Records -->
                  <div v-if="isClassRecord" class="charts-container">
                    <!-- Assessment Type Selection and Date Filter -->
                    <div class="chart-controls mb-3">
                      <div class="assessment-type-selector">
                        <button 
                          v-for="type in ['All', 'Quiz', 'Activity', 'Performance Task']" 
                          :key="type"
                          class="btn btn-sm" 
                          :class="selectedAssessmentType === type ? 'btn-primary' : 'btn-outline-secondary'"
                          @click="changeAssessmentType(type)"
                        >
                          {{ type }}
                        </button>
                      </div>
                      <div class="date-filter">
                        <div class="input-group input-group-sm">
                          <span class="input-group-text">From</span>
                          <input 
                            type="date" 
                            class="form-control" 
                            v-model="dateFilter.start"
                            @change="$emit('date-filter-change', dateFilter)"
                          >
                          <span class="input-group-text">To</span>
                          <input 
                            type="date" 
                            class="form-control" 
                            v-model="dateFilter.end"
                            @change="$emit('date-filter-change', dateFilter)"
                          >
                        </div>
                      </div>
                    </div>
                    
                    <!-- Single Chart when "All" is selected -->
                    <div v-if="selectedAssessmentType === 'All'" class="chart-section">
                      <h6>All Assessments</h6>
                      <div class="chart-container" style="height: 300px;">
                        <canvas :id="`all-${chartId}`"></canvas>
                      </div>
                    </div>
                    
                    <!-- Individual Charts when specific types are selected -->
                    <div v-else-if="selectedAssessmentType === 'Quiz'" class="chart-section">
                      <h6>Quiz Performance</h6>
                      <div class="chart-container" style="height: 300px;">
                        <canvas :id="`quiz-${chartId}`"></canvas>
                      </div>
                    </div>
                    
                    <div v-else-if="selectedAssessmentType === 'Activity'" class="chart-section">
                      <h6>Activity Performance</h6>
                      <div class="chart-container" style="height: 300px;">
                        <canvas :id="`activity-${chartId}`"></canvas>
                      </div>
                    </div>
                    
                    <div v-else-if="selectedAssessmentType === 'Performance Task'" class="chart-section">
                      <h6>Performance Task</h6>
                      <div class="chart-container" style="height: 300px;">
                        <canvas :id="`performance-${chartId}`"></canvas>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Single Chart Section for Attendance -->
                  <div v-else class="chart-section">
                    <h6>{{ chartTitle }}</h6>
                    <div class="chart-container" style="height: 300px;">
                      <canvas :id="chartId"></canvas>
                    </div>
                  </div>
                  
                  <!-- History Section -->
                  <div class="chart-section">
                    <h6>{{ historyTitle }}</h6>
                    <div class="table-responsive data-table">
                      <slot name="history-table">
                        <!-- Default history table if no slot provided -->
                        <table class="table">
                          <thead>
                            <tr>
                              <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <slot name="table-rows">
                              <tr>
                                <td colspan="100%" class="text-center py-3 text-muted">
                                  <i class="fas fa-info-circle me-2"></i>No records found.
                                </td>
                              </tr>
                            </slot>
                          </tbody>
                        </table>
                      </slot>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                <i class="fas fa-times me-2"></i>Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeModal"></div>
    </div>
  </teleport>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StudentDetailsModal',
  
  props: {
    show: {
      type: Boolean,
      required: true
    },
    student: {
      type: Object,
      required: true
    },
    yearLevel: {
      type: String,
      default: ''
    },
    section: {
      type: String,
      default: ''
    },
    subject: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: 'Student Details'
    },
    chartTitle: {
      type: String,
      default: 'Performance Overview'
    },
    historyTitle: {
      type: String,
      default: 'History'
    },
    tableHeaders: {
      type: Array,
      default: () => ['Date', 'Status']
    },
    chartId: {
      type: String,
      default: 'studentChart'
    },
    isClassRecord: {
      type: Boolean,
      default: false
    }
  },

  emits: ['close', 'update:show', 'date-filter-change', 'assessment-type-change'],

  data() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    return {
      selectedAssessmentType: 'All',
      dateFilter: {
        start: thirtyDaysAgoStr,
        end: today
      }
    }
  },

  methods: {
    closeModal() {
      this.$emit('update:show', false)
      this.$emit('close')
    },
    
    changeAssessmentType(type) {
      this.selectedAssessmentType = type;
      this.$emit('assessment-type-change', type);
    }
  }
})
</script>

<style scoped>
/* Base z-index hierarchy */
:root {
  --z-modal-backdrop: 9999;
  --z-modal-wrapper: 10000;
  --z-modal-content: 10001;
  --z-table-header: 10002;
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
  z-index: 10000;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  cursor: pointer;
}

.modal-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.modal-dialog {
  position: relative;
  width: 90%;
  max-width: 1200px;
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
  overflow: hidden;
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
  overflow-y: auto;
}

/* Student details layout */
.student-details {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
}

.student-info {
  background: #f8fafc;
  padding: 2rem;
  border-radius: 12px;
  height: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-title {
  color: #2d3748;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.info-content p {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 1.2rem;
  line-height: 1.5;
}

.info-content strong {
  color: #4a5568;
  display: inline-block;
  width: 160px;
  font-weight: 600;
}

.student-charts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
  position: relative;
  overflow: hidden;
}

.chart-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
  background: linear-gradient(to right, #4285F4, #34A853, #FBBC05, #EA4335);
}

.chart-section h6 {
  color: #2d3748;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.chart-section h6::before {
  content: '\f080';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  margin-right: 0.75rem;
  color: #4285F4;
}

.chart-container {
  position: relative;
  width: 100%;
  height: 300px !important;
  background: linear-gradient(to bottom, rgba(249, 250, 251, 0.5), rgba(249, 250, 251, 0));
  border-radius: 8px;
  padding: 1rem;
}

.data-table {
  margin-top: 1.5rem;
  border-radius: 8px;
  overflow: hidden;
}

.data-table th {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: var(--z-table-header);
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  font-size: 1.1rem;
  color: #4a5568;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.data-table tr:hover {
  background-color: #f8fafc;
}

.btn-close-white {
  filter: brightness(0) invert(1);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .modal-dialog {
    margin-right: 1rem;
    max-width: 90%;
  }
}

@media (max-width: 992px) {
  .student-details {
    grid-template-columns: 1fr;
  }
  
  .student-info {
    margin-bottom: 1.5rem;
  }
}

.modal-footer {
  border-top: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.assessment-type-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.assessment-type-selector .btn {
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.date-filter {
  min-width: 300px;
}

.date-filter .input-group-text {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: #4a5568;
  font-weight: 500;
}

.date-filter .form-control {
  border-color: #e2e8f0;
  color: #4a5568;
  font-weight: 500;
}
</style> 