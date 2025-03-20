<script setup>
    import axios from 'axios';
    import { nextTick, onMounted, ref, watch, computed } from 'vue';
    import { useRoute } from 'vue-router';
    const URI = 'http://localhost:8000'

    const route = useRoute();

    const mySurvey = ref([]);
    const page = ref(0);
    const intro = ref(true);
    const isStudent = ref(true);
    const consentGiven = ref(false);
    

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
    ]);

    // Check if all questions on the current page have been answered
    const allCurrentPageFieldsCompleted = computed(() => {
        if (page.value < 0 || page.value >= problems.value.length) return false;
        
        // Check if all questions on the current page have a rate property
        return problems.value[page.value].every(prob => prob.rate !== undefined);
    });

    // Check if all questions in all pages have been answered
    const allRequiredFieldsCompleted = computed(() => {
        // Check if every problem in every page has a rate property
        return problems.value.every(page => 
            page.every(prob => prob.rate !== undefined)
        );
    });

    async function refreshButtons(rate, desc) {
        const allButtons = document.querySelectorAll('.rate-btn');
        allButtons.forEach((btn) => {
            // Check if button belongs to questionnaire
            if(btn.name === desc){
                // Check if button selected
                if(btn.id === `${rate} - ${desc}`){
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        });
    }

    function handleClick(type, desc, rate, id) {
        let objIndex = 0;
        objIndex = problems.value[page.value].findIndex(obj => obj.id === id);
        problems.value[page.value][objIndex].rate = rate;
        
        // Update styling for the selected button
        refreshButtons(rate, desc);
    }

    // Add validation before submitting
    const submit = async () => {
        if (!allRequiredFieldsCompleted.value) {
            alert('Please answer all questions before submitting.');
            return;
        }
        
        const _id = route.query.student;
        try {
            const data = await axios.post(`${URI}/api/survey/create`,{
                studentId : _id,
                form : problems.value,
            });
            
            if(data.data){
                alert('Success! Your responses have been submitted.');
                window.location.reload();
            }
            
        } catch (error) {
            console.log(error);
            alert('Server Error. Please try again later.');
        }
    }

    // Add validation before moving to next page
    function next() {
        if (!allCurrentPageFieldsCompleted.value) {
            alert('Please answer all questions before proceeding.');
            return;
        }
        
        page.value = page.value + 1;
        topFunction();
    }

    function prev() {
        page.value = page.value - 1;
        topFunction();
    }

    function topFunction() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    function accept() {
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
    });
</script>

<template>
    <div class="survey-container">
        <!-- Header with logos -->
        <div class="header-logos">
            <img src="@/assets/logo1.png" alt="CIT Logo" class="logo left-logo">
            <div class="university-title">
                <span class="araullo">ARAULLO</span><span class="university">UNIVERSITY</span>
                <div class="subtitle">PHINMA EDUCATION</div>
            </div>
            <img src="@/assets/logo2.png" alt="Araullo Logo" class="logo right-logo">
        </div>

        <!-- Intro Screen -->
        <div v-if="intro && isStudent" class="survey-intro-card">
            <h2 class="intro-title">Student Support & Assessment Form</h2>
            <p class="intro-text">
                Welcome! Your academic progress matters to us. This form will help us understand the challenges you faced so we can support you better. Please answer honestly—your responses will help us provide the right assistance. Let's work together to improve your performance!
            </p>
            
            <div class="privacy-notice">
                <h3 class="privacy-title">Data Privacy Notice</h3>
                <p class="privacy-text">
                    The Republic Act 10173, officially known as the Data Privacy Act of 2012 (DPA), is Philippine's data privacy law, aiming to "to protect the fundamental human right of privacy, of communication while ensuring free flow of information to promote innovation and growth" while also ensuring "that personal information in information and communications systems in the government and in the private sector are secured and protected." The law became enforceable as of September 8, 2012 and the regulating authority, the NPC, was established 4 years later, in 2016. As of September 9, 2016 the NPC published 'Implementing Rules and Regulations of Republic Act No. 10173, known as the Data Privacy Act of 2012,' or the IRR, to help with the understanding of the requirements imposed on covered entities.
                </p>
                
                <div class="consent-checkbox">
                    <input type="checkbox" id="consent-checkbox" v-model="consentGiven">
                    <label for="consent-checkbox">I acknowledge that I have read and understand the Data Privacy Act notice above, and I consent to the collection and processing of my responses.</label>
                </div>
            </div>

            <button @click="accept" type="button" class="continue-btn" :disabled="!consentGiven">Continue</button>
        </div>

        <!-- Survey Content -->
        <main v-if="!intro && isStudent" class="survey-content">
            <!-- Legend -->
            <div class="legend-container">
                <h5 class="section-title">Legend:</h5>
                <div class="legend-items">
                    <div v-for="legend in legends" :key="legend.qt" class="legend-item">
                        <span class="legend-number">{{ legend.qt }}</span> - {{ legend.ql }}
                    </div>
                </div>
            </div>
            
            <div class="survey-section">
                <h5 class="section-title">{{ problems[page].map(p => p.type)[0] }} Factors</h5>
                
                <div v-for="prob in problems[page]" :key="prob.id" class="question-container">
                    <p class="question-text">{{ `${prob.id}. ${prob.desc}` }}</p>
                    <div class="rating-buttons">
                        <button 
                            v-for="legend in legends" 
                            :key="legend.qt"
                            :class="['rate-btn', prob.rate === legend.qt ? 'selected' : '']"
                            @click="handleClick(prob.type, prob.desc, legend.qt, prob.id)" 
                            :id="`${legend.qt} - ${prob.desc}`" 
                            :name="prob.desc"
                            type="button">
                            {{ legend.ql }}
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="navigation-buttons">
                <button 
                    :disabled="page === 0"
                    class="nav-btn prev-btn" 
                    type="button" 
                    @click="prev">
                    <i class="fas fa-chevron-left"></i> Previous
                </button>

                <div class="progress-indicator">
                    <div v-for="(_, index) in problems" :key="index" 
                        :class="['progress-dot', index === page ? 'active' : '']">
                    </div>
                </div>

                <button 
                    v-if="problems.length === page + 1"
                    class="nav-btn submit-btn" 
                    type="button" 
                    @click="submit"
                    :disabled="!allRequiredFieldsCompleted">
                    Submit <i class="fas fa-paper-plane"></i>
                </button>
                <button 
                    v-else
                    class="nav-btn next-btn" 
                    type="button" 
                    @click="next"
                    :disabled="!allCurrentPageFieldsCompleted">
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </main>
    </div>
</template>

<style scoped>
.survey-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding-bottom: 2rem;
    font-family: 'Inter', sans-serif;
}

