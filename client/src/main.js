import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

// Import FontAwesome
import '@fortawesome/fontawesome-free/css/all.css'

// Import Tailwind CSS
import './assets/tailwind.css'

// Import Chart.js
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

// Create and mount the Vue application
const app = createApp(App)

// Use plugins
app.use(router)
app.use(store)

// Mount the app
app.mount('#app') 