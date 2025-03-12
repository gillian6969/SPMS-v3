<template>
  <div class="edit-profile">
    <div class="card">
      <div class="card-header">
        <h4>Edit Profile</h4>
      </div>
      <div class="card-body">
        <form @submit.prevent="updateProfile">
          <div class="mb-3">
            <label class="form-label">First Name</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="form.firstName"
              required
            >
          </div>
          
          <div class="mb-3">
            <label class="form-label">Last Name</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="form.lastName"
              required
            >
          </div>
          
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              class="form-control" 
              v-model="form.email"
              required
            >
          </div>

          <div v-if="isTeacher" class="mb-3">
            <label class="form-label">Teaching Year</label>
            <select class="form-select" v-model="form.teachingYear" required>
              <option value="">Select Year</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <router-link to="/dashboard" class="btn btn-secondary">Cancel</router-link>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'EditProfile',
  setup() {
    const store = useStore()
    const router = useRouter()
    const form = ref({
      firstName: '',
      lastName: '',
      email: '',
      teachingYear: ''
    })

    const isTeacher = computed(() => store.getters.isTeacher)
    const user = computed(() => store.state.auth.user)

    onMounted(() => {
      // Initialize form with current user data
      if (user.value) {
        form.value = {
          firstName: user.value.firstName || '',
          lastName: user.value.lastName || '',
          email: user.value.email || '',
          teachingYear: user.value.teachingYear || ''
        }
      }
    })

    const updateProfile = async () => {
      try {
        const response = await axios.put('/api/users/profile', form.value, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })

        if (response.data) {
          // Update store with new user data
          store.commit('SET_USER', response.data)
          // Save to localStorage
          localStorage.setItem('user', JSON.stringify(response.data))
          // Redirect to profile
          router.push('/profile')
        }
      } catch (error) {
        console.error('Failed to update profile:', error)
        alert(error.response?.data?.message || 'Failed to update profile')
      }
    }

    return {
      form,
      isTeacher,
      updateProfile
    }
  }
}
</script>

<style scoped>
.edit-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: white;
  border: none;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1),
              0 5px 15px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top right, rgba(32, 52, 100, 0.03), transparent);
  pointer-events: none;
}

.card-header {
  background: linear-gradient(135deg, #203464, #2a4580);
  border: none;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

.card-header h4 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  position: relative;
}

.card-body {
  padding: 2.5rem;
  position: relative;
}

.form-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.75rem;
  display: block;
  transition: color 0.3s ease;
}

.form-control,
.form-select {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  width: 100%;
}

.form-control:focus,
.form-select:focus {
  border-color: #203464;
  box-shadow: 0 0 0 4px rgba(32, 52, 100, 0.1);
  background-color: white;
  outline: none;
}

.form-control:hover,
.form-select:hover {
  border-color: #cbd5e1;
}

.mb-3 {
  margin-bottom: 1.5rem;
  position: relative;
}

.mb-3:focus-within .form-label {
  color: #203464;
}

.d-flex {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.d-flex::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #203464, transparent);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.btn:hover::before {
  transform: translateX(100%);
}

.btn-primary {
  background: linear-gradient(135deg, #203464, #2a4580);
  color: white;
  box-shadow: 0 4px 15px rgba(32, 52, 100, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(32, 52, 100, 0.4);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.btn-loading {
  position: relative;
  pointer-events: none;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: button-loading 0.8s ease infinite;
  left: calc(50% - 10px);
}

@keyframes button-loading {
  from {
    transform: rotate(0turn);
  }
  to {
    transform: rotate(1turn);
  }
}

@media (max-width: 768px) {
  .edit-profile {
    padding: 1rem;
  }
  
  .card-header {
    padding: 1.5rem;
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  .d-flex {
    flex-direction: column;
    gap: 1rem;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 