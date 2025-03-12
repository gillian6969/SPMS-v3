<template>
  <div v-if="isLoggedIn" class="profile-container">
    <div class="profile-card">
      <!-- Profile Info Section -->
      <div class="profile-info">
        <h3 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h3>
        <div class="profile-email">
          <i class="fas fa-envelope"></i>
          {{ user.email }}
        </div>
      </div>

      <!-- Profile Tabs -->
      <div class="profile-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'edit' }]" 
          @click="activeTab = 'edit'"
        >
          Edit Profile
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'password' }]" 
          @click="activeTab = 'password'"
        >
          Change Password
        </button>
      </div>

      <!-- Edit Profile Form -->
      <div v-if="activeTab === 'edit'" class="profile-form">
        <div class="form-group">
          <label>First Name</label>
          <input 
            type="text" 
            v-model="editForm.firstName" 
            class="form-control"
          >
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input 
            type="text" 
            v-model="editForm.lastName" 
            class="form-control"
          >
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            v-model="editForm.email" 
            class="form-control"
          >
        </div>
        <button class="save-btn" @click="saveProfile">Save Changes</button>
      </div>

      <!-- Change Password Form -->
      <div v-if="activeTab === 'password'" class="profile-form">
        <div class="form-group">
          <label>Current Password</label>
          <input 
            type="password" 
            v-model="passwordForm.currentPassword" 
            class="form-control"
            required
          >
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            v-model="passwordForm.newPassword" 
            class="form-control"
            required
          >
        </div>
        <div class="form-group">
          <label>Confirm Password</label>
          <input 
            type="password" 
            v-model="passwordForm.confirmPassword" 
            class="form-control"
            required
          >
        </div>
        <button class="save-btn" @click="changePassword">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { useStore } from 'vuex'
import axios from 'axios'
import { useRouter } from 'vue-router'

export default {
  name: 'Profile',
  setup() {
    const store = useStore()
    const router = useRouter()
    const activeTab = ref('edit')
    
    // Get user with default empty values
    const user = computed(() => store.state.auth.user || {
      firstName: '',
      lastName: '',
      email: ''
    })

    // Check if user is logged in
    const isLoggedIn = computed(() => store.getters.isLoggedIn)

    // Watch for login state changes
    watch(isLoggedIn, (newValue) => {
      if (!newValue) {
        router.push('/login')
      }
    }, { immediate: true })

    const editForm = reactive({
      firstName: '',
      lastName: '',
      email: ''
    })

    const passwordForm = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    // Watch for user changes to update form
    watch(() => store.state.auth.user, (newUser) => {
      if (newUser) {
        editForm.firstName = newUser.firstName || '';
        editForm.lastName = newUser.lastName || '';
        editForm.email = newUser.email || '';
      }
    }, { immediate: true })

    const saveProfile = async () => {
      try {
        const response = await axios.put('/api/users/profile', editForm, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        });

        if (response.data) {
          alert('Profile updated successfully!');
          store.commit('SET_USER', response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error('Profile update error:', error);
        if (error.response) {
          if (error.response.status === 401) {
            alert('Unauthorized: Please login again');
            router.push('/login');
          } else if (error.response.status === 400) {
            alert(error.response.data.message || 'Invalid input data');
          } else {
            alert(error.response.data.message || 'Failed to update profile');
          }
        } else {
          alert('Network error: Please check your connection');
        }
      }
    };

    const changePassword = async () => {
      if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      try {
        const response = await axios.put('/api/users/profile/password', {
          currentPassword: passwordForm.value.currentPassword,
          newPassword: passwordForm.value.newPassword
        }, {
          headers: {
            Authorization: `Bearer ${store.state.auth.token}`
          }
        });

        if (response.data.success) {
          alert('Password changed successfully!');
          passwordForm.value = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
        }
      } catch (error) {
        console.error('Password change error:', error);
        if (error.response) {
          if (error.response.status === 401) {
            alert('Unauthorized: Please login again');
            router.push('/login');
          } else if (error.response.status === 400) {
            alert(error.response.data.message || 'Invalid current password');
          } else {
            alert(error.response.data.message || 'Failed to change password');
          }
        } else {
          alert('Network error: Please check your connection');
        }
      }
    };

    return {
      activeTab,
      user,
      editForm,
      passwordForm,
      saveProfile,
      changePassword,
      isLoggedIn
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.profile-info {
  text-align: center;
  margin-bottom: 2rem;
}

.profile-name {
  font-size: 1.5rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.profile-email {
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 1rem;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

.profile-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #444;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #eee;
  border-radius: 8px;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(0, 51, 102, 0.1);
}

.save-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  margin-top: 1rem;
}

.save-btn:hover {
  background: #002347;
}
</style> 