.header-logos {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 10%;
    background-color: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo {
    height: 80px;
    width: auto;
}

.university-title {
    text-align: center;
    line-height: 1.1;
}

.araullo {
    font-size: 2.5rem;
    font-weight: 700;
    color: goldenrod;
}

.university {
    font-size: 2.5rem;
    font-weight: 700;
    color: #203464;
}

.subtitle {
    font-size: 1.2rem;
    letter-spacing: 2px;
    color: #333;
    margin-top: 0.5rem;
}

/* Intro Screen */
.survey-intro-card {
    width: 90%;
    max-width: 800px;
    margin: 2rem auto;
    background-color: #203464;
    color: white;
    border-radius: 10px;
    padding: 2.5rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.intro-title {
    font-size: 2.2rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
}

.intro-text {
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
}

.privacy-notice {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    text-align: left;
    max-height: 250px;
    overflow-y: auto;
}

.privacy-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.privacy-text {
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1.5rem;
}

.consent-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    margin-top: 1rem;
}

.consent-checkbox input {
    margin-top: 0.3rem;
    cursor: pointer;
    width: 18px;
    height: 18px;
}

.consent-checkbox label {
    font-size: 1rem;
    line-height: 1.4;
}

.continue-btn {
    background-color: #ffd500;
    color: #333;
    border: none;
    padding: 0.8rem 2.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.continue-btn:hover {
    background-color: #f0c800;
    transform: translateY(-2px);
}

.continue-btn:disabled {
    background-color: #cccccc;
    color: #666666;
    cursor: not-allowed;
    transform: none;
}

/* Survey Content */
.survey-content {
    width: 90%;
    max-width: 900px;
    margin: 2rem auto;
    background-color: white;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.legend-container {
    background-color: #f1f5f9;
    padding: 1.2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
}

.section-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #203464;
    margin-bottom: 1rem;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.5rem;
}

.legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}

.legend-item {
    font-size: 1rem;
    display: flex;
    align-items: center;
}

.legend-number {
    font-weight: 600;
    color: #203464;
}

.survey-section {
    margin-bottom: 2rem;
}

.question-container {
    margin-bottom: 2rem;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1.5rem;
}

.question-text {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: #333;
}

.rating-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    justify-content: center;
}

.rate-btn {
    background-color: white;
    border: 2px solid #203464;
    color: #203464;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    font-size: 1rem;
    min-width: 140px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.rate-btn:hover {
    background-color: #203464;
    color: white;
}

.rate-btn.selected {
    background-color: #203464;
    color: white;
    font-weight: 500;
}

.navigation-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
}

.nav-btn {
    background-color: #203464;
    color: white;
    border: none;
    padding: 0.7rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
    background-color: #162950;
    transform: translateY(-2px);
}

.nav-btn:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
}

.submit-btn {
    background-color: #10b981;
}

.submit-btn:hover {
    background-color: #0ea572;
}

.progress-indicator {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #cbd5e1;
    transition: all 0.3s ease;
}

.progress-dot.active {
    background-color: #203464;
    transform: scale(1.3);
}

.required-field-notice {
    color: #ff9800;
    font-size: 0.9rem;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.required-field-notice i {
    font-size: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .header-logos {
        padding: 1rem 5%;
    }

    .logo {
        height: 60px;
    }

    .araullo, .university {
        font-size: 1.8rem;
    }

    .subtitle {
        font-size: 0.9rem;
    }

    .survey-intro-card {
        width: 95%;
        padding: 1.5rem;
    }

    .intro-title {
        font-size: 1.8rem;
    }

    .intro-text {
        font-size: 1rem;
    }

    .survey-content {
        width: 95%;
        padding: 1.5rem;
    }

    .section-title {
        font-size: 1.2rem;
    }

    .question-text {
        font-size: 1rem;
    }

    .rate-btn {
        min-width: 120px;
        font-size: 0.9rem;
        padding: 0.5rem 0.8rem;
    }

    .nav-btn {
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
    }
}
</style>