<template>
<Bar :data="data" :options="options"/>
</template>

<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { ref } from 'vue'
import { Bar } from 'vue-chartjs'

const props = defineProps({
    assessments : Array,
    studentId : String, // Student number eg. 02-124451-11
    _id : String,
})

const myAssessments = ref([])
props.assessments.map((assess) => {
    Object.entries(assess?.scores).forEach(([id, score]) => {
        if(id === props.studentId){
            myAssessments.value.push({
                ...assess,
                scores : score
            })
            return;
        }else{
            
        }
    })
})

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const options = ref({
//   responsive: true,
//   maintainAspectRatio: false
})

const data = ref({
    labels: myAssessments.value.map(a => `${a.subject} (${a.type})`),
    datasets :[
        {
          label: 'Max Score',
          backgroundColor: '#ef4444',
          data: myAssessments.value.map(a => a.maxScore)
        },
        {
          label: "Student's Score",
          backgroundColor: '#10b981',
          data: myAssessments.value.map(a => a.scores)
        }
    ]

})
</script>