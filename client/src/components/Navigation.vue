  <template>
    <div class="navigation-wrapper" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
        <!-- Sidebar Header with SPMS Logo -->
        <div class="sidebar-header">
          <img src="@/assets/logo2.png" alt="SPMS Logo" class="sidebar-logo">
          <div class="title-container">
            <h3 class="sidebar-title" v-show="!isSidebarCollapsed">SPMS</h3>
            <h4 class="sidebar-subtitle" v-show="!isSidebarCollapsed">Student Performance Monitoring System</h4>
          </div>
          <button class="collapse-btn" @click="toggleSidebar">
            <i :class="isSidebarCollapsed ? 'fas fa-angle-right' : 'fas fa-angle-left'"></i>
          </button>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <!-- CIT Head Navigation -->
          <template v-if="isCITHead">
            <!-- Analytics Category -->
            <div class="nav-category">Analytics</div>
            <router-link to="/dashboard" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Dashboard' : ''">
              <i class="fas fa-chart-line"></i>
              <span v-show="!isSidebarCollapsed">Dashboard</span>
            </router-link>


            <!-- Management Category -->
            <div class="nav-category">Management</div>
            <router-link to="/student-management" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Student Management' : ''">
              <i class="fas fa-users"></i>
              <span v-show="!isSidebarCollapsed">Student Management</span>
            </router-link>
            <router-link to="/teacher-management" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Teacher Management' : ''">
              <i class="fas fa-chalkboard-teacher"></i>
              <span v-show="!isSidebarCollapsed">Teacher Management</span>
            </router-link>
            <router-link to="/register" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Add Teacher/SSP' : ''">
              <i class="fas fa-user-plus"></i>
              <span v-show="!isSidebarCollapsed">Add Teacher/SSP</span>
            </router-link>
          </template>

          <!-- SSPHead Navigation -->
          <template v-if="isSSPHead">
            <!-- Analytics Category -->
            <div class="nav-category">Analytics</div>
            <router-link to="/ssp-dashboard" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Dashboard' : ''">
              <i class="fas fa-chart-line"></i>
              <span v-show="!isSidebarCollapsed">Dashboard</span>
            </router-link>

            <!-- Management Category -->
            <div class="nav-category">Management</div>
            <router-link to="/register-ssp" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Add Teacher/SSP' : ''">
              <i class="fas fa-user-plus"></i>
              <span v-show="!isSidebarCollapsed">Add SSP Adviser</span>
            </router-link>
            <router-link to="/ssp-management" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Teacher Management' : ''">
              <i class="fas fa-chalkboard-teacher"></i>
              <span v-show="!isSidebarCollapsed">SSP Adviser Management</span>
            </router-link>
          </template>

          <!-- SSP Adviser Navigation -->
          <template v-if="isSSP">
            <!-- Analytics Category -->
            <div class="nav-category">Analytics</div>
            <router-link to="/ssp-dashboard" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Dashboard' : ''">
              <i class="fas fa-chart-line"></i>
              <span v-show="!isSidebarCollapsed">Dashboard</span>
            </router-link>

            <!-- Management Category -->
            <div class="nav-category">Management</div>
            <router-link to="/ssp-student-management" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Student Management' : ''">
              <i class="fas fa-users"></i>
              <span v-show="!isSidebarCollapsed">Student Management</span>
            </router-link>
          </template>

          <!-- Teacher Navigation -->
          <template v-if="isTeacher">
            <!-- Analytics Category -->
            <div class="nav-category">Analytics</div>
            <router-link to="/teacher-dashboard" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Dashboard' : ''">
              <i class="fas fa-chart-line"></i>
              <span v-show="!isSidebarCollapsed">Dashboard</span>
            </router-link>

            <!-- Records Category -->
            <div class="nav-category">Records</div>
            <router-link to="/class-records" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Class Records' : ''">
              <i class="fas fa-book"></i>
              <span v-show="!isSidebarCollapsed">Class Records</span>
            </router-link>
            <router-link to="/attendance" class="nav-item" active-class="active"
              v-tooltip="isSidebarCollapsed ? 'Attendance' : ''">
              <i class="fas fa-clipboard-list"></i>
              <span v-show="!isSidebarCollapsed">Attendance</span>
            </router-link>
          </template>
        </nav>

        <!-- Bottom Section with Profile and Logout -->
        <div class="sidebar-bottom">
          <div class="nav-category">Account</div>
          <router-link to="/profile/view" class="nav-item" active-class="active"
            v-tooltip="isSidebarCollapsed ? 'Profile' : ''">
            <i class="fas fa-user-circle"></i>
            <span v-show="!isSidebarCollapsed">View Profile</span>
          </router-link>
          <router-link to="/profile/edit" class="nav-item" active-class="active"
            v-tooltip="isSidebarCollapsed ? 'Edit Profile' : ''">
            <i class="fas fa-user-edit"></i>
            <span v-show="!isSidebarCollapsed">Edit Profile</span>
          </router-link>
          <router-link to="/profile/password" class="nav-item" active-class="active"
            v-tooltip="isSidebarCollapsed ? 'Change Password' : ''">
            <i class="fas fa-lock"></i>
            <span v-show="!isSidebarCollapsed">Change Password</span>
          </router-link>
          <a @click.prevent="handleLogout" class="nav-item" v-tooltip="isSidebarCollapsed ? 'Logout' : ''">
            <i class="fas fa-sign-out-alt"></i>
            <span v-show="!isSidebarCollapsed">Logout</span>
          </a>
        </div>
      </aside>

      <!-- Main Content Wrapper -->
      <div class="content-wrapper">
        <!-- Page Header -->
        <div class="page-header">
          <div class="d-flex align-items-center">
            <h2 class="page-title">{{ pageTitle }}</h2>
            <div v-if="route.name === 'ClassRecords' || route.name === 'Attendance'" class="ms-3 page-subtitle">
              <span v-if="selectedInfo">of {{ selectedInfo }}</span>
            </div>
          </div>

          <!-- Profile Dropdown -->
          <div class="dropdown">
            <button class="profile-button" type="button" id="profileDropdown" data-bs-toggle="dropdown"
              aria-expanded="false">
              <div class="avatar">
                {{ userInitials }}
              </div>
            </button>
            <ul class="dropdown-menu dropdown-menu-end profile-menu" aria-labelledby="profileDropdown">
              <li class="profile-header">
                <div class="user-name">{{ user?.firstName }} {{ user?.lastName }}</div>
                <div class="user-role">{{ user?.role === 'citHead' ? 'CIT Head' : 'Teacher' }}</div>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li>
                <router-link class="dropdown-item" to="/profile/view">
                  <i class="fas fa-user-circle"></i> View Profile
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/profile/edit">
                  <i class="fas fa-user-edit"></i> Edit Profile
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/profile/password">
                  <i class="fas fa-lock"></i> Change Password
                </router-link>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li>
                <a class="dropdown-item text-danger" href="#" @click.prevent="handleLogout">
                  <i class="fas fa-sign-out-alt"></i> Logout
                </a>
              </li>
            </ul>
          </div>
        </div>

        <!-- Main Content -->
        <main class="main-content">
          <slot></slot>
        </main>
      </div>
    </div>
  </template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'Navigation',
  props: {
    selectedInfo: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const store = useStore()
    const router = useRouter()
    const route = useRoute()

    // State
    const isSidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')

    // Computed
    const user = computed(() => store.state.auth.user)
    const isCITHead = computed(() => store.getters.isCITHead)
    const isTeacher = computed(() => store.getters.isTeacher)
    const isSSP = computed(() => store.getters.isSSP)
    const isSSPHead = computed(() => store.getters.isSSPHead)

    const userInitials = computed(() => {
      if (!user.value) return ''
      return `${user.value.firstName?.charAt(0) || ''}${user.value.lastName?.charAt(0) || ''}`
    })

    const pageTitle = computed(() => {
      const routeName = route.name
      switch (routeName) {
        case 'ClassRecords':
          return 'Class Records'
        case 'Attendance':
          return 'Attendance'
        case 'Dashboard':
          return 'Dashboard'
        case 'TeacherDashboard':
          return 'Dashboard'
        case 'SSPHead Dashboard':
          return 'SPP Head Dashboard'
        case 'StudentManagement':
          return 'Student Management'
        case 'TeacherManagement':
          return 'Teacher Management'
        case 'ViewProfile':
          return 'Profile'
        case 'EditProfile':
          return 'Edit Profile'
        case 'ChangePassword':
          return 'Change Password'
        case 'Register':
          return 'Add Teacher/SSP'
        default:
          return routeName || 'Dashboard'
      }
    })

    // Methods
    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
      localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.value)
    }

    const handleLogout = async () => {
      try {
        await store.dispatch('logout')
        router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }

    return {
      user,
      pageTitle,
      handleLogout,
      isCITHead,
      isTeacher,
      isSSP,
      isSSPHead,
      userInitials,
      isSidebarCollapsed,
      toggleSidebar,
      route
    }
  }
}
</script>

