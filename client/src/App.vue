<template>
  <div class="app">
      <router-view></router-view>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const isLoginPage = computed(() => route.name === 'Login')

    return {
      isLoginPage
    }
  }
}
</script>

<style>
:root {
  --primary-color: #203464;
  --secondary-color: #f8f9fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background: var(--secondary-color);
}

.app {
  min-height: 100vh;
  background-color: var(--secondary-color);
}

/* Global utility classes */
.text-danger {
  color: #dc3545 !important;
}

.text-success {
  color: #28a745 !important;
}

.text-warning {
  color: #ffc107 !important;
}

.text-info {
  color: #17a2b8 !important;
}

.text-muted {
  color: #6c757d !important;
}

/* Form styles */
.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem rgba(32, 52, 100, 0.25);
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.btn-primary:hover {
  background-color: #162544;
  border-color: #162544;
}

/* Table styles */
.table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.table th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
}

/* Card styles */
.card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.card-header {
  background-color: white;
  border-bottom: 1px solid #eee;
  padding: 1.25rem;
}

.card-body {
  padding: 1.5rem;
}
</style> 