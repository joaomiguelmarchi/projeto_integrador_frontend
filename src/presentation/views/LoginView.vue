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
            
            <div class="flex justify-end mt-1">
              <a 
                href="#" 
                @click.prevent="openForgotDialog" 
                class="text-sm font-medium text-[var(--p-primary-500)] hover:text-[var(--p-primary-600)] transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>
          </div>

          <Button 
            type="submit" 
            label="Entrar"  
            :loading="loading" 
            class="!border-none !p-[0.85rem] font-semibold !rounded-lg mt-1"
            fluid 
          />
        </form>
      </div>
    </div>

    <Dialog v-model:visible="forgotDialogVisible" :style="{ width: '450px' }" header="Recuperar Senha" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-4 py-4">
            <span class="text-slate-600 text-sm">
                Informe o seu e-mail de cadastro. Enviaremos as instruções para você criar uma nova senha.
            </span>
            <div>
                <label for="recovery-email" class="block font-bold mb-2">E-mail</label>
                <InputText 
                    id="recovery-email" 
                    type="email" 
                    v-model.trim="recoveryEmail" 
                    placeholder="exemplo@email.com" 
                    autofocus 
                    :invalid="recoverySubmitted && !recoveryEmail" 
                    class="w-full" 
                />
                <small v-if="recoverySubmitted && !recoveryEmail" class="text-red-500">
                    Por favor, informe um e-mail válido.
                </small>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeForgotDialog" />
            <Button label="Enviar " icon="pi pi-send" @click="sendRecoveryEmail" :loading="recoveryLoading" />
        </template>
    </Dialog>

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
import Dialog from 'primevue/dialog' // Adicionado import do Dialog

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

// --- FORGOT PASSWORD STATES ---
const forgotDialogVisible = ref(false)
const recoveryEmail = ref('')
const recoverySubmitted = ref(false)
const recoveryLoading = ref(false)

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

// --- FORGOT PASSWORD ACTIONS ---
const openForgotDialog = () => {
    recoveryEmail.value = ''
    recoverySubmitted.value = false
    forgotDialogVisible.value = true
}

const closeForgotDialog = () => {
    forgotDialogVisible.value = false
}

const sendRecoveryEmail = async () => {
    recoverySubmitted.value = true
    
    if (!recoveryEmail.value) return

    recoveryLoading.value = true
    
    try {
        // Aqui você chamaria o seu AuthService, ex: await AuthService.requestPasswordReset(recoveryEmail.value)
        // Simulando delay de rede para feedback visual
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        closeForgotDialog()
        // Opcional: Adicionar um Toast aqui para avisar que o e-mail foi enviado com sucesso
        
    } catch (error) {
        // Tratar erro (ex: e-mail não encontrado)
        console.error(error)
    } finally {
        recoveryLoading.value = false
    }
}
</script>