<template>
  <div class="change-password">
    <div class="card">
      <div class="card-header">
        <h4>Change Password</h4>
      </div>
      <div class="card-body">
        <!-- Success Alert -->
        <div v-if="successMessage" class="alert alert-success mb-3">
          {{ successMessage }}
        </div>

        <form @submit.prevent="updatePassword">
          <div class="mb-3">
            <label class="form-label">Current Password</label>
            <div class="password-input">
              <input 
                :type="showCurrentPassword ? 'text' : 'password'" 
                class="form-control" 
                v-model="form.currentPassword"
                required
              >
              <button 
                type="button" 
                class="toggle-password"
                @click="showCurrentPassword = !showCurrentPassword"
              >
                <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">New Password</label>
            <div class="password-input">
              <input 
                :type="showNewPassword ? 'text' : 'password'" 
                class="form-control" 
                v-model="form.newPassword"
                required
              >
              <button 
                type="button" 
                class="toggle-password"
                @click="showNewPassword = !showNewPassword"
              >
                <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Confirm New Password</label>
            <div class="password-input">
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                class="form-control" 
                v-model="form.confirmPassword"
                required
              >
              <button 
                type="button" 
                class="toggle-password"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Password Requirements -->
          <div class="password-requirements">
            <h5>Password Requirements:</h5>
            <ul>
              <li :class="{ met: passwordLength }">
                <i :class="passwordLength ? 'fas fa-check' : 'fas fa-times'"></i>
                At least 8 characters long
              </li>
              <li :class="{ met: hasUpperCase }">
                <i :class="hasUpperCase ? 'fas fa-check' : 'fas fa-times'"></i>
                Contains uppercase letter
              </li>
              <li :class="{ met: hasLowerCase }">
                <i :class="hasLowerCase ? 'fas fa-check' : 'fas fa-times'"></i>
                Contains lowercase letter
              </li>
              <li :class="{ met: hasNumber }">
                <i :class="hasNumber ? 'fas fa-check' : 'fas fa-times'"></i>
                Contains number
              </li>
              <li :class="{ met: passwordsMatch }">
                <i :class="passwordsMatch ? 'fas fa-check' : 'fas fa-times'"></i>
                Passwords match
              </li>
            </ul>
          </div>

          <div class="d-flex justify-content-end gap-2">
            <router-link to="/profile/view" class="btn btn-secondary">
              <i class="fas fa-times"></i>
              Cancel
            </router-link>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="!isFormValid || isLoading"
              :class="{ 'btn-loading': isLoading }"
            >
              <i class="fas fa-key"></i>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'ChangePassword',
  setup() {
    const store = useStore()
    const router = useRouter()
    const isLoading = ref(false)
    
    const form = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const showCurrentPassword = ref(false)
    const showNewPassword = ref(false)
    const showConfirmPassword = ref(false)

    // Password validation
    const passwordLength = computed(() => form.value.newPassword.length >= 8)
    const hasUpperCase = computed(() => /[A-Z]/.test(form.value.newPassword))
    const hasLowerCase = computed(() => /[a-z]/.test(form.value.newPassword))
    const hasNumber = computed(() => /[0-9]/.test(form.value.newPassword))
    const passwordsMatch = computed(() => 
      form.value.newPassword && form.value.newPassword === form.value.confirmPassword
    )

    const isFormValid = computed(() => 
      passwordLength.value && 
      hasUpperCase.value && 
      hasLowerCase.value && 
      hasNumber.value && 
      passwordsMatch.value &&
      form.value.currentPassword
    )

    const successMessage = ref('')

    const updatePassword = async () => {
      if (!isFormValid.value) return

      isLoading.value = true
      try {
        await axios.put('/api/users/password', {
          currentPassword: form.value.currentPassword,
          newPassword: form.value.newPassword
        }, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        })

        successMessage.value = 'Password changed successfully!'
        form.value = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
        // Wait for 2 seconds to show the success message before redirecting
        setTimeout(() => {
          router.push('/profile/view')
        }, 2000)
      } catch (error) {
        console.error('Failed to update password:', error)
        alert(error.response?.data?.message || 'Failed to update password')
      } finally {
        isLoading.value = false
      }
    }

    return {
      form,
      showCurrentPassword,
      showNewPassword,
      showConfirmPassword,
      passwordLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      passwordsMatch,
      isFormValid,
      isLoading,
      updatePassword,
      successMessage
    }
  }
}
</script>

<style scoped>
.change-password {
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

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.form-control {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8fafc;
  width: 100%;
}

.form-control:focus {
  border-color: #203464;
  box-shadow: 0 0 0 4px rgba(32, 52, 100, 0.1);
  background-color: white;
  outline: none;
}

.form-control:hover {
  border-color: #cbd5e1;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

.toggle-password:hover {
  color: #203464;
  background: rgba(32, 52, 100, 0.1);
}

.password-requirements {
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.password-requirements::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #203464, transparent);
  opacity: 0.1;
}

.password-requirements h5 {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.password-requirements li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #64748b;
  font-size: 0.9rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.password-requirements li i {
  width: 20px;
  text-align: center;
  font-size: 1rem;
}

.password-requirements li.met {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.password-requirements li.met i {
  color: #10b981;
}

.password-requirements li:not(.met) {
  background: rgba(239, 68, 68, 0.1);
}

.password-requirements li:not(.met) i {
  color: #ef4444;
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

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(32, 52, 100, 0.4);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #64748b, #94a3b8);
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

.alert {
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
}

.alert::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.alert-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.alert-success::before {
  background: #10b981;
}

.alert-danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.alert-danger::before {
  background: #ef4444;
}

.btn-loading {
  position: relative;
  pointer-events: none;
}

.btn-loading i,
.btn-loading span {
  opacity: 0;
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
  .change-password {
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