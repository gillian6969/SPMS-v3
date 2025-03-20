<template>
  <div class="modal fade" id="exportGraphsModal" tabindex="-1" aria-labelledby="exportGraphsModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="exportGraphsModalLabel">
            <i class="fas fa-file-export me-2"></i>
            Export Dashboard Graphs
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row mb-4">
            <div class="col-md-12">
              <div class="card bg-light">
                <div class="card-body">
                  <h6 class="mb-3">Export Options</h6>
                  
                  <!-- Date Range Selection -->
                  <div class="mb-3">
                    <label class="form-label">Date Range</label>
                    <div class="row g-2">
                      <div class="col">
                        <label class="form-label small text-muted">Start Date</label>
                        <input 
                          type="date" 
                          class="form-control form-control-sm" 
                          v-model="startDate"
                          :max="today"
                        >
                      </div>
                      <div class="col">
                        <label class="form-label small text-muted">End Date</label>
                        <input 
                          type="date" 
                          class="form-control form-control-sm" 
                          v-model="endDate"
                          :min="startDate"
                          :max="today"
                        >
                      </div>
                    </div>
                    <div class="small text-muted mt-1">
                      <i class="fas fa-info-circle me-1"></i>
                      Leave empty to use current dashboard date filters
                    </div>
                  </div>
                  
                  <!-- Document Options -->
                  <div class="mb-3">
                    <label class="form-label">Document Title</label>
                    <input type="text" class="form-control" v-model="documentTitle" placeholder="Dashboard Report">
                  </div>
                  
                  <!-- Orientation Selection -->
                  <div class="mb-3">
                    <label class="form-label">Page Orientation</label>
                    <div class="d-flex gap-3">
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="orientation" id="orientationPortrait" value="portrait" v-model="orientation">
                        <label class="form-check-label" for="orientationPortrait">
                          Portrait
                        </label>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="orientation" id="orientationLandscape" value="landscape" v-model="orientation">
                        <label class="form-check-label" for="orientationLandscape">
                          Landscape
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <h6 class="mb-3">Select Graphs to Export</h6>
          
          <div class="row g-3">
            <div v-for="(graph, index) in availableGraphs" :key="index" class="col-md-6">
              <div class="card graph-selection" :class="{ 'selected': selectedGraphs.includes(graph.id) }">
                <div class="card-body">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" :id="'graph-' + graph.id" :value="graph.id" v-model="selectedGraphs">
                    <label class="form-check-label" :for="'graph-' + graph.id">
                      {{ graph.title }}
                    </label>
                  </div>
                  <p class="text-muted small mb-0">{{ graph.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <div class="alert alert-info d-flex align-items-center" role="alert">
              <i class="fas fa-info-circle me-2"></i>
              <div>
                The exported PDF will include your currently applied dashboard filters.
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="exportToPDF" 
            :disabled="isExporting || selectedGraphs.length === 0"
          >
            <span v-if="isExporting">
              <i class="fas fa-spinner fa-spin me-2"></i>
              Generating PDF...
            </span>
            <span v-else>
              <i class="fas fa-file-pdf me-2"></i>
              Export to PDF
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useStore } from 'vuex'
import moment from 'moment'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default {
  name: 'ExportGraphsModal',
  props: {
    dashboardType: {
      type: String,
      required: true,
      validator: (value) => {
        return ['cithead', 'teacher', 'ssp', 'ssphead'].includes(value)
      }
    },
    chartRefs: {
      type: Object,
      required: true
    },
    filterInfo: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const store = useStore()
    const selectedGraphs = ref([])
    const documentTitle = ref('Dashboard Report')
    const startDate = ref('')
    const endDate = ref('')
    const orientation = ref('landscape')
    const isExporting = ref(false)
    
    const today = computed(() => moment().format('YYYY-MM-DD'))
    
    // Define available graphs based on dashboard type
    const availableGraphs = computed(() => {
      const graphOptions = {
        cithead: [
          { id: 'performanceChart', title: 'Attendance Distribution', description: 'Status distribution of student attendance' },
          { id: 'assessmentTypeChart', title: 'Assessment Type Performance', description: 'Average scores by assessment type' },
          { id: 'performanceTrendChart', title: 'Performance Trends', description: 'Student performance across time periods' },
          { id: 'sectionChart', title: 'Section Performance', description: 'Comparative performance across different sections' }
        ],
        teacher: [
          { id: 'performanceChart', title: 'Attendance Distribution', description: 'Status distribution of student attendance' },
          { id: 'assessmentTypeChart', title: 'Assessment Performance Analysis', description: 'Average scores by assessment type' },
          { id: 'performanceTrendChart', title: 'Performance Trends', description: 'Class average scores across recent assessments' },
          { id: 'assessmentTypePerformanceChart', title: 'Performance by Assessment Type', description: 'Student performance across different assessment types' }
        ],
        ssp: [
          { id: 'surveyAverageChart', title: 'Survey Average Scores', description: 'Average scores across survey questions' },
          { id: 'surveyDistributionChart', title: 'Survey Response Distribution', description: 'Distribution of student issues by priority level' }
        ],
        ssphead: [
          { id: 'performanceChart', title: 'Performance Distribution', description: 'Distribution of student performance' },
          { id: 'assessmentTypeChart', title: 'Assessment Type Distribution', description: 'Distribution of assessment types' },
          { id: 'performanceTrendChart', title: 'Performance Trends', description: 'Performance trends over time' },
          { id: 'assessmentTypePerformanceChart', title: 'Performance by Assessment Type', description: 'Performance across different assessment types' }
        ]
      }
      
      return graphOptions[props.dashboardType] || []
    })
    
    // Reset selected graphs when dashboard type changes
    watch(() => props.dashboardType, () => {
      selectedGraphs.value = []
    })
    
    // Helper function to create a header with filter information
    const createHeaderContent = (doc, y) => {
      const username = store.state.auth.user?.name || 
                     `${store.state.auth.user?.firstName || ''} ${store.state.auth.user?.lastName || ''}`.trim() || 
                     'User'
      
      // Dashboard type mapping
      const dashboardTypes = {
        cithead: 'CIT Head Dashboard',
        teacher: 'Teacher Dashboard',
        ssp: 'SSP Adviser Dashboard',
        ssphead: 'SSP Head Dashboard'
      }
      
      const dashboardName = dashboardTypes[props.dashboardType] || 'Dashboard'
      
      // Set document title
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(documentTitle.value, 14, y)
      y += 8
      
      // Add metadata
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`${dashboardName} - Generated by: ${username}`, 14, y)
      y += 5
      doc.text(`Date: ${moment().format('MMMM D, YYYY h:mm A')}`, 14, y)
      y += 8
      
      // Add filter information
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Applied Filters:', 14, y)
      y += 5
      
      doc.setFont('helvetica', 'normal')
      
      // Extract filter information
      const filters = []
      if (props.filterInfo.year) filters.push(`Year: ${props.filterInfo.year}`)
      if (props.filterInfo.section) filters.push(`Section: ${props.filterInfo.section}`)
      if (props.filterInfo.subject) filters.push(`Subject: ${props.filterInfo.subject}`)
      
      // Date range
      const dateRange = []
      if (startDate.value) dateRange.push(`From: ${moment(startDate.value).format('MMM D, YYYY')}`)
      if (endDate.value) dateRange.push(`To: ${moment(endDate.value).format('MMM D, YYYY')}`)
      
      if (dateRange.length > 0) {
        filters.push(`Date Range: ${dateRange.join(' - ')}`)
      }
      
      if (filters.length === 0) {
        doc.text('No filters applied', 14, y)
      } else {
        filters.forEach(filter => {
          doc.text(`• ${filter}`, 14, y)
          y += 5
        })
      }
      
      y += 5
      
      return y
    }
    
    // Export selected graphs to PDF
    const exportToPDF = async () => {
      if (selectedGraphs.value.length === 0) return
      
      isExporting.value = true
      
      try {
        // Create PDF document
        const doc = new jsPDF({
          orientation: orientation.value,
          unit: 'mm',
          format: 'a4'
        })
        
        let y = 15
        
        // Add header and filter information
        y = createHeaderContent(doc, y)
        
        // Set margin for charts
        const margin = 14
        const pageWidth = orientation.value === 'landscape' ? 297 : 210
        const pageHeight = orientation.value === 'landscape' ? 210 : 297
        const contentWidth = pageWidth - (margin * 2)
        
        // Process each selected chart
        for (let i = 0; i < selectedGraphs.value.length; i++) {
          const graphId = selectedGraphs.value[i]
          const canvas = props.chartRefs[graphId]
          
          if (!canvas) {
            console.error(`Chart canvas not found: ${graphId}`)
            continue
          }
          
          // Check if we need to add a new page
          if (i > 0 && y > pageHeight - 80) {
            doc.addPage()
            y = 15
          }
          
          // Get graph title
          const graphInfo = availableGraphs.value.find(g => g.id === graphId)
          const title = graphInfo ? graphInfo.title : 'Chart'
          
          // Add chart title
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(title, margin, y)
          y += 8
          
          try {
            // Convert chart canvas to image
            const imageData = canvas.toDataURL('image/png', 1.0)
            
            // Calculate aspect ratio to maintain proportions
            const canvasWidth = canvas.width
            const canvasHeight = canvas.height
            const ratio = canvasHeight / canvasWidth
            
            // Set image width and height maintaining aspect ratio
            const imgWidth = contentWidth
            const imgHeight = imgWidth * ratio
            
            // Add image to PDF
            doc.addImage(imageData, 'PNG', margin, y, imgWidth, imgHeight)
            
            // Update y position for next chart
            y += imgHeight + 15
          } catch (error) {
            console.error(`Error capturing chart ${graphId}:`, error)
          }
        }
        
        // Save PDF
        const fileName = `${documentTitle.value.replace(/\s+/g, '_')}_${moment().format('YYYY-MM-DD')}.pdf`
        doc.save(fileName)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('An error occurred while generating the PDF. Please try again.')
      } finally {
        isExporting.value = false
      }
    }

    return {
      selectedGraphs,
      availableGraphs,
      documentTitle,
      startDate,
      endDate,
      orientation,
      isExporting,
      today,
      exportToPDF
    }
  }
}
</script>

<style scoped>
.graph-selection {
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #e2e8f0;
}

.graph-selection:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
}

.graph-selection.selected {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
}

.form-check-input:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}
</style> 