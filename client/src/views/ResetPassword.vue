<script setup>
import axios from 'axios';
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute();

const password = ref("")
const newPassword = ref("")
const _id = ref("")

onMounted(() => {
    _id.value = route.query.student;
})

const submit = () => {
    if(password.value !== newPassword.value){
        alert('Passwords do not match!')
        return
    }
    if(newPassword.value.length <= 7){
        alert('Minimum of 8 characters')
        return
    }

    axios.put('http://localhost:8000/api/users/profile/password/reset',{
        _id : _id.value,
        password : newPassword.value
    })
    .then((res) => {
        alert('Sucess!')
        router.push({ path: '/login' })
    })
    .catch(() => {
        alert('User not found!')
    })
}

</script>

<template>
    <div class="md:w-4/12 w-10/12 mt-9 text-white bg-[#203464] container-xl p-9 text-center rounded-md grid justify-center">
        <h2 class="text-3xl">Update your password</h2>
        <div class="grid mt-10">
            <!-- <label class="text-left" for="">Enter your Email Address</label> -->
            <input type="password" name="" v-model="password" placeholder="New Password" class="rounded-md text-black" style="color: black;">
            <input type="password" name="" v-model="newPassword" placeholder="Confirm New Password" class="rounded-md text-black mt-3"style="color: black;">
        </div>

        <button @click="submit" type="button" class="bg-yellow-500 text-black md:w-3/12 w-5/12 mt-6 rounded-md p-2">Submit</button>
    </div>
</template>