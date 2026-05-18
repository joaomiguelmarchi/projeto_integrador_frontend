<template>
  <div class="flex justify-center items-center min-h-screen bg-[radial-gradient(circle_at_10%_80%,#bc6cdb_0%,#5d5dcc_40%,#5dabcc_60%,#bc6cdb_100%)] p-8">
    <div class="flex flex-col items-center w-full max-w-[440px]">
      
      <div class="flex items-center justify-center gap-4 mb-8">
        <img src="../../assets/LogoBranca.png" alt="SMILEHUB Logo" class="w-[50px] h-auto">
        <h1 class="text-white text-[1.75rem] font-extrabold m-0 tracking-[-1px]">SMILEHUB</h1>
      </div>

      <div class="bg-white p-12 rounded-[16px] shadow-[0_10px_25px_rgba(2,24,71,0.15)] w-full">
        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
          
          <Message v-if="globalError" severity="error" :closable="false" class="m-0">
            {{ globalError }}
          </Message>

          <div class="flex flex-col gap-2">
            <label for="username" class="text-sm font-semibold text-slate-700">Usuário</label>
            <IconField>
              <InputIcon class="pi pi-user" />
              <InputText 
                id="username" 
                v-model="username" 
                placeholder="Digite seu usuário" 
                :invalid="!!errors.username"
                fluid 
              />
            </IconField>
            <Message v-if="errors.username" severity="error" variant="simple" size="small">
              {{ errors.username }}
            </Message>
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-semibold text-slate-700">Senha</label>
            <IconField>
              <InputIcon class="pi pi-lock" />
              <Password 
                id="password" 
                v-model="password" 
                placeholder="Digite sua senha" 
                :feedback="false" 
                toggleMask 
                :invalid="!!errors.password"
                fluid 
              />
            </IconField>
            <Message v-if="errors.password" severity="error" variant="simple" size="small">
              {{ errors.password }}
            </Message>
          </div>

          <Button 
            type="submit" 
            label="Entrar"  
            :loading="loading" 
            class="!border-none !p-[0.85rem] font-semibold !rounded-lg mt-2"
            fluid 
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { AuthService } from '../../infrastructure/services/AuthService' 
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

// --- STATES ---
const username = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

// --- ERROR STATES ---
const errors = ref({
  username: '',
  password: ''
})
const globalError = ref('')

// --- VALIDATION LOGIC ---
const validateForm = () => {
  errors.value = { username: '', password: '' }
  let isValid = true
  
  if (!username.value.trim()) {
    errors.value.username = 'O campo usuário é obrigatório.'
    isValid = false
  }
  if (!password.value) {
    errors.value.password = 'O campo senha é obrigatório.'
    isValid = false
  }
  return isValid
}

// --- LOGIN ACTIONS ---
const handleLogin = async () => {
  globalError.value = '';
  
  if (!validateForm()) return;

  loading.value = true;

  try {
    const result = await AuthService.login(username.value, password.value);
    
    if (result.sucesso) {
      localStorage.setItem('usuario_logado', 'true');
      router.push('/home');
    } else {
      globalError.value = result.mensagem;
    }
  } catch (error: any) {
    globalError.value = 'Erro de comunicação com o servidor. Tente novamente mais tarde.';
  } finally {
    loading.value = false;
  }
}
</script>