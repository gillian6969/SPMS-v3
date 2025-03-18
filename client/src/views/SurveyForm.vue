<script setup>
    import axios from 'axios';
    import { nextTick, onMounted, ref, watch } from 'vue';
    import { useRoute } from 'vue-router';
    const URI = 'http://localhost:8000'

    const route = useRoute();

    const mySurvey = ref([]);
    const page = ref(0);
    const intro = ref(true);
    const isStudent = ref(true)
    

    const legends = ref([
        { qt : 5, ql : 'Most Likely' },
        { qt : 4, ql : 'Likely' },
        { qt : 3, ql : 'Nuetral' }, 
        { qt : 2, ql : 'Unlikely' }, 
        { qt : 1, ql : 'Least Unlikely' }
    ]);

    const personals = [
        {
            id : 1,
            desc : 'I struggle to manage my time between school and personal responsibilities.',
            type : 'Personal'
        },
        {
            id : 2,
            desc : 'I often experience stress and anxiety that impacts my academic performance.',
            type : 'Personal'
        },
        {
            id : 3,
            desc : 'I find it difficult to stay motivated when facing personal challenges.',
            type : 'Personal'
        },
        {
            id : 4,
            desc : 'I struggle with maintaining healthy sleep habits due to school demands.',
            type : 'Personal'
        },
        {
            id : 5,
            desc : 'I find it hard to communicate my feelings when overwhelmed with academic stress.',
            type : 'Personal'
        }

    ];

    const financials = [
        {
            id : 1,
            desc : 'I face difficulties affording necessary learning materials and resources.',
            type : 'Financial'
        },
        {
            id : 2,
            desc : 'Financial struggles often prevent me from participating in school activities.',
            type : 'Financial'
        },
        {
            id : 3,
            desc : 'I have skipped meals or basic needs due to financial concerns',
            type : 'Financial'
        },
        {
            id : 4,
            desc : 'I find it challenging to manage my budget for school-related expenses.',
            type : 'Financial'
        },
        {
            id : 5,
            desc : 'I worry about financial stability affecting my academic focus',
            type : 'Financial'
        }
    ];

    const acadProblems = [
        {
            id : 1,
            desc : 'I often struggle to understand difficult lessons or concepts.',
            type : 'Academic'
        },
        {
            id : 2,
            desc : 'I have difficulty keeping up with class discussions and activities.',
            type : 'Academic'
        },
        {
            id : 3,
            desc : 'I find it challenging to complete assignments on time.',
            type : 'Academic'
        },
        {
            id : 4,
            desc : 'I struggle to balance multiple academic tasks effectively.',
            type : 'Academic'
        },
        {
            id : 5,
            desc : 'I often feel unprepared for quizzes, exams, or major projects.',
            type : 'Academic'
        }
    ];

    const distractions = [
        {
            id : 1,
            desc : 'I get easily distracted by my phone or social media during study time.',
            type : 'Distraction'
        },
        {
            id : 2,
            desc : 'Noisy environments make it difficult for me to concentrate on schoolwork.',
            type : 'Distraction'
        },
        {
            id : 3,
            desc : 'I frequently procrastinate on important academic tasks.',
            type : 'Distraction'
        },
        {
            id : 4,
            desc : 'I struggle to stay focused while working on long-term projects.',
            type : 'Distraction'
        },
        {
            id : 5,
            desc : 'I often prioritize entertainment over academic responsibilities.',
            type : 'Distraction'
        }
    ];

    const problems = ref([
        personals,
        financials,
        acadProblems,
        distractions
    ])
  

    async function refreshButtons(rate, desc) {
        const allButtons = document.querySelectorAll('.rate-btn');
        allButtons.forEach((btn) => {
            // Check if button belong to questionnaire
            if(btn.name === desc){
                // Check if button selected
                if(btn.id === `${rate} - ${desc}`){
                    btn.classList.add('bg-[#203464]');
                    btn.classList.add('text-white');
                }else{
                    btn.classList.remove('bg-[#203464]'); 
                    btn.classList.remove('text-white');
                }
            }
        })
    }

    function handleClick(type, desc, rate, id){
        //Find index of specific object using findIndex method.    
        let objIndex = 0;
        objIndex = problems.value[page.value].findIndex(obj => obj.id === id);
        //Update object's name property.
        problems.value[page.value][objIndex].rate = rate

        // Check if rate exists, it will only update the rate
        // if(mySurvey.value.filter(s => s.id === id && s.type === type).length){
        //     mySurvey.value = mySurvey.value.filter(s => s.id === id && s.type === type)
        //     .map((data) => {
        //         return{
        //             ...data,
        //             type : type,
        //             desc : desc,
        //             rate : rate
        //         }
        //     })
        // }else{
        //     mySurvey.value.push({
        //         type : type,
        //         desc : desc,
        //         rate : rate,
        //         id : id
        //     })
        // }

        // refreshButtons(rate, desc)
    }

    const submit = async () => {
        const _id = route.query.student;
        try {
            const data = await axios.post(`${URI}/api/survey/create`,{
                studentId : _id,
                form : problems.value,
            })
            
            if(data.data){
                alert('Success');
                window.location.reload();
            }
            
        } catch (error) {
            console.log(error)
            alert('Server Error')
        }
        

        
    }

    function next(){
        page.value = page.value + 1;
        topFunction()
    }

    function prev(){
        page.value = page.value - 1;
        topFunction()
    }

    // When the user clicks on the button, scroll to the top of the document
    function topFunction() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }

    function accept(){
        intro.value = false;
        nextTick();
    }

    onMounted(async () => {
        try {
            const _id = route.query.student;
            const surveyId = route.query.survey;
            await axios.get(`${URI}/api/survey/`, {
                params : {
                    _id : _id 
                }
            }).then((res) => {
                if(res.data?.studentSurvey){
                    if(res.data?.studentSurvey.filter(s => s._id === surveyId && s.submitted === true).length){
                        alert('Survey Already Submitted');
                        isStudent.value = false
                    }
                    
                }
            })
        } catch (error) {
            isStudent.value = false
            alert('Student not found');
        }
    })

    