<style scoped>
.navigation-wrapper {
  min-height: 100vh;
  display: flex;
  background: #ffffff;
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  width: 330px;
  height: calc(100vh - 1rem);
  background: #203464;
  color: white;
  display: flex;
  flex-direction: column;
  z-index: 1020;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 18px;
  overflow: visible;
  margin: 0.5rem;
  padding-bottom: 0.5rem;
}

.sidebar.collapsed {
  width: 110px;
}

.sidebar-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  height: 90px;
  position: relative;
  margin-top: 10px;
}

.sidebar-logo {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 50%;
  background: rgb(255, 255, 255);
  transition: all 0.3s ease;
}

.title-container {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sidebar-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
  line-height: 1;
}

.sidebar-subtitle {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.959);
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
  line-height: 1.2;
  letter-spacing: 0.02em;
  margin-top: 5px;
}

.collapse-btn {
  position: absolute;
  right: -16px;
  top: calc(50vh - 16px);
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: 2px solid #203464;
  color: #203464;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1030;
}

.collapse-btn:hover {
  background: #f8fafc;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.collapse-btn i {
  font-size: 0.9rem;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Fix arrow direction */
.collapse-btn i {
  transform: rotate(180deg);
}

.sidebar.collapsed .collapse-btn i {
  transform: rotate(0deg);
}

.collapse-btn::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent, rgba(32, 52, 100, 0.2), transparent);
  animation: rotate 4s linear infinite;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.collapse-btn:hover::before {
  opacity: 1;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.sidebar-nav {
  padding: 0.75rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
  flex: 1;
  position: relative;
  background: #203464;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: rgb(255, 255, 255);
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 500;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-item.active {
  background: rgb(255, 255, 255);
  color: #203464;
  font-weight: 600;
  padding: 2rem 1.5rem;
  margin: 0.75rem 0;
}

/* Create curves for item above active item */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -12px;
  height: 24px;
  background: #203464;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* Create curves for item below active item */
.nav-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -12px;
  height: 24px;
  background: #203464;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

/* First item special case */
.nav-item:first-child.active::before {
  top: -24px;
  height: 36px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

/* Last item special case */
.nav-item:last-child.active::after {
  bottom: -24px;
  height: 36px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* Update padding for collapsed state */
.sidebar.collapsed .nav-item {
  padding: 1rem;
  justify-content: center;
}

.sidebar.collapsed .nav-item.active {
  padding: 2rem 1rem;
}

.nav-item i {
  width: 24px;
  text-align: center;
  font-size: 1.25rem;
  opacity: 1;
}

.nav-item.active i {
  color: #203464;
}

/* Content Wrapper Styles */
.content-wrapper {
  flex: 1;
  margin-left: 330px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  padding: 1rem 1.5rem;
}

.sidebar-collapsed .content-wrapper {
  margin-left: 110px;
}

/* Page Header Styles */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: #203464;
  padding: 1.25rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: white;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
}

/* Profile Button Styles */


.profile-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.avatar {
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.9rem;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  padding: 0.75rem;
  transform-origin: top right;
  animation: dropdown 0.2s ease;
}

.profile-header {
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  margin-bottom: 0.75rem;
}

.user-name {
  font-weight: 500;
  font-size: 0.9rem;
  margin: 0;
}

.user-role {
  font-size: 0.8rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.7;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background: #f8fafc;
  transform: translateX(4px);
}

.dropdown-item i {
  font-size: 0.9rem;
  opacity: 0.7;
  width: 16px;
  text-align: center;
}

.dropdown-divider {
  margin: 0.5rem 0;
  opacity: 0.1;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .sidebar {
    top: 0;
    left: 0;
    height: 100vh;
    border-radius: 0;
    transform: translateX(-100%);
  }

  .sidebar.collapsed {
    transform: translateX(0);
    width: 320px;
  }

  .content-wrapper {
    margin-left: 0 !important;
    padding: 0.75rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}

/* Profile Dropdown Styles */
.dropdown {
  position: relative;
  z-index: 1030;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1030;
  min-width: 240px;
  padding: 0.5rem 0;
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #212529;
  text-align: left;
  background-color: #fff;
  background-clip: padding-box;
  border: 0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.dropdown-menu.show {
  display: block !important;
}

.nav-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1030;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.nav-btn:focus {
  box-shadow: none;
}

.nav-btn::after {
  display: none !important;
}

.profile-menu {
  margin-top: 0.75rem;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 260px;
  padding: 0.5rem 0;
  background: white;
}

.nav-btn {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1030;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.nav-btn:focus {
  box-shadow: none;
}

.nav-btn::after {
  display: none !important;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #4a5568;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f7fafc;
  color: #2d3748;
}

.dropdown-item i {
  width: 20px;
  color: #718096;
}

.text-danger {
  color: #dc3545 !important;
}

.text-danger:hover {
  background-color: #fff5f5 !important;
  color: #dc3545 !important;
}

.text-danger i {
  color: #dc3545 !important;
}

/* Update the collapsed state to hide subtitle */
.sidebar.collapsed .sidebar-subtitle {
  display: none;
}

/* Add category styles */
.nav-category {
  padding: 1rem 1.5rem 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sidebar.collapsed .nav-category {
  display: none;
}

/* Add bottom section styles */
.sidebar-bottom {
  padding: 0.75rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.25rem;
  font-weight: 400;
}
</style> 