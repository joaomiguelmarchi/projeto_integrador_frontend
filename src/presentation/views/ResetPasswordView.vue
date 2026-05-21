<template>
  <div class="flex justify-center items-center min-h-screen bg-[radial-gradient(circle_at_10%_80%,#bc6cdb_0%,#5d5dcc_40%,#5dabcc_60%,#bc6cdb_100%)] p-8">
    <div class="flex flex-col items-center w-full max-w-[440px]">
      
      <div class="flex items-center justify-center gap-4 mb-8">
        <img src="../../assets/LogoBranca.png" alt="SMILEHUB Logo" class="w-[50px] h-auto">
        <h1 class="text-white text-[1.75rem] font-extrabold m-0 tracking-[-1px]">SMILEHUB</h1>
      </div>

      <div class="bg-white p-12 rounded-[16px] shadow-[0_10px_25px_rgba(2,24,71,0.15)] w-full">
        <form @submit.prevent="handleResetPassword" class="flex flex-col gap-5">
          
          <div class="text-center mb-2">
            <h2 class="text-xl font-bold text-slate-800 m-0">Nova Senha</h2>
            <p class="text-sm text-slate-500 mt-1">Crie uma nova credencial de acesso para sua conta.</p>
          </div>

          <Message v-if="globalError" severity="error" :closable="false" class="m-0">
            {{ globalError }}
          </Message>

          <Message v-if="globalSuccess" severity="success" :closable="false" class="m-0">
            {{ globalSuccess }}
          </Message>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-semibold text-slate-700">Nova Senha</label>
            <IconField>
              <InputIcon class="pi pi-lock" />
              <Password 
                id="password" 
                v-model="password" 
                placeholder="Digite sua nova senha" 
                toggleMask 
                :invalid="!!errors.password"
                fluid 
                promptLabel="Escolha uma senha segura"
                weakLabel="Fraca"
                mediumLabel="Média"
                strongLabel="Forte"
              />
            </IconField>
            <Message v-if="errors.password" severity="error" variant="simple" size="small">
              {{ errors.password }}
            </Message>
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="confirmPassword" class="text-sm font-semibold text-slate-700">Confirmar Senha</label>
            <IconField>
              <InputIcon class="pi pi-lock" />
              <Password 
                id="confirmPassword" 
                v-model="confirmPassword" 
                placeholder="Digite a senha novamente" 
                :feedback="false" 
                toggleMask 
                :invalid="!!errors.confirmPassword"
                fluid 
              />
            </IconField>
            <Message v-if="errors.confirmPassword" severity="error" variant="simple" size="small">
              {{ errors.confirmPassword }}
            </Message>
          </div>

          <Button 
            type="submit" 
            label="Atualizar Senha"  
            :loading="loading" 
            :disabled="!!globalSuccess"
            class="!border-none !p-[0.85rem] font-semibold !rounded-lg mt-2"
            fluid 
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
// import { AuthService } from '../../infrastructure/services/AuthService'

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const token = ref('')
const router = useRouter()
const route = useRoute()

// --- ESTADOS DE ERRO E SUCESSO ---
const errors = ref({
  password: '',
  confirmPassword: ''
})
const globalError = ref('')
const globalSuccess = ref('')

// --- RECOVERY VALIDATION TOKEN ---
onMounted(() => {
  // Captura o token passado na URL (Ex: /redefinir-senha?token=xyz123)
  const queryToken = route.query.token
  if (queryToken) {
    token.value = queryToken.toString()
  } else {
    globalError.value = 'Token de redefinição inválido ou ausente. Solicite um novo link.'
  }
})

const validateForm = () => {
    errors.value = { password: '', confirmPassword: '' }
    let isValid = true
  
  if (!password.value) {
    errors.value.password = 'O campo nova senha é obrigatório.'
    isValid = false
  } else if (password.value.length < 6) {
    errors.value.password = 'A senha deve conter no mínimo 6 caracteres.'
    isValid = false
  }

  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'A confirmação de senha é obrigatória.'
    isValid = false
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'As senhas informadas não coincidem.'
    isValid = false
  }

  if (!token.value) {
    globalError.value = 'Não é possível prosseguir sem um token de validação válido.'
    isValid = false
  }

  return isValid
}

// --- SUBMISSÃO ---
const handleResetPassword = async () => {
  globalError.value = ''
  globalSuccess.value = ''
  
  if (!validateForm()) return

  loading.value = true

  try {
    // const result = await AuthService.resetPassword(token.value, password.value)
    
    // Simulando uma requisição com sucesso temporariamente:
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    globalSuccess.value = 'Sua senha foi alterada com sucesso! Redirecionando para a tela de login...'
    
    setTimeout(() => {
      router.push('/login')
    }, 3000)

  } catch (error: any) {
    globalError.value = error.response?.data?.error?.message || 'Erro ao processar a alteração. Tente novamente mais tarde.'
  } finally {
    loading.value = false
  }
}
</script>