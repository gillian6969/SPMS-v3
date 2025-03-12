<template>
  <div class="view-profile">
    <div class="profile-header">
      <div class="profile-avatar">
        <i class="fas fa-user-circle"></i>
      </div>
      <h2>{{ user.firstName }} {{ user.lastName }}</h2>
      <p class="text-muted">{{ user.role === 'citHead' ? 'CIT Head' : user.role === 'teacher' ? 'Teacher' : 'SSP Adviser' }}</p>
    </div>

    <div class="profile-content">
      <div class="info-card">
        <h3>Personal Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>First Name</label>
            <span>{{ user.firstName }}</span>
          </div>
          <div class="info-item">
            <label>Last Name</label>
            <span>{{ user.lastName }}</span>
          </div>
          <div class="info-item">
            <label>Email</label>
            <span>{{ user.email }}</span>
          </div>
          <div class="info-item" v-if="user.role !== 'citHead'">
            <label>Teaching Year</label>
            <span>{{ user.teachingYear }}</span>
          </div>
          <div class="info-item">
            <label>Role</label>
            <span>{{ user.role === 'citHead' ? 'CIT Head' : user.role === 'teacher' ? 'Teacher' : 'SSP Adviser' }}</span>
          </div>
          <div class="info-item" v-if="user.role === 'teacher'">
            <label>Subjects</label>
            <span>{{ user.subjects.join(', ') || 'No subjects assigned' }}</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <router-link to="/profile/edit" class="btn btn-primary">
          <i class="fas fa-user-edit"></i>
          Edit Information
        </router-link>
        <router-link to="/profile/password" class="btn btn-secondary">
          <i class="fas fa-key"></i>
          Change Password
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'ViewProfile',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const user = computed(() => store.state.auth.user || {})
    const isLoggedIn = computed(() => store.getters.isLoggedIn)

    // Redirect if not logged in
    if (!isLoggedIn.value) {
      router.push('/login')
    }

    return {
      user
    }
  }
}
</script>

<style scoped>
.view-profile {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #203464, #2a4580);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(32, 52, 100, 0.25);
  color: white;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent);
  pointer-events: none;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 1.5rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
}

.profile-avatar::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.profile-avatar:hover {
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}

.profile-avatar i {
  font-size: 3.5rem;
  color: #203464;
}

.profile-header h2 {
  margin: 0.5rem 0;
  font-size: 2rem;
  font-weight: 600;
}

.profile-header p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin: 0;
}

.profile-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1),
              0 5px 15px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-card {
  margin-bottom: 2.5rem;
  position: relative;
}

.info-card::before {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: linear-gradient(135deg, rgba(32, 52, 100, 0.05), transparent);
  border-radius: 25px;
  z-index: -1;
}

.info-card h3 {
  color: #203464;
  margin-bottom: 2rem;
  font-size: 1.4rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 1rem;
}

.info-card h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: #203464;
  border-radius: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  position: relative;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 15px;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.info-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #203464, transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.info-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.info-item:hover::before {
  opacity: 1;
}

.info-item label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item span {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2.5rem;
  padding-top: 2.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.action-buttons::before {
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

@media (max-width: 768px) {
  .view-profile {
    padding: 1rem;
  }
  
  .profile-header {
    padding: 2rem 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 