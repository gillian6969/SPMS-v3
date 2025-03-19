<script setup>
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router'
const router = useRouter()

const email = ref("")

const submit = () => {
    axios.post('http://localhost:8000/api/users/profile/password/send',{
        email : email.value
    })
    .then((res) => {
        alert('Email was sent to your email address.')
        router.push({ path: '/login' })
    })
    .catch(() => {
        alert('User not found!')
    })
}

</script>

<template>
    <div class="md:w-4/12 w-10/12 mt-9 text-white bg-[#203464] container-xl p-9 text-center rounded-md grid justify-center">
        <h2 class="text-3xl">Forgot Password</h2>
        <div class="grid mt-10">
            <!-- <label class="text-left" for="">Enter your Email Address</label> -->
            <input type="email" name="" v-model="email" value="" placeholder="Email Address" class="rounded-md text-black">
        </div>

        <button @click="submit" type="button" class="bg-yellow-500 text-black md:w-3/12 w-5/12 mt-6 rounded-md p-2">Submit</button>
    </div>
</template>