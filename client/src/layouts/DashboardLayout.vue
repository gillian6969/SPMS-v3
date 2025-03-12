<template>
  <Navigation :selected-info="selectedInfo">
    <router-view></router-view>
  </Navigation>
</template>

<script>
import Navigation from '../components/Navigation.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DashboardLayout',
  components: {
    Navigation
  },
  setup() {
    const store = useStore()

    const selectedInfo = computed(() => {
      const selectedYear = localStorage.getItem('selectedYear')
      const selectedSection = localStorage.getItem('selectedSection')
      const selectedSubject = localStorage.getItem('selectedSubject')

      if (selectedYear && selectedSection && selectedSubject) {
        return `${selectedYear} - ${selectedSection} - ${selectedSubject}`
      }
      return ''
    })

    return {
      selectedInfo
    }
  }
}
</script>

<style scoped>
/* No styles needed as they are handled by the Navigation component */
</style> 