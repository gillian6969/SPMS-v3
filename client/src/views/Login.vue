<template>
  <div class="login-container">
    <div class="login-card" :data-login-type="loginType">
      <div class="left-section">
        <div class="content-wrapper">
          <div class="logo-container">
            <img src="@/assets/logo2.png" alt="School Logo" class="logo logo1" :class="{ active: loginType === 'citHead' }">
            <img src="@/assets/logo2.png" alt="School Logo" class="logo logo2" :class="{ active: loginType === 'user' }">
          </div>
          <h1 class="school-name">PHINMA ARAULLO UNIVERSITY</h1>
          <p class="system-name">Student Performance Monitoring System</p>
        </div>
      </div>
      
      <div class="right-section" :data-login-type="loginType">
        <h2 class="form-title">{{ loginType === 'citHead' ? 'CIT HEAD & SSP HEAD LOGIN' : 'TEACHER & SSP ADVISERS LOGIN' }}</h2>
        
        <!-- Login Type Selector -->
        <div class="login-type-selector">
          <button 
            class="type-btn" 
            :class="{'active': loginType === 'user'}"
            :data-login-type="loginType"
            @click="loginType = 'user'"
          >
          TEACHER & SSP ADVISERS LOGIN
          </button>
          <button 
            class="type-btn" 
            :class="{'active': loginType === 'citHead'}"
            :data-login-type="loginType"
            @click="loginType = 'citHead'"
          >
           CIT Head & SSP Head LOGIN
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              class="form-control" 
              v-model="email" 
              placeholder="Enter your email here"
              required
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="password-input">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                class="form-control" 
                v-model="password" 
                placeholder="Enter your password here"
                required
                :disabled="isLoading"
              >
              <button 
                type="button" 
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
            <div class="mt-3 hover:cursor-pointer" @click="goToForgotPassword">
              <h4>Forgot Password</h4>
            </div>
          </div>

          <!-- Replace mock reCAPTCHA with real Google reCAPTCHA v2 -->
          <div class="form-group recaptcha-container">
            <div ref="recaptchaContainer" id="recaptcha"></div>
          </div>

          <button type="submit" class="btn-login" :data-login-type="loginType" :disabled="isLoading || !recaptchaVerified">
            <span v-if="isLoading" class="spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>Login</span>
          </button>

          <p v-if="error" class="error-message">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>

  <!-- Forgot Password Modal -->
  <div v-if="showForgotPasswordModal" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="text-xl font-semibold">Reset Password</h3>
        <button @click="showForgotPasswordModal = false" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <div v-if="forgotPasswordStep === 1">
          <p class="mb-4">Enter your email address to receive a verification code</p>
          <div class="form-group">
            <input 
              type="email" 
              v-model="forgotEmail" 
              placeholder="Email Address" 
              class="form-control bg-white text-gray-800"
              required
            >
          </div>
          <button 
            @click="sendVerificationCode" 
            class="btn-primary w-full"
            :disabled="isLoadingReset"
          >
            <span v-if="isLoadingReset" class="spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>Send Verification Code</span>
          </button>
        </div>

        <div v-if="forgotPasswordStep === 2">
          <p class="mb-4">Enter the verification code sent to your email</p>
          <div class="form-group">
            <input 
              type="text" 
              v-model="verificationCode" 
              placeholder="Verification Code" 
              class="form-control bg-white text-gray-800"
              required
            >
          </div>
          <button 
            @click="verifyCode" 
            class="btn-primary w-full"
            :disabled="isLoadingReset"
          >
            <span v-if="isLoadingReset" class="spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>Verify Code</span>
          </button>
        </div>

        <div v-if="forgotPasswordStep === 3">
          <p class="mb-4">Set your new password</p>
          <div class="form-group">
            <input 
              type="password" 
              v-model="newPassword" 
              placeholder="New Password" 
              class="form-control bg-white text-gray-800"
              required
            >
          </div>
          <div class="form-group">
            <input 
              type="password" 
              v-model="confirmPassword" 
              placeholder="Confirm New Password" 
              class="form-control bg-white text-gray-800"
              required
            >
          </div>
          <button 
            @click="resetPassword" 
            class="btn-primary w-full"
            :disabled="isLoadingReset"
          >
            <span v-if="isLoadingReset" class="spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span v-else>Reset Password</span>
          </button>
        </div>

        <p v-if="resetError" class="error-message mt-4">{{ resetError }}</p>
        <p v-if="resetSuccess" class="success-message mt-4">{{ resetSuccess }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'Login',
  setup() {
    const store = useStore()
    const router = useRouter()

    const loginType = ref('user')
    const email = ref('')
    const password = ref('')
    const error = ref('')
    const isLoading = ref(false)
    const showPassword = ref(false)
    const recaptchaVerified = ref(false)
    const recaptchaContainer = ref(null)
    const recaptchaWidgetId = ref(null)

    // Function to handle reCAPTCHA verification
    const onRecaptchaVerified = (response) => {
      console.log('reCAPTCHA verified:', response)
      recaptchaVerified.value = true
    }

    // Function to handle reCAPTCHA expiration
    const onRecaptchaExpired = () => {
      console.log('reCAPTCHA expired')
      recaptchaVerified.value = false
    }

    // Function to reset reCAPTCHA
    const resetRecaptcha = () => {
      if (window.grecaptcha && recaptchaWidgetId.value !== null) {
        window.grecaptcha.reset(recaptchaWidgetId.value)
        recaptchaVerified.value = false
      }
    }

    // Load reCAPTCHA script
    const loadRecaptchaScript = () => {
      return new Promise((resolve, reject) => {
        if (window.grecaptcha) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit'
        script.async = true
        script.defer = true
        
        window.onRecaptchaLoaded = () => {
          resolve()
        }
        
        script.onerror = (error) => {
          reject(error)
        }
        
        document.head.appendChild(script)
      })
    }

    // Initialize reCAPTCHA
    const initRecaptcha = () => {
      if (window.grecaptcha && recaptchaContainer.value) {
        recaptchaWidgetId.value = window.grecaptcha.render('recaptcha', {
          'sitekey': '6LcsLNkqAAAAAH5OO5HjmocsPxA_y80LzVold7rW', // reCAPTCHA site key
          'callback': onRecaptchaVerified,
          'expired-callback': onRecaptchaExpired
        })
      }
    }

    onMounted(async () => {
      try {
        await loadRecaptchaScript()
        setTimeout(() => {
          initRecaptcha()
        }, 500) // Small delay to ensure the container is ready
      } catch (error) {
        console.error('Failed to load reCAPTCHA:', error)
      }
    })

    const handleLogin = async () => {
      try {
        error.value = '';
        isLoading.value = true;

        if (!recaptchaVerified.value) {
          error.value = 'Please complete the reCAPTCHA verification'
          isLoading.value = false
          return
        }

        const recaptchaResponse = window.grecaptcha.getResponse(recaptchaWidgetId.value)

        const credentials = {
          email: email.value,
          password: password.value,
          loginType: loginType.value,
          recaptchaResponse
        }

        console.log('Attempting login with:', { 
          email: credentials.email, 
          loginType: credentials.loginType,
          timestamp: new Date().toISOString()
        })

        const response = await store.dispatch('login', credentials)
        console.log('Login response received:', {
          userRole: response.data.user?.role,
          loginType: loginType.value,
          timestamp: new Date().toISOString()
        })
        
        const user = response.data.user
        
        // Check login type before proceeding
        if(loginType.value === 'citHead'){
          if(user.role === 'teacher' || user.role === 'ssp'){
            console.log('Access denied: Non-CIT Head using CIT Head login')
            error.value = 'Access denied. Please use the Teacher/Student login.'
            await store.dispatch('logout')
            resetRecaptcha()
            return
          }
        }

        if(loginType === 'user'){
          if(user.role === 'citHead' || user.role === 'sspHead'){
            console.log('Access denied: CIT Head using regular login')
            error.value = 'Access denied. Please use the CIT Head login.'
            await store.dispatch('logout')
            resetRecaptcha()
            return
          }
        }

        router.push('/dashboard')
      } catch (err) {
        console.error('Login error:', {
          error: err,
          response: err.response?.data,
          status: err.response?.status,
          timestamp: new Date().toISOString()
        })
        
        if (err.response?.status === 403) {
          error.value = err.response.data.message || 'Access denied. Please check your login type.'
        } else if (err.response?.status === 400) {
          error.value = err.response.data.message || 'Invalid credentials. Please try again.'
        } else {
          error.value = 'Login failed. Please try again.'
        }
        
        resetRecaptcha()
      } finally {
        isLoading.value = false
      }
    }

    const goToForgotPassword = () => {
      showForgotPasswordModal.value = true
    }

    // Forgot password state
    const showForgotPasswordModal = ref(false)
    const forgotPasswordStep = ref(1)
    const forgotEmail = ref('')
    const verificationCode = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const resetError = ref('')
    const resetSuccess = ref('')
    const isLoadingReset = ref(false)
    
    // Send verification code
    const sendVerificationCode = async () => {
      if (!forgotEmail.value) {
        resetError.value = 'Please enter your email address'
        return
      }
      
      try {
        resetError.value = ''
        resetSuccess.value = ''
        isLoadingReset.value = true
        
        const response = await axios.post('http://localhost:8000/api/users/profile/password/request-code', {
          email: forgotEmail.value
        })
        
        resetSuccess.value = 'Verification code sent to your email'
        forgotPasswordStep.value = 2
      } catch (err) {
        resetError.value = err.response?.data?.message || 'Failed to send verification code. Please try again.'
      } finally {
        isLoadingReset.value = false
      }
    }
    
    // Verify code
    const verifyCode = async () => {
      if (!verificationCode.value) {
        resetError.value = 'Please enter verification code'
        return
      }
      
      try {
        resetError.value = ''
        resetSuccess.value = ''
        isLoadingReset.value = true
        
        const response = await axios.post('http://localhost:8000/api/users/profile/password/verify-code', {
          email: forgotEmail.value,
          code: verificationCode.value
        })
        
        resetSuccess.value = 'Code verified successfully'
        forgotPasswordStep.value = 3
      } catch (err) {
        resetError.value = err.response?.data?.message || 'Invalid verification code. Please try again.'
      } finally {
        isLoadingReset.value = false
      }
    }
    
    // Reset password
    const resetPassword = async () => {
      if (!newPassword.value) {
        resetError.value = 'Please enter new password'
        return
      }
      
      if (newPassword.value !== confirmPassword.value) {
        resetError.value = 'Passwords do not match'
        return
      }
      
      if (newPassword.value.length < 8) {
        resetError.value = 'Password must be at least 8 characters long'
        return
      }
      
      try {
        resetError.value = ''
        resetSuccess.value = ''
        isLoadingReset.value = true
        
        const response = await axios.post('http://localhost:8000/api/users/profile/password/reset-with-code', {
          email: forgotEmail.value,
          code: verificationCode.value,
          password: newPassword.value
        })
        
        resetSuccess.value = 'Password reset successfully'
        setTimeout(() => {
          showForgotPasswordModal.value = false
          forgotPasswordStep.value = 1
          forgotEmail.value = ''
          verificationCode.value = ''
          newPassword.value = ''
          confirmPassword.value = ''
          resetError.value = ''
          resetSuccess.value = ''
        }, 2000)
      } catch (err) {
        resetError.value = err.response?.data?.message || 'Failed to reset password. Please try again.'
      } finally {
        isLoadingReset.value = false
      }
    }

    return {
      loginType,
      email,
      password,
      error,
      isLoading,
      handleLogin,
      goToForgotPassword,
      showPassword,
      recaptchaVerified,
      recaptchaContainer,
      // Forgot password
      showForgotPasswordModal,
      forgotPasswordStep,
      forgotEmail,
      verificationCode,
      newPassword,
      confirmPassword,
      resetError,
      resetSuccess,
      isLoadingReset,
      sendVerificationCode,
      verifyCode,
      resetPassword
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');

.login-container {
  @apply min-h-screen w-screen flex items-stretch justify-end bg-gray-50 m-0 p-0 overflow-hidden fixed inset-0;
}

.login-card {
  @apply w-screen h-full flex bg-white overflow-hidden m-0 p-0 relative;
}

.left-section {
  @apply flex-1 p-8 flex flex-col items-center justify-center text-center bg-white m-0 relative transition-transform duration-500;
}

.content-wrapper {
  @apply flex flex-col items-center justify-center gap-0 w-full text-center px-8;
}

.logo-container {
  @apply relative w-[600px] h-[600px] mb-0 flex items-center justify-center;
}

.logo {
  @apply absolute max-w-full max-h-full w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-700 opacity-0 object-contain;
}

.logo.active {
  @apply opacity-100;
}

/* Logo transitions based on login type */
.login-card[data-login-type="citHead"] .logo-container .logo1 {
  opacity: 1;
}

.login-card[data-login-type="citHead"] .logo-container .logo2 {
  opacity: 0;
}

.login-card[data-login-type="user"] .logo-container .logo1 {
  opacity: 0;
}

.login-card[data-login-type="user"] .logo-container .logo2 {
  opacity: 1;
}

.right-section {
  @apply min-w-[500px] w-[600px] p-20 text-white flex flex-col justify-center m-0 relative transition-all duration-700;
}

/* Sliding animations */
.login-card[data-login-type="citHead"] .left-section {
  transform: translateX(0);
}

.login-card[data-login-type="citHead"] .right-section {
  transform: translateX(0);
  @apply bg-navy rounded-l-3xl;
}

.login-card[data-login-type="user"] .left-section {
  transform: translateX(600px);
}

.login-card[data-login-type="user"] .right-section {
  transform: translateX(calc(-100vw + 600px));
  @apply bg-navy rounded-r-3xl;
}

.login-type-selector {
  @apply flex gap-4 mb-8;
}

.type-btn {
  @apply flex-1 py-3 px-4 border-2 border-white bg-transparent text-white rounded-lg cursor-pointer font-semibold transition-all duration-300;
}

.type-btn:hover:not(.active) {
  @apply bg-white/10;
}

.type-btn.active[data-login-type="citHead"],
.type-btn.active[data-login-type="user"] {
  @apply bg-white text-navy;
}

.school-name {
  @apply text-4xl font-bold text-navy m-0 text-center relative w-full leading-tight -mt-8;
}

.system-name {
  @apply text-xl text-gray-800 m-0 relative w-full leading-relaxed mt-2;
}

.login-form {
  @apply w-full;
}

.form-title {
  @apply text-5xl font-semibold mb-8 text-white text-start -mt-16;
}

.form-group {
  @apply mb-6;
}

.form-label {
  @apply block mb-2 text-white text-base font-medium;
}

.form-control {
  @apply w-full py-3 px-4 border border-white/20 rounded-lg bg-transparent text-white text-base transition-all duration-300;
}

.form-control::placeholder {
  @apply text-white/70;
}

.form-control:focus {
  @apply outline-none border-white ring-2 ring-white/10;
}

.btn-login {
  @apply bg-white text-navy py-3 px-4 rounded-lg w-3/5 uppercase font-bold mt-8 border-none cursor-pointer transition-colors duration-200 block mx-auto;
}

.btn-login:hover {
  @apply bg-gray-100;
}

.error-message {
  @apply text-red-400 mt-4 text-center;
}

.spinner {
  @apply inline-block mr-2;
}

.btn-login:disabled {
  @apply opacity-70 cursor-not-allowed;
}

.form-control:disabled {
  @apply bg-white/10 cursor-not-allowed;
}

.recaptcha-container {
  @apply flex justify-center mt-8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-card {
    @apply flex-col max-w-[400px];
  }

  .right-section {
    @apply w-full p-8;
  }

  .left-section {
    @apply p-8;
  }

  .logo-container {
    @apply w-[300px] h-[300px];
  }

  .school-name {
    @apply text-2xl;
  }

  .system-name {
    @apply text-lg;
  }

  .form-title {
    @apply text-3xl mb-6 -mt-10;
  }

  .login-type-selector {
    @apply mb-6;
  }

  .form-group {
    @apply mb-5;
  }

  .btn-login {
    @apply w-full mt-6;
  }
}

/* Modal Styles */
.modal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50;
}

.modal-container {
  @apply bg-navy w-full max-w-md mx-auto rounded-lg shadow-xl overflow-hidden;
}

.modal-header {
  @apply flex justify-between items-center p-4 bg-navy border-b border-white/20 text-white;
}

.close-btn {
  @apply text-white text-2xl font-bold hover:text-gray-300 focus:outline-none;
}

.modal-body {
  @apply p-6 text-white;
}

.btn-primary {
  @apply bg-white text-navy py-3 px-4 rounded-lg font-bold border-none cursor-pointer transition-colors duration-200 text-center;
}

.btn-primary:hover {
  @apply bg-gray-100;
}

.btn-primary:disabled {
  @apply opacity-70 cursor-not-allowed;
}

.success-message {
  @apply text-green-400 text-center;
}

/* Password input styles */
.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
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
  color: white;
  background: rgba(255, 255, 255, 0.1);
}
</style>