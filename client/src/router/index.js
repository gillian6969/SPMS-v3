import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

// Import components
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import RegisterSSP from '../views/RegisterSSP.vue'
import Dashboard from '../views/Dashboard.vue'
import TeacherDashboard from '../views/TeacherDashboard.vue'
import SSPHeadDashboard from '@/views/SSPHeadDashboard.vue'
import StudentManagement from '../views/StudentManagement.vue'
import ClassRecords from '../views/ClassRecords.vue'
import Attendance from '../views/Attendance.vue'
import ViewProfile from '@/views/ViewProfile.vue'
import EditProfile from '@/views/EditProfile.vue'
import ChangePassword from '@/views/ChangePassword.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import TeacherManagement from '../views/TeacherManagement.vue'
import SSPManagement from '../views/SSPManagement.vue'
import FailingStudents from '../views/FailingStudents.vue'
import SurveyForm from '../views/SurveyForm'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },
  {
    path : '/survey',
    name : 'Survey',
    component: SurveyForm,
  },
  {
    path: '/',
    component: DashboardLayout,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true, citHeadOnly: true }
      },
      {
        path: 'register',
        name: 'Register',
        component: Register,
        meta: { requiresAuth: true, citHeadOnly: true }
      },
      {
        path: 'register-ssp',
        name: 'Register SSP',
        component: RegisterSSP,
        meta: { requiresAuth: true, citHeadOnly: true }
      },
      {
        path: 'teacher-dashboard',
        name: 'TeacherDashboard',
        component: TeacherDashboard,
        meta: { requiresAuth: true, teacherOnly: true }
      },
      {
        path: 'ssp-dashboard',
        name: 'SSPHead Dashboard',
        component: SSPHeadDashboard,
        meta: { requiresAuth: true, sspOnly : true }
      },
      {
        path: 'student-management',
        name: 'StudentManagement',
        component: StudentManagement,
        meta: { requiresAuth: true, citHeadOnly: true }
      },
      {
        path: 'class-records',
        name: 'ClassRecords',
        component: ClassRecords,
        meta: { requiresAuth: true, teacherOnly: true }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: Attendance,
        meta: { requiresAuth: true, teacherOnly: true }
      },
      {
        path: 'profile/view',
        name: 'ViewProfile',
        component: ViewProfile,
        meta: { requiresAuth: true }
      },
      {
        path: 'profile/edit',
        name: 'EditProfile',
        component: EditProfile,
        meta: { requiresAuth: true }
      },
      {
        path: 'profile/password',
        name: 'ChangePassword',
        component: ChangePassword,
        meta: { requiresAuth: true }
      },
      {
        path: 'teacher-management',
        name: 'TeacherManagement',
        component: TeacherManagement,
        meta: { requiresAuth: true, roles: ['citHead'] }
      },
      {
        path: 'ssp-management',
        name: 'SSPManagement',
        component: SSPManagement,
        meta: { requiresAuth: true, roles: ['citHead'] }
      },
      {
        path: 'ssp-student-management',
        name: 'SSPStudentManagement',
        component: FailingStudents,
        meta: { requiresAuth: true, roles: ['citHead'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  const isLoggedIn = store.getters.isLoggedIn
  const isCITHead = store.getters.isCITHead
  const isTeacher = store.getters.isTeacher
  const isSSP = store.getters.isSSP
  const isSSPHead = store.getters.isSSPHead

  // Routes that require authentication 
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isLoggedIn) {
      next('/login')
      return
    }
    
    // // CIT Head only routes
    // if (to.matched.some(record => record.meta.citHeadOnly) && !isCITHead && !isSSP) {
    //   next('/teacher-dashboard')
    //   return
    // }

    // // Teacher only routes
    // if (to.matched.some(record => record.meta.teacherOnly) && !isTeacher) {
    //   next('/dashboard')
    //   return
    // }

    // // SSP only routes
    // if (to.matched.some(record => record.meta.sspOnly) && !isTeacher && !isCITHead) {
    //   next('/ssp-dashboard')
    //   return
    // }
  }

  // Routes for guests only (login, register)
  if (to.matched.some(record => record.meta.guest)) {
    if (isLoggedIn) {
      if (isCITHead) {
        next('/dashboard')
      } else if (isTeacher) {
        next('/teacher-dashboard')
      } else if(isSSPHead) {
        next('/ssp-dashboard')
      }
      return
    }
  }

  // Redirect to appropriate dashboard after login
  if (to.path === '/dashboard') {
    if (isTeacher) {
      next('/teacher-dashboard')
      return
    } else if (isSSPHead) {
      next('/ssp-dashboard')
      return
    }
  }

  next()
})

export default router 