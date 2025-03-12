<template>
  <div class="teacher-management">
    <!-- Table Container -->
    <div class="table-container">
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
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" @click.prevent="sortBy('lastName')">
                    <i class="fas fa-sort-alpha-down"></i>
                    <span>Name</span>
                    <i :class="getSortIcon('lastName')" class="ms-auto"></i>
                  </a>
                </li>
                <li>
                  <a class="dropdown-item d-flex align-items-center gap-2" href="#" @click.prevent="sortBy('email')">
                    <i class="fas fa-sort-alpha-down"></i>
                    <span>Email</span>
                    <i :class="getSortIcon('email')" class="ms-auto"></i>
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
                <i class="fas fa-filter me-2"></i> Filter
                <span v-if="hasActiveFilters" class="filter-badge">!</span>
              </button>
              <div class="dropdown-menu shadow-lg p-3" aria-labelledby="filterDropdown">
                <h6 class="dropdown-header px-0 mb-2">Filter Options</h6>
                <div class="mb-3">
                  <label class="form-label">Teaching Year</label>
                  <select class="form-select form-select-sm" v-model="yearFilter" @change="applyFilters">
                    <option value="">All Years</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-3">
                  <button class="btn btn-sm btn-light" @click="clearFilters">Clear All</button>
                  <button class="btn btn-sm btn-primary" @click="applyFilters">Apply Filters</button>
                </div>
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
                placeholder="Search teachers..."
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

      <!-- Teachers Table -->
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Teaching Year</th>
              <th>Subjects</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="sortedTeachers.length > 0">
              <tr 
                v-for="teacher in sortedTeachers" 
                :key="teacher._id"
                @click="editTeacher(teacher)"
                class="clickable-row"
              >
                <td>
                  <div class="teacher-info">
                    <div class="avatar">
                      {{ getInitials(teacher.firstName, teacher.lastName) }}
                    </div>
                    <div class="name">
                      {{ teacher.firstName }} {{ teacher.lastName }}
                    </div>
                  </div>
                </td>
                <td>{{ teacher.email }}</td>
                <td>{{ teacher.teachingYear }}</td>
                <td>
                  <div class="subjects">
                    <span v-for="subject in teacher.subjects" 
                          :key="subject" 
                          class="subject-badge">
                      {{ subject }}
                    </span>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="4" class="text-center py-4">
                <div class="empty-state-message">
                  <i class="fas fa-users text-muted mb-2"></i>
                  <p class="mb-0">No teachers found</p>
                  <p class="text-muted small" v-if="hasActiveFilters">
                    Try adjusting your filters
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Teacher Modal -->
    <div class="modal" v-if="showEditModal" @click.self="closeEditModal">
      <div class="modal-content">
        <div class="modal-header">
          <h5>Teacher Information</h5>
          <button @click="closeEditModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- View Mode -->
          <div v-if="!isEditing">
            <div class="info-grid">
              <div class="info-item">
                <label>First Name</label>
                <span>{{ editForm.firstName }}</span>
              </div>
              <div class="info-item">
                <label>Last Name</label>
                <span>{{ editForm.lastName }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ editForm.email }}</span>
              </div>
              <div class="info-item">
                <label>Teaching Year</label>
                <span>{{ editForm.teachingYear }}</span>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <label>Subjects</label>
                <div class="subjects-list">
                  <span v-for="subject in editForm.subjects" 
                        :key="subject" 
                        class="subject-badge">
                    {{ subject }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="toggleEdit">
                <i class="fas fa-edit"></i> Edit Information
              </button>
              <button type="button" class="btn btn-danger" @click="confirmDelete(selectedTeacher)">
                <i class="fas fa-trash"></i> Delete Teacher
              </button>
            </div>
          </div>

          <!-- Edit Mode -->
          <form v-else @submit.prevent="updateTeacher">
            <div class="info-grid">
              <div class="info-item">
                <label>First Name</label>
                <input 
                  type="text" 
                  v-model="editForm.firstName" 
                  required
                >
              </div>
              <div class="info-item">
                <label>Last Name</label>
                <input 
                  type="text" 
                  v-model="editForm.lastName" 
                  required
                >
              </div>
              <div class="info-item">
                <label>Email</label>
                <input 
                  type="email" 
                  v-model="editForm.email" 
                  required
                >
              </div>
              <div class="info-item">
                <label>Teaching Year</label>
                <select v-model="editForm.teachingYear" required>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
              <div class="info-item" style="grid-column: span 2;">
                <label>Subjects</label>
                <div class="subjects-list">
                  <div v-for="subject in availableSubjects" :key="subject" class="form-check">
                    <input 
                      type="checkbox" 
                      :id="subject"
                      :value="subject"
                      v-model="editForm.subjects"
                    >
                    <label :for="subject">{{ subject }}</label>
                  </div>
                </div>
                <div class="mt-3">
                  <div class="input-group">
                    <input 
                      type="text" 
                      v-model="newSubject"
                      placeholder="Add custom subject"
                      class="form-control"
                      style="width: 70%;"
                    >
                    <button 
                      type="button"
                      @click="addCustomSubject"
                      class="btn btn-primary"
                      :disabled="!newSubject"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="toggleEdit">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="isLoading">
                {{ isLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal" v-if="showDeleteModal" @click.self="closeDeleteModal">
      <div class="modal-content modal-sm">
        <div class="modal-header">
          <h5><i class="fas fa-exclamation-triangle text-danger"></i> Confirm Delete</h5>
          <button @click="closeDeleteModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete this teacher's record? This action cannot be undone.</p>
          <div class="teacher-preview">
            <div class="preview-avatar">
              {{ getInitials(selectedTeacher?.firstName, selectedTeacher?.lastName) }}
            </div>
            <div class="preview-info">
              <strong>{{ selectedTeacher?.firstName }} {{ selectedTeacher?.lastName }}</strong>
              <span>{{ selectedTeacher?.email }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="deleteTeacher" class="btn btn-danger" :disabled="isLoading">
            {{ isLoading ? 'Deleting...' : 'Delete' }}
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

export default {
  name: 'TeacherManagement',
  setup() {
    const store = useStore()
    const teachers = ref([])
    const searchQuery = ref('')
    const yearFilter = ref('')
    const isLoading = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const selectedTeacher = ref(null)
    const newSubject = ref('')
    const sortField = ref('lastName')
    const sortDirection = ref('asc')
    const isEditing = ref(false)

    const editForm = ref({
      firstName: '',
      lastName: '',
      email: '',
      teachingYear: '',
      subjects: []
    })

    const subjectsByYear = {
      '1st': ['ITE 101', 'ITE 102', 'ITE 103', 'ITE 104'],
      '2nd': ['ITE 201', 'ITE 202', 'ITE 203', 'ITE 204'],
      '3rd': ['ITE 301', 'ITE 302', 'ITE 303', 'ITE 304'],
      '4th': ['ITE 401', 'ITE 402', 'ITE 403', 'ITE 404']
    }

    const availableSubjects = computed(() => {
      return editForm.value.teachingYear ? subjectsByYear[editForm.value.teachingYear] : []
    })

    const filteredTeachers = computed(() => {
      return teachers.value.filter(teacher => {
        const matchesSearch = searchQuery.value === '' || 
          teacher.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          teacher.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          teacher.email.toLowerCase().includes(searchQuery.value.toLowerCase())
        
        const matchesYear = yearFilter.value === '' || teacher.teachingYear === yearFilter.value
        
        return matchesSearch && matchesYear
      })
    })

    const hasActiveFilters = computed(() => {
      return yearFilter.value !== '' || searchQuery.value !== ''
    })

    const sortedTeachers = computed(() => {
      let filtered = [...filteredTeachers.value]
      
      if (sortField.value) {
        filtered.sort((a, b) => {
          let aValue = a[sortField.value]
          let bValue = b[sortField.value]
          
          if (sortField.value === 'lastName') {
            aValue = `${a.lastName} ${a.firstName}`
            bValue = `${b.lastName} ${b.firstName}`
          }
          
          if (sortDirection.value === 'asc') {
            return aValue.localeCompare(bValue)
          } else {
            return bValue.localeCompare(aValue)
          }
        })
      }
      
      return filtered
    })

    const getSortIcon = (field) => {
      if (sortField.value !== field) return ''
      return sortDirection.value === 'asc' ? 'fas fa-check' : 'fas fa-check'
    }

    const sortBy = (field) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortField.value = field
        sortDirection.value = 'asc'
      }
    }

    const clearFilters = () => {
      yearFilter.value = ''
      applyFilters()
    }

    const clearSearch = () => {
      searchQuery.value = ''
      handleSearch()
    }

    const handleSearch = () => {
      // You can add debounce logic here if needed
      fetchTeachers()
    }

    const applyFilters = () => {
      fetchTeachers()
    }

    const fetchTeachers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/teachers', {
          headers: {
            'Authorization': `Bearer ${store.state.auth.token}`,
            'Content-Type': 'application/json'
          }
        })
        teachers.value = response.data
      } catch (error) {
        console.error('Failed to fetch teachers:', error)
        if (error.response) {
          console.error('Error response:', error.response.data)
        }
      }
    }

    const editTeacher = (teacher) => {
      selectedTeacher.value = teacher
      editForm.value = {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        teachingYear: teacher.teachingYear,
        subjects: [...teacher.subjects]
      }
      showEditModal.value = true
      isEditing.value = false
    }

    const updateTeacher = async () => {
      isLoading.value = true
      try {
        await axios.put(`/api/teachers/${selectedTeacher.value._id}`, editForm.value, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })
        await fetchTeachers()
        closeEditModal()
      } catch (error) {
        console.error('Failed to update teacher:', error)
        alert(error.response?.data?.message || 'Failed to update teacher')
      } finally {
        isLoading.value = false
      }
    }

    const confirmDelete = (teacher) => {
      selectedTeacher.value = teacher
      showDeleteModal.value = true
    }

    const deleteTeacher = async () => {
      isLoading.value = true
      try {
        await axios.delete(`/api/teachers/${selectedTeacher.value._id}`, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })
        await fetchTeachers()
        closeDeleteModal()
      } catch (error) {
        console.error('Failed to delete teacher:', error)
        alert(error.response?.data?.message || 'Failed to delete teacher')
      } finally {
        isLoading.value = false
      }
    }

    const addCustomSubject = () => {
      if (newSubject.value) {
        const formattedSubject = newSubject.value.trim().toUpperCase()
        if (!editForm.value.subjects.includes(formattedSubject)) {
          editForm.value.subjects.push(formattedSubject)
        }
        newSubject.value = ''
      }
    }

    const getInitials = (firstName, lastName) => {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }

    const closeEditModal = () => {
      showEditModal.value = false
      selectedTeacher.value = null
      isEditing.value = false
      editForm.value = {
        firstName: '',
        lastName: '',
        email: '',
        teachingYear: '',
        subjects: []
      }
    }

    const closeDeleteModal = () => {
      showDeleteModal.value = false
      selectedTeacher.value = null
    }

    const toggleEdit = () => {
      if (isEditing.value) {
        editForm.value = {
          firstName: selectedTeacher.value.firstName,
          lastName: selectedTeacher.value.lastName,
          email: selectedTeacher.value.email,
          teachingYear: selectedTeacher.value.teachingYear,
          subjects: [...selectedTeacher.value.subjects]
        }
      }
      isEditing.value = !isEditing.value
    }

    onMounted(() => {
      fetchTeachers()
    })

    return {
      teachers,
      searchQuery,
      yearFilter,
      filteredTeachers,
      showEditModal,
      showDeleteModal,
      selectedTeacher,
      editForm,
      isLoading,
      newSubject,
      availableSubjects,
      editTeacher,
      updateTeacher,
      confirmDelete,
      deleteTeacher,
      addCustomSubject,
      getInitials,
      closeEditModal,
      closeDeleteModal,
      sortedTeachers,
      hasActiveFilters,
      getSortIcon,
      sortBy,
      clearFilters,
      clearSearch,
      handleSearch,
      applyFilters,
      isEditing,
      toggleEdit
    }
  }
}
</script>

