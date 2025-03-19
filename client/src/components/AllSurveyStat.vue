<template>
    <div v-if="mySurvey.length">
        <Bar :data="data" :options="options" />
    </div>
    <div  v-else>
        <h4>No data available!</h4>
    </div>
</template>

<script setup>
import axios from 'axios';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from 'chart.js'
import { onMounted, onUnmounted, ref } from 'vue'
import { Bar } from 'vue-chartjs'

// Create axios instance with correct base URL
const api = axios.create({
    baseURL: 'http://localhost:8081/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

const props = defineProps({
    _id: String,
    surveyForm : Array
})
const mySurvey = ref([]);
const data = ref({})

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
onUnmounted(() => {
    mySurvey.value = [];
    data.value = {};
})
onMounted(async () => {
    const surveyResponse = await api.get(`/survey/stats/all`)
    
    mySurvey.value = surveyResponse.data;
    data.value = {
        labels: mySurvey.value?.map(s => s.type + ' Problem') || 'Not available',
        datasets: [
            {
                label: 'Average Score Survey',
                backgroundColor: '#f87979',
                data: mySurvey.value?.map(s => s.average) || []
            },
        ]
    }
})


const options = ref({
    //   responsive: true ,
    //   maintainAspectRatio: false
})

</script>