<template>
  <div class="login-container">
    <div class="login-card" :data-login-type="loginType">
      <div class="left-section">
        <div class="content-wrapper">
          <div class="logo-container">
            <img src="@/assets/logo1.png" alt="School Logo" class="logo logo1" :class="{ active: loginType === 'citHead' }">
            <img src="@/assets/logo2.png" alt="School Logo" class="logo logo2" :class="{ active: loginType === 'user' }">
          </div>
          <h1 class="school-name">PHINMA ARAULLO UNIVERSITY</h1>
          <p class="system-name">Student Performance Monitoring System</p>
        </div>
      </div>
      
      <div class="right-section" :data-login-type="loginType">
        <h2 class="form-title">{{ loginType === 'citHead' ? 'CIT HEAD LOGIN' : 'TEACHER & SSP LOGIN' }}</h2>
        
        <!-- Login Type Selector -->
        <div class="login-type-selector">
          <button 
            class="type-btn" 
            :class="{'active': loginType === 'citHead'}"
            :data-login-type="loginType"
            @click="loginType = 'citHead'"
          >
            CIT Head
          </button>
          <button 
            class="type-btn" 
            :class="{'active': loginType === 'user'}"
            :data-login-type="loginType"
            @click="loginType = 'user'"
          >
            TEACHER & SSP ADVISERS LOGIN
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
            <input 
              type="password" 
              class="form-control" 
              v-model="password" 
              placeholder="Enter your password here"
              required
              :disabled="isLoading"
            >
          </div>

          <!-- reCAPTCHA -->
          <div class="form-group recaptcha-container">
            <div id="g-recaptcha"></div>
          </div>

          <button type="submit" class="btn-login" :data-login-type="loginType" :disabled="isLoading || !recaptchaToken">
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
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

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
    const recaptchaToken = ref('')
    const recaptchaSiteKey = '6LcsLNkqAAAAAH5OO5HjmocsPxA_y80LzVold7rW'

    onMounted(() => {
      // Load reCAPTCHA script
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)

      // Initialize reCAPTCHA
      script.onload = () => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.render('g-recaptcha', {
            sitekey: recaptchaSiteKey,
            callback: (token) => {
              recaptchaToken.value = token
            },
            'expired-callback': () => {
              recaptchaToken.value = ''
            }
          })
        })
      }
    })

    const handleLogin = async () => {
      try {
        if (!recaptchaToken.value) {
          error.value = 'Please complete the reCAPTCHA verification'
          return
        }

        error.value = ''
        isLoading.value = true

        const credentials = {
          email: email.value,
          password: password.value,
          loginType: loginType.value,
          recaptchaToken: recaptchaToken.value
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
        if (loginType.value === 'citHead' && user.role !== 'citHead') {
          console.log('Access denied: Non-CIT Head using CIT Head login')
          error.value = 'Access denied. Please use the Teacher/Student login.'
          await store.dispatch('logout')
          return
        }
        
        if (loginType.value === 'user' && user.role === 'citHead') {
          console.log('Access denied: CIT Head using regular login')
          error.value = 'Access denied. Please use the CIT Head login.'
          await store.dispatch('logout')
          return
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

        // Reset reCAPTCHA on error
        if (window.grecaptcha) {
          window.grecaptcha.reset()
        }
        recaptchaToken.value = ''
      } finally {
        isLoading.value = false
      }
    }

    return {
      loginType,
      email,
      password,
      error,
      isLoading,
      handleLogin,
      recaptchaSiteKey,
      recaptchaToken
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
</style>