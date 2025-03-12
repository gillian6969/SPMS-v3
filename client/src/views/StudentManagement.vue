<template>
  <div class="student-management">
    <div class="sticky-controls">
      <div class="d-flex gap-2 mb-3">
        <button 
          class="btn btn-primary" 
          @click="showAddStudentModal = true"
        >
          <i class="fas fa-plus me-1"></i> Add Student List
        </button>
        <button 
          class="btn btn-success" 
          @click="showAddSingleStudentModal = true"
        >
          <i class="fas fa-user-plus me-1"></i> Add Single Student
        </button>
      </div>
    
        <!-- Table Controls -->
        <div class="table-controls mb-3">
        <div class="d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center gap-3">
            <!-- Sort Dropdown -->
            <div class="dropdown">
              <button 
                class="btn btn-control" 
                type="button" 
                id="sortDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <i class="fas fa-sort me-2"></i> Sort by
              </button>
              <ul class="dropdown-menu shadow-lg" aria-labelledby="sortDropdown">
                <li>
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" @click.prevent="sortBy('studentId')">
                    <i class="fas fa-sort-numeric-down"></i>
                    <span>ID Number</span>
                    <i :class="getSortIcon('studentId')" class="ms-auto"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" @click.prevent="sortBy('lastName')">
                    <i class="fas fa-sort-alpha-down"></i>
                    <span>Name</span>
                    <i :class="getSortIcon('lastName')" class="ms-auto"></i>
                  </a>
                </li>
              </ul>
            </div>

            <!-- Filter Dropdown -->
            <div class="dropdown">
              <button 
                class="btn btn-control" 
                type="button" 
                id="filterDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <i class="fas fa-filter me-2"></i> 
                {{ hasActiveFilters ? `${selectedYear || 'All Years'} - ${selectedSection || 'All Sections'}` : 'Filter Students' }}
                <span v-if="hasActiveFilters" class="filter-badge">!</span>
              </button>
              <div class="dropdown-menu shadow-lg p-3" aria-labelledby="filterDropdown">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="dropdown-header px-0 mb-0">Filter Options</h6>
                    <button 
                    v-if="hasActiveFilters"
                    class="btn btn-sm btn-outline-secondary"
                    @click="clearFilters"
                    >
                    Clear Filters
                    </button>
                  </div>
                
                <!-- Year Filter -->
                <div class="mb-3">
                  <label class="form-label">Year Level</label>
                  <select class="form-select mb-2" v-model="selectedYear" @change="applyFilters">
                    <option value="">All Years</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                
                <!-- Section Filter -->
                <div class="mb-3">
                  <label class="form-label">Section</label>
                  <select class="form-select" v-model="selectedSection" @change="applyFilters">
                    <option value="">All Sections</option>
                    <option value="South 1">South 1</option>
                    <option value="South 2">South 2</option>
                    <option value="South 3">South 3</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Search Control -->
          <div class="search-control">
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
      </div>
        </div>

        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Email</th>
                <th>Year</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
          <template v-if="paginatedStudents.length > 0">
                <tr 
              v-for="student in paginatedStudents" 
                  :key="student.studentId"
                  @click="viewStudent(student)"
                  class="clickable-row"
                >
                  <td>{{ student.studentId }}</td>
                  <td>{{ student.lastName }}</td>
                  <td>{{ student.firstName }}</td>
                  <td>{{ student.email }}</td>
                  <td>{{ student.year }}</td>
                  <td>{{ student.section }}</td>
                </tr>
              </template>
              <tr v-else>
                <td colspan="6" class="text-center py-4">
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

    <!-- Add Student Modal -->
    <div v-if="showAddStudentModal" class="add-student-modal">
      <div class="add-student-backdrop" @click="showAddStudentModal = false"></div>
      <div class="add-student-dialog">
        <div class="add-student-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Add Student List</h5>
            <button type="button" class="btn-close btn-close-white" @click="showAddStudentModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleFileUpload">
              <!-- Year Selection -->
              <div class="mb-3">
                <label class="form-label">Year Level</label>
                <select class="form-select" v-model="uploadYear" required>
                  <option value="">Select Year</option>
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>
                <small class="text-muted d-block mt-1">
                  Note: Sections will be automatically assigned based on the number of students (50 students per section).
                </small>
              </div>

              <!-- File Upload -->
              <div class="mb-3">
                <label class="form-label">CSV File</label>
                <input 
                  type="file" 
                  class="form-control" 
                  accept=".csv"
                  @change="handleFileChange"
                  required
                >
                <small class="text-muted d-block mt-1">
                  <strong>Required fields:</strong> StudentID, LastName, FirstName, MiddleName, ContactNumber, Email
                </small>
                <small class="text-muted d-block mt-1">
                  <strong>Important:</strong> Make sure the CSV file has an "Email" column with valid email addresses.
                </small>
                <small class="text-muted d-block mt-1">
                  File must be in CSV format with headers matching the required fields exactly.
                </small>
              </div>

              <div class="text-end">
                <button type="button" class="btn btn-secondary me-2" @click="showAddStudentModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" :disabled="isUploading || !selectedFile">
                  {{ isUploading ? 'Uploading...' : 'Upload' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Details Modal -->
    <div v-if="selectedStudent" class="modal-wrapper" @click.self="closeStudentModal">
      <div class="modal-backdrop" @click="closeStudentModal"></div>
      <div class="modal-dialog modal-xxl">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-user-graduate me-2"></i>
              Student Details
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeStudentModal"></button>
          </div>
          <div class="modal-body">
            <div class="student-details">
              <!-- Student Information (Left Side) -->
              <div class="student-info">
                <h6 class="info-title">Student Information</h6>
                <div class="info-content">
                  <p><strong>Name:</strong> {{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</p>
                  <p><strong>ID:</strong> {{ selectedStudent.studentId }}</p>
                  <p><strong>Year Level:</strong> {{ selectedStudent.year }}</p>
                  <p><strong>Academic Year:</strong> {{ getAcademicYearRange(selectedStudent.year) }}</p>
                  <p><strong>Section:</strong> {{ selectedStudent.section }}</p>
                  <p><strong>Email:</strong> {{ selectedStudent.email }}</p>
                </div>
              </div>

              <!-- Performance and Attendance (Right Side) -->
              <div class="student-charts">
                <div class="chart-section">
                  <h6>Performance Trends</h6>
                  <canvas ref="performanceChart"></canvas>
                  </div>
                <div class="chart-section">
                  <h6>Attendance History</h6>
                  <div class="table-responsive attendance-table">
                    <table class="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Subject</th>
                          <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                        <tr v-for="record in selectedStudent.attendanceHistory" :key="record.date">
                          <td>{{ formatDate(record.date) }}</td>
                          <td>{{ record.subject }}</td>
                          <td>
                            <span 
                              class="badge"
                              :class="record.status === 'present' ? 'bg-success' : 'bg-danger'"
                            >
                              {{ record.status === 'present' ? 'Present' : 'Absent' }}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Student Modal -->
    <div v-if="isEditing" class="modal-wrapper">
      <div class="modal-backdrop" @click="cancelEditing"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Edit Student</h5>
            <button type="button" class="btn-close" @click="cancelEditing"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveStudentChanges">
              <div class="mb-3">
                <label class="form-label">Student ID</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="editingStudent.studentId"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">First Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="editingStudent.firstName"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Last Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="editingStudent.lastName"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input 
                  type="email" 
                  class="form-control" 
                  v-model="editingStudent.email"
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Year</label>
                <select class="form-select" v-model="editingStudent.year">
                  <option v-for="year in availableYears" :value="year">{{ year }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Section</label>
                <select class="form-select" v-model="editingStudent.section">
                  <option v-for="section in availableSections" :value="section">{{ section }}</option>
                </select>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="cancelEditing">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-wrapper">
      <div class="modal-backdrop" @click="showDeleteModal = false"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirm Delete</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete this student?</p>
            <p class="text-danger">
              <strong>{{ studentToDelete?.firstName }} {{ studentToDelete?.lastName }}</strong>
            </p>
            <p class="text-muted small">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="showDeleteModal = false"
            >
              Cancel
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteStudent(studentToDelete)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Single Student Modal -->
    <div v-if="showAddSingleStudentModal" class="modal-wrapper">
      <div class="modal-backdrop" @click="showAddSingleStudentModal = false"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-success text-white">
            <h5 class="modal-title">
              <i class="fas fa-user-plus me-2"></i>
              Add Single Student
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showAddSingleStudentModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleAddSingleStudent">
              <div class="mb-3">
                <label class="form-label">Student ID <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newStudent.studentId"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">First Name <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newStudent.firstName"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Middle Name <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newStudent.middleName"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Last Name <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newStudent.lastName"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <input 
                  type="email" 
                  class="form-control" 
                  v-model="newStudent.email"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Contact Number <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="newStudent.contactNumber"
                  required
                >
              </div>
              <div class="mb-3">
                <label class="form-label">Year <span class="text-danger">*</span></label>
                <select class="form-select" v-model="newStudent.year" required>
                  <option value="">Select Year</option>
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Section <span class="text-danger">*</span></label>
                <select class="form-select" v-model="newStudent.section" required>
                  <option value="">Select Section</option>
                  <option v-for="section in availableSections" :key="section" :value="section">{{ section }}</option>
                </select>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" @click="showAddSingleStudentModal = false">
                  Cancel
                </button>
                <button type="submit" class="btn btn-success" :disabled="isAddingStudent">
                  {{ isAddingStudent ? 'Adding...' : 'Add Student' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import Chart from 'chart.js/auto'
import { Dropdown } from 'bootstrap'

// Create axios instance with correct base URL
const api = axios.create({
  baseURL: 'http://localhost:8081/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default {
  name: 'StudentManagement',
  setup() {
    const store = useStore()
    const students = ref([])
    const searchQuery = ref('')
    const selectedStudent = ref(null)
    const performanceChart = ref(null)
    const sortField = ref('')
    const sortOrder = ref('asc')
    const showDeleteModal = ref(false)
    const studentToDelete = ref(null)
    const isEditing = ref(false)
    const editingStudent = ref(null)
    const showSearch = ref(false)
const selectedYear = ref('')
const selectedSection = ref('')
const selectedFile = ref(null)
const uploadYear = ref('')
const isUploading = ref(false)
const subjectChart = ref(null)
const attendanceChart = ref(null)
const historyStartDate = ref('')
const historyEndDate = ref('')
const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)
const showAddStudentModal = ref(false)
const showAddSingleStudentModal = ref(false)
const availableYears = ['1st', '2nd', '3rd', '4th']
const availableSections = ['South 1', 'South 2', 'South 3']
const newStudent = ref({
  studentId: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  contactNumber: '',
  year: '',
  section: ''
})
const isAddingStudent = ref(false)

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
  const start = (currentPage.value - 1) * itemsPerPage + 1
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
watch([searchQuery, selectedYear, selectedSection], () => {
  currentPage.value = 1
})

    // Initialize data on component mount
    onMounted(async () => {
      if (store.getters.isLoggedIn) {
    await fetchStudents();
      }
      
  // Initialize dropdowns after a short delay to ensure DOM is ready
  nextTick(() => {
      const dropdownElements = document.querySelectorAll('[data-bs-toggle="dropdown"]')
    const dropdownInstances = []
    
      dropdownElements.forEach(element => {
      if (element) {
        dropdownInstances.push(new Dropdown(element))
      }
    })

    // Cleanup dropdowns on unmount
    onUnmounted(() => {
      dropdownInstances.forEach(dropdown => {
        if (dropdown && typeof dropdown.dispose === 'function') {
          dropdown.dispose()
        }
      })
    })
  })
})

    // Watch for auth state changes
    watch(() => store.state.auth.token, (newToken) => {
      if (newToken) {
        fetchStudents();
      }
    });

    // File upload handlers
    const handleFileChange = (event) => {
      const file = event.target.files[0]
      if (file && file.type !== 'text/csv') {
        alert('Please select a CSV file')
        event.target.value = ''
        selectedFile.value = null
        return
      }
      selectedFile.value = file
      console.log('File selected:', file?.name)
    }

    const handleFileUpload = async () => {
      if (!selectedFile.value || !uploadYear.value) {
        alert('Please select both a year and a CSV file')
        return
      }

      isUploading.value = true
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('year', uploadYear.value)

      try {
        console.log('Starting upload...', {
          year: uploadYear.value,
          fileName: selectedFile.value.name
        })

        const token = store.state.auth.token
        if (!token) {
          throw new Error('No authentication token found')
        }

    // Log the form data to verify what's being sent
    console.log('Form data contents:', {
      file: selectedFile.value,
      year: uploadYear.value
    })

    const response = await api.post('/students/upload', formData, {
          headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
          }
        })

        console.log('Upload successful:', response.data)

        if (response.data.errors && response.data.errors.length > 0) {
          const errorMessage = response.data.errors.join('\n')
          alert(`Upload completed with some errors:\n${errorMessage}`)
        } else {
          const counts = response.data.sectionCounts
          alert(`File uploaded successfully!\n\nStudent distribution:\nSouth 1: ${counts['South 1']} students\nSouth 2: ${counts['South 2']} students\nSouth 3: ${counts['South 3']} students`)
        }

        // Reset form
        selectedFile.value = null
        uploadYear.value = ''
        
        // Refresh student list and close modal
        await fetchStudents()
    
    // Debug: Check if emails are included in the fetched students after upload
    console.log('Students after upload:', students.value);
    if (students.value.length > 0) {
      console.log('First student after upload:', students.value[0]);
      console.log('Email field exists after upload:', 'email' in students.value[0]);
      console.log('Email value after upload:', students.value[0].email);
    }
    
        showAddStudentModal.value = false
      } catch (error) {
    console.error('Upload failed:', error)
        alert('Error uploading file: ' + (error.response?.data?.message || error.message))
      } finally {
        isUploading.value = false
      }
    }

    // Filter students
    const filteredStudents = computed(() => {
      return students.value.filter(student => {
        const searchLower = searchQuery.value.toLowerCase();
const matchesSearch = 
          student.studentId.toLowerCase().includes(searchLower) ||
          student.firstName.toLowerCase().includes(searchLower) ||
student.lastName.toLowerCase().includes(searchLower);

// Apply year and section filters
const matchesYear = !selectedYear.value || student.year === selectedYear.value;
const matchesSection = !selectedSection.value || student.section === selectedSection.value;

return matchesSearch && matchesYear && matchesSection;
      });
    });

    // Student actions
    const closeStudentModal = () => {
      if (performanceChart.value) {
        const existingChart = Chart.getChart(performanceChart.value);
        if (existingChart) {
          existingChart.destroy();
        }
      }
      selectedStudent.value = null;
    };

    const confirmDelete = (student) => {
studentToDelete.value = student;
showDeleteModal.value = true;
    }

    const deleteStudent = async (student) => {
      try {
        const token = store.state.auth.token;

    // Delete the student from students collection using MongoDB _id
    await api.delete(
      '/students/' + student._id,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
        );

            // Update local state
        students.value = students.value.filter(s => s._id !== student._id);
        selectedStudent.value = null;
        showDeleteModal.value = false;
        studentToDelete.value = null;
        alert('Student deleted successfully');
      } catch (error) {
    console.error('Failed to delete student:', error);
        alert('Failed to delete student. Please try again.');
      }
    }

const startEditing = (student) => {
  editingStudent.value = { ...student }
      isEditing.value = true
    }

    const cancelEditing = () => {
editingStudent.value = null
      isEditing.value = false
    }

    const saveStudentChanges = async () => {
      try {
        const token = store.state.auth.token
        
    // Update student information
    const studentResponse = await api.put('/students/' + editingStudent.value._id, {
            studentId: editingStudent.value.studentId,
            firstName: editingStudent.value.firstName,
            lastName: editingStudent.value.lastName,
            email: editingStudent.value.email,
            year: editingStudent.value.year,
            section: editingStudent.value.section
        }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
        })

        if (studentResponse.data) {
            // Update local state
            const index = students.value.findIndex(s => s._id === editingStudent.value._id)
            if (index !== -1) {
              students.value[index] = { ...editingStudent.value }
            }
            
            selectedStudent.value = null
            editingStudent.value = null
            isEditing.value = false
            alert('Student information updated successfully')
        } else {
          throw new Error('Failed to update student information')
        }
      } catch (error) {
    console.error('Failed to update student:', error)
        alert('Failed to update student information. Please try again.')
      }
    }

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

    const sortedStudents = computed(() => {
      let students = filteredStudents.value

      if (sortField.value) {
        students = [...students].sort((a, b) => {
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

      return students
    })

    const toggleSearch = () => {
      showSearch.value = !showSearch.value
      if (!showSearch.value) {
        searchQuery.value = ''
      }
    }

    const handleSearch = () => {
      // Implement any additional search logic here if needed
      console.log('Searching for:', searchQuery.value)
    }

const clearSearch = () => {
searchQuery.value = ''
handleSearch()
}

// Add getAcademicYearRange function
const getAcademicYearRange = (year) => {
const currentYear = new Date().getFullYear()
let yearNumber = 0

switch(year) {
case '1st':
yearNumber = 1
break
case '2nd':
yearNumber = 2
break
case '3rd':
yearNumber = 3
break
case '4th':
yearNumber = 4
break
default:
return 'N/A'
}

const startYear = currentYear - yearNumber + 1
return `${startYear} - ${startYear + 1}`
}

// Add hasActiveFilters computed property
const hasActiveFilters = computed(() => {
return selectedYear.value || selectedSection.value;
});

// Add viewStudent function
const viewStudent = (student) => {
selectedStudent.value = student;
// Initialize charts if needed
if (performanceChart.value) {
const ctx = performanceChart.value.getContext('2d');
// Add your chart initialization logic here
}
};

// Add clearFilters function
const clearFilters = () => {
selectedYear.value = '';
selectedSection.value = '';
searchQuery.value = '';
};

const applyFilters = () => {
fetchStudents();
};

// Function to handle adding a single student
const handleAddSingleStudent = async () => {
  try {
    isAddingStudent.value = true
    
    // Validate required fields
    const requiredFields = ['studentId', 'firstName', 'middleName', 'lastName', 'email', 'contactNumber', 'year', 'section']
    for (const field of requiredFields) {
      if (!newStudent.value[field]) {
        throw new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`)
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newStudent.value.email)) {
      throw new Error('Please enter a valid email address')
    }
    
    const token = store.state.auth.token
    if (!token) {
      throw new Error('No authentication token found')
    }
    
    // Send request to add student
    const response = await api.post('/students', {
      ...newStudent.value,
      // Calculate academic years based on current year and student's year level
      academicYears: calculateAcademicYears(newStudent.value.year)
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('Student added successfully:', response.data)
    
    // Reset form and close modal
    resetNewStudentForm()
    showAddSingleStudentModal.value = false
    
    // Refresh student list
    await fetchStudents()
    
    alert('Student added successfully')
  } catch (error) {
    console.error('Failed to add student:', error)
    alert('Error adding student: ' + (error.response?.data?.message || error.message))
  } finally {
    isAddingStudent.value = false
  }
}

// Helper function to reset the new student form
const resetNewStudentForm = () => {
  newStudent.value = {
    studentId: '',
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    year: '',
    section: ''
  }
}

// Helper function to calculate academic years
const calculateAcademicYears = (year) => {
  const currentYear = new Date().getFullYear()
  let startYear, endYear
  
  switch(year) {
        case '1st':
      startYear = currentYear
      endYear = currentYear + 4
      break
        case '2nd':
      startYear = currentYear - 1
      endYear = currentYear + 3
      break
        case '3rd':
      startYear = currentYear - 2
      endYear = currentYear + 2
      break
        case '4th':
      startYear = currentYear - 3
      endYear = currentYear + 1
      break
        default:
      startYear = currentYear
      endYear = currentYear + 4
  }
  
  return { startYear, endYear }
}

// Add fetchStudents function that was accidentally removed
const fetchStudents = async () => {
  try {
    const token = store.state.auth.token;
    const response = await api.get('/students', {
            headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    students.value = response.data;
      } catch (error) {
    console.error('Failed to fetch students:', error);
    alert('Failed to fetch students. Please try again.');
      }
    };

    return {
      students,
      searchQuery,
      selectedStudent,
      performanceChart,
      sortField,
      sortOrder,
      showDeleteModal,
      studentToDelete,
      isEditing,
      editingStudent,
      showSearch,
showAddStudentModal,
showAddSingleStudentModal,
selectedFile,
uploadYear,
isUploading,
availableYears,
availableSections,
newStudent,
isAddingStudent,
handleFileChange,
handleFileUpload,
handleAddSingleStudent,
resetNewStudentForm,
filteredStudents,
closeStudentModal,
confirmDelete,
deleteStudent,
startEditing,
cancelEditing,
saveStudentChanges,
sortBy,
getSortIcon,
sortedStudents,
toggleSearch,
handleSearch,
clearSearch,
fetchStudents,
hasActiveFilters,
selectedYear,
selectedSection,
viewStudent,
getAcademicYearRange,
clearFilters,
applyFilters,
currentPage,
totalPages,
paginatedStudents,
paginationInfo,
nextPage,
previousPage
    }
  }
}
</script>

<style scoped>
/* Base z-index hierarchy */
:root {
  --z-base: 1;
  --z-table: 1010;
  --z-controls: 1020;
  --z-dropdown: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
}

.student-management {
  padding: 20px;
position: relative;
}

/* Button container styles */
.d-flex.gap-2.mb-3 {
position: static;
top: auto;
right: auto;
z-index: auto;
}

/* Modal Styles */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
z-index: 2000;
}

.modal-backdrop {
position: fixed;
top: 0;
left: 0;
width: 100vw;
height: 100vh;
background-color: rgba(0, 0, 0, 0.5);
z-index: 1999;
}

.modal {
  position: relative;
  width: 100%;
max-width: 500px;
margin: 2rem;
z-index: 2001;
background: white;
border-radius: 12px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
overflow: hidden;
}

.modal-content {
  position: relative;
  width: 100%;
background: white;
border-radius: 12px;
  overflow: hidden;
}

.modal-header {
display: flex;
align-items: center;
justify-content: space-between;
padding: 1rem 1.5rem;
border-bottom: 1px solid #e2e8f0;
}

.modal-header.bg-primary {
background-color: #003366 !important;
}

.btn-close-white {
filter: brightness(0) invert(1);
}

.modal-body {
  padding: 1.5rem;
}

.form-label {
font-weight: 500;
color: #2d3748;
margin-bottom: 0.5rem;
}

.form-select,
.form-control {
border: 2px solid #e2e8f0;
border-radius: 8px;
padding: 0.75rem;
width: 100%;
transition: all 0.2s;
}

.form-select:focus,
.form-control:focus {
border-color: #003366;
box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.1);
}

.text-muted {
color: #718096 !important;
}

.btn {
padding: 0.75rem 1.5rem;
font-weight: 500;
border-radius: 8px;
transition: all 0.2s;
}

.btn-primary {
background-color: #003366;
border: none;
}

.btn-primary:hover:not(:disabled) {
background-color: #004080;
}

.btn-secondary {
background-color: #e2e8f0;
border: none;
color: #4a5568;
}

.btn-secondary:hover {
background-color: #cbd5e1;
}

.btn:disabled {
opacity: 0.7;
cursor: not-allowed;
}

/* Table container styles */
.table-container {
margin-top: 0;
}

/* Table Styles */
.table-responsive {
  position: relative;
  z-index: 1010;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table {
  margin-bottom: 0;
}

.table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1011;
  padding: 1rem;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

/* Student Info Card */
.student-info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.student-info-header {
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2d3748;
}

.student-info-content {
  padding: 1.25rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

.info-item span {
  color: #2d3748;
  font-weight: 500;
}

/* Performance Card */
.performance-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.performance-header {
  padding: 1rem 1.25rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.performance-content {
  padding: 1.25rem;
}

.chart-container {
  background: white;
  padding: 1.25rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* History Card */
.history-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-header {
  padding: 1rem 1.25rem;
  background: #003366;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-content {
  padding: 1.25rem;
}

/* Dropdown Styles */
.dropdown {
  position: relative;
  z-index: 1030;
}

.dropdown-menu {
  position: absolute;
  z-index: 1031;
  min-width: 200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: none;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
}

.dropdown-menu.show {
  display: block !important;
}

/* Button Styles */
.btn-control {
  height: 38px;
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
}

.btn-control:hover,
.btn-control:focus {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #2d3748;
}

/* Search Control */
.search-control {
  position: relative;
  z-index: var(--z-controls);
  width: 300px;
}

.search-control .input-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.search-control .input-group-text {
  background: white;
  border: 1px solid #e2e8f0;
  color: #718096;
  padding-right: 0;
}

.search-control .form-control {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
}

/* Filter Badge */
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

/* Table styles */
.table {
  margin-bottom: 0;
  background: white;
}

.table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: calc(var(--z-table) + 1);
  padding: 1rem;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

/* Search control */
.search-control {
  position: relative;
  z-index: var(--z-controls);
}

/* Controls wrapper */
.controls-wrapper {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: var(--z-controls);
}

.btn-light {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
}

.btn-light:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #2d3748;
}

.btn-primary {
  background: #4299e1;
  border: none;
  color: white;
}

.btn-primary:hover {
  background: #3182ce;
}

.student-info p {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.student-info p:last-child {
  border-bottom: none;
}

.student-info strong {
  color: #666;
  display: inline-block;
  width: 100px;
}

.empty-state-message {
  padding: 2rem 0;
}

.empty-state-message i {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-state-message p {
  margin: 0;
  color: #6c757d;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: rgba(0, 51, 102, 0.05) !important;
}

.student-info-card,
.performance-card,
.history-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.student-info-header,
.performance-header,
.history-header {
  background-color: #f8f9fa;
  padding: 1rem;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.student-info-content,
.performance-content,
.history-content {
  padding: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: 600;
  color: #666;
  margin-bottom: 0.25rem;
}

.info-item span {
  color: #333;
}

.chart-container {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.badge {
font-size: 1rem;
padding: 0.5em 1em;
}

.badge-quiz {
  background-color: #4e73df;
  color: white;
}

.badge-activity {
  background-color: #1cc88a;
  color: white;
}

.badge-performance {
  background-color: #f6c23e;
  color: white;
}

.score-excellent {
  color: #1cc88a;
  font-weight: 600;
}

.score-good {
  color: #4e73df;
  font-weight: 600;
}

.score-average {
  color: #f6c23e;
  font-weight: 600;
}

.score-poor {
  color: #e74a3b;
  font-weight: 600;
}

.modal-header.bg-primary {
  background-color: #003366 !important;
}

.btn-close-white {
  filter: brightness(0) invert(1);
}

.date-filter .form-control {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 150px;
}

.date-filter .form-control::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.date-filter .form-control:focus {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.date-filter span {
  padding: 0 0.5rem;
}

.date-input-container {
  position: relative;
  display: inline-block;
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  min-width: 250px;
}

.date-picker-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
}

.close-btn:hover {
  color: #333;
}

.date-picker-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.date-picker-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  padding: 4px;
}

.date-filter .form-control {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 150px;
  cursor: pointer;
}

.date-filter .form-control:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.date-filter span {
  padding: 0 0.5rem;
  color: white;
}

.history-card {
  position: relative;
  overflow: visible !important;
}

.history-header {
  position: relative;
  overflow: visible;
}

.table {
  width: 100%;
  margin-bottom: 0;
  border-collapse: collapse;
}

.table th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  padding: 1rem;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e2e8f0;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
  border-bottom: 1px solid #e2e8f0;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn i {
  font-size: 0.875rem;
}

.form-control,
.form-select {
  border: 2px solid #eee;
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.3s;
}

.form-control:focus,
.form-select:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(0, 51, 102, 0.15);
}

/* Table Controls */
.table-controls {
  position: relative;
  z-index: 1030;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 1rem;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  z-index: 1031;
  min-width: 200px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: none;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
}

.dropdown-menu.show {
  display: block !important;
}

/* Modal Styles */
.modal-dialog {
  max-width: 900px;
  margin: 1.75rem auto;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.modal-header {
  background: #003366;
  color: white;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header .modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.modal-body {
  padding: 1.5rem;
}

/* Student Details Layout */
.student-details {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
max-height: calc(90vh - 4rem);
overflow-y: auto;
}

.student-info {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 12px;
  height: fit-content;
}

.info-title {
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

.info-content p {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  font-size: 1rem;
}

.info-content p:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.info-content strong {
  color: #4a5568;
  display: inline-block;
  width: 120px;
  font-weight: 600;
}

.student-charts {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 1.5rem;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-section h6 {
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e2e8f0;
}

/* Table Styles */
.table-responsive {
  position: relative;
  z-index: 1020;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Update existing styles */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-controls {
  background: #f8fafc;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-dialog.modal-xxl {
max-width: 90%;
width: 1400px;
margin: 2rem auto;
}

.student-details {
  display: grid;
grid-template-columns: 350px 1fr;
  gap: 2rem;
max-height: calc(90vh - 4rem);
overflow-y: auto;
}

.student-info {
  background: #f8fafc;
  padding: 2rem;
  border-radius: 12px;
  height: fit-content;
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

.chart-section {
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
}

.attendance-table td {
  font-size: 1.1rem;
  color: #4a5568;
}

.badge {
  font-size: 1rem;
  padding: 0.5em 1em;
}

/* Fix z-index issues */
.modal-wrapper {
  z-index: 9999 !important;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  backdrop-filter: blur(4px);
}

.modal-dialog {
  z-index: 9999 !important;
}

.table-controls {
  position: relative;
  z-index: 1020;
}

.dropdown-menu {
  z-index: 1030;
}

.table-responsive {
  position: relative;
  z-index: 1010;
}

/* Ensure dropdowns are hidden when modal is open */
.modal-wrapper ~ .table-controls .dropdown-menu {
  display: none !important;
}

/* Timeline Styles */
.timeline {
  position: relative;
  padding: 1rem 0;
}

.timeline::before {
  content: '';
  position: absolute;
  top: 0;
  left: 1rem;
  height: 100%;
  width: 2px;
  background: #e2e8f0;
}

.timeline-item {
  position: relative;
  padding-left: 2.5rem;
  padding-bottom: 2rem;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 4px solid #fff;
  box-shadow: 0 0 0 2px #e2e8f0;
  z-index: 1;
}

.timeline-content {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.timeline-content h6 {
  margin: 0;
  font-size: 1.1rem;
  color: #2d3748;
}

.timeline-status {
  margin: 0.5rem 0 0;
  font-size: 0.95rem;
  color: #718096;
}

.timeline-item.completed .timeline-marker {
  background: #003366;
  box-shadow: 0 0 0 2px #003366;
}

.timeline-item.completed .timeline-content {
  border-left: 3px solid #003366;
}

.timeline-item.completed .timeline-status {
  color: #003366;
  font-weight: 500;
}

.timeline-item.current .timeline-marker {
  background: #4299e1;
  box-shadow: 0 0 0 2px #4299e1;
}

.timeline-item.current .timeline-content {
  border-left: 3px solid #4299e1;
  background: #ebf8ff;
}

.timeline-item.current .timeline-status {
  color: #4299e1;
  font-weight: 500;
}

/* Add Student Modal Styles */
.add-student-modal {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
display: flex;
align-items: center;
justify-content: center;
z-index: 9999;
}

.add-student-backdrop {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background-color: rgba(0, 0, 0, 0.5);
z-index: 9998;
}

.add-student-dialog {
position: relative;
width: 100%;
max-width: 500px;
margin: 1.75rem;
z-index: 10000;
}

.add-student-content {
position: relative;
display: flex;
flex-direction: column;
background-color: #fff;
border-radius: 12px;
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
overflow: hidden;
}

.modal-header {
display: flex;
align-items: center;
justify-content: space-between;
padding: 1rem 1.5rem;
}

.modal-header.bg-primary {
background-color: #003366 !important;
}

.modal-body {
padding: 1.5rem;
}

.btn-close-white {
filter: brightness(0) invert(1);
}

/* Form Styles */
.form-label {
font-weight: 500;
color: #2d3748;
margin-bottom: 0.5rem;
}

.form-select,
.form-control {
border: 2px solid #e2e8f0;
border-radius: 8px;
padding: 0.75rem;
width: 100%;
transition: all 0.2s;
}

.form-select:focus,
.form-control:focus {
border-color: #003366;
box-shadow: 0 0 0 2px rgba(0, 51, 102, 0.1);
}

.text-muted {
color: #718096 !important;
}

.btn {
padding: 0.75rem 1.5rem;
font-weight: 500;
border-radius: 8px;
transition: all 0.2s;
}

.btn-primary {
background-color: #003366;
border: none;
}

.btn-primary:hover:not(:disabled) {
background-color: #004080;
}

.btn-secondary {
background-color: #e2e8f0;
border: none;
color: #4a5568;
}

.btn-secondary:hover {
background-color: #cbd5e1;
}

.btn:disabled {
opacity: 0.7;
cursor: not-allowed;
}

/* Add CSS styles for the success button and modal */
.btn-success {
  background-color: #10B981;
  border: none;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

.modal-header.bg-success {
  background-color: #10B981 !important;
}

/* Form validation styles */
.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #dc3545;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

/* Add sticky controls styles */
.sticky-controls {
  position: sticky;
  top: 0;
  background: white;
  padding: 1rem;
  z-index: 1040;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Add pagination styles */
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

/* Update table styles for fixed height */
.table-responsive {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}

/* Ensure sticky header stays in place */
.table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1020;
}
</style>