<style scoped>
/* Base styles */
.teacher-management {
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin: 0 auto;
  width: 100%;
}

/* Table Controls */
.table-controls {
  background: #f8fafc;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

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

/* Table Styles */
.table-responsive {
  padding: 1rem;
}

.table {
  width: 100%;
  margin-bottom: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.table th {
  background: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.table td {
  padding: 1rem;
  vertical-align: middle;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 40px;
  height: 40px;
  background: #203464;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.name {
  font-weight: 500;
}

.subjects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.subject-badge {
  background: rgba(32, 52, 100, 0.1);
  color: #203464;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  background: #203464;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h5 {
  color: white;
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.modal-body {
  padding: 2rem;
}

/* Two-column layout */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item label {
  font-weight: bold;
  font-size: 1rem;
}

.info-item span {
  font-size: 1.2rem;
  color: #1e293b;
}

.info-item input,
.info-item select {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  transition: all 0.3s ease;
}

.info-item input:focus,
.info-item select:focus {
  border-color: #203464;
  outline: none;
  box-shadow: 0 0 0 2px rgba(32, 52, 100, 0.1);
}

/* Action buttons */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 1rem;
  margin-bottom: -2rem;
}

.btn {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: bold;
}

.btn-primary {
  background: #203464;
  color: white;
}

.btn-primary:hover {
  background: #2a4580;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

/* Add these new styles */
.empty-state-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
}

.empty-state-message i {
  font-size: 2rem;
  color: #94a3b8;
}

.clickable-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-row:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.teacher-avatar {
  width: 40px;
  height: 40px;
  background: #203464;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.teacher-header-info {
  display: flex;
  flex-direction: column;
}

.teacher-header-info h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.teacher-header-info p {
  margin: 0.5rem 0 0;
  opacity: 0.8;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
}

.form-group input {
  padding: 0.75rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.subject-selection {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
}

.form-check {
  margin-bottom: 0.5rem;
}

.form-check input {
  margin-right: 0.5rem;
}

.form-check label {
  font-weight: 400;
}

.subjects-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style> 