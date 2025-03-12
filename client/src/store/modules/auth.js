import axios from 'axios'

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null
}

const getters = {
  isLoggedIn: state => !!state.token,
  currentUser: state => state.user,
  isCITHead: state => state.user?.role === 'citHead',
  isTeacher: state => state.user?.role === 'teacher',
  isSSP: state => state.user?.role === 'ssp'
}

const actions = {
  async login({ commit }, credentials) {
    try {
      console.log('Making login request with:', { ...credentials, password: '****' })
      const response = await axios.post('http://localhost:8000/api/auth/login', credentials)
      console.log('Login response:', response.data)
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      commit('SET_TOKEN', token)
      commit('SET_USER', user)
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return response
    } catch (error) {
      console.error('Login error in store:', error.response || error)
      // Clear any partial state on error
      commit('SET_TOKEN', null)
      commit('SET_USER', null)
      throw error
    }
  },

  logout({ commit }) {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Clear state
    commit('SET_TOKEN', null)
    commit('SET_USER', null)

    // Remove axios default header
    delete axios.defaults.headers.common['Authorization']
  },

  async updateProfile({ commit }, userData) {
    try {
      const response = await axios.put('http://localhost:8000/api/users/profile', userData)
      const updatedUser = response.data

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser))

      // Update state
      commit('SET_USER', updatedUser)

      return response
    } catch (error) {
      throw error
    }
  }
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER(state, user) {
    state.user = user
  }
}

export default {
  state,
  getters,
  actions,
  mutations
} 