</script>

<template>
    <!-- Header -->
    <div class="bg-[#203464] p-5">
        <h2 class="text-4xl font-semibold text-white">Survey</h2>
    </div>

    <!-- Intro -->
     <div v-if="intro && isStudent" class="md:w-4/12 w-10/12 mt-9 text-white bg-[#203464] container-xl p-9 text-center rounded-md">
        <h2 class="text-3xl">Student Support & Assessment Form</h2>
        <p class="text-md">
            Welcome! Your academic progress matters to us. This form will help us understand the challenges you faced so we can support you better. Please answer honestly - your responses will help us provide the right assisstance. Let's work together to improve your performance!
        </p>

        <button @click="accept" type="button" class="bg-yellow-500 text-black md:w-3/12 w-5/12 mt-6 rounded-md">Continue</button>
     </div>

    <!-- Content -->
     <main v-if="!intro && isStudent" class="p-5 text-md md:text-2xl container-xl">
        <!-- Legend -->
         <h5 class="font-semibold text-xl md:text-2xl">Legend : </h5>
         <ul class="pl-3" v-for="legend in legends">
            <li class="md:text-lg">{{ legend.qt }} - {{ legend.ql }}</li>
         </ul>
         <h5 class="font-semibold text-xl md:text-2xl mt-6">{{ problems[page].map(p => p.type)[0] }}</h5>
         <div v-for="prob in problems[page]" :key="prob.id" class="">
            <p class="md:text-lg">{{ `${prob.id}. ${prob.desc}` }}</p>
            <div class="flex md:gap-6 gap-3 p-4 flex-wrap">
                <div class="" v-for="legend in legends" :key="legend.qt">
                    <button 
                    v-bind:class="`${prob.rate === legend.qt && 'bg-[#203464] text-white'} p-1 md:text-lg outline-2 outline-offset-2 outline-[#203464] outline-double w-35 md:w-40 hover:bg-[#203464] hover:text-white rounded-xl rate-btn`"
                    @click="handleClick(prob.type, prob.desc, legend.qt, prob.id)" 
                    :id="`${legend.qt} - ${prob.desc}`" 
                    :name="prob.desc"
                    type="button">
                        {{ legend.ql }}
                    </button>
                </div>
            </div>
         </div>
         
<!-- 
         <h5 class="font-semibold mt-8">Financial Problems</h5>
         <div v-for="financial in financials">
            <p class="text-lg">{{ `${financial.id}. ${financial.desc}` }}</p>
            <div class="flex gap-8 p-4 flex-wrap">
                <div class="flex" v-for="legend in legends">
                    <button 
                    class="p-1 text-lg outline-2 outline-offset-2 outline-[#203464] outline-double w-48 hover:bg-[#203464] hover:text-white rounded-xl rate-btn"
                    @click="handleClick(financial.type, financial.desc, legend.qt, financial.id)" 
                    :id="`${legend.qt} - ${financial.desc}`" 
                    :name="financial.desc"
                    type="button">
                        {{ legend.ql }}
                    </button>
                </div>
            </div>
         </div> -->
         
         <div class="flex justify-between">
            <button 
            :disabled="page === 0"
            class="bg-[#203464] text-white p-2 text-lg rounded-lg mt-5 justify-center disabled:bg-[#4067c2]" 
            type="button" 
            @click="prev"><< Prev</button>

            <div v-if="problems.length === page + 1">
                <button class="bg-[#203464] text-white p-2 text-lg rounded-lg mt-5 justify-center" type="button" @click="submit">Submit</button>
            </div>
            <button 
            v-else
            :disabled="problems.length === page + 1"
            class="bg-[#203464] text-white p-2 text-lg rounded-lg mt-5 justify-center disabled:bg-[#4067c2]" 
            type="button" 
            @click="next">Next >></button>

            
         </div>
     </main>
</template>