<template>
    <Toast :pt="{
      root: { class: 'w-full max-w-[400px]' },
      message: { class: 'bg-[var(--p-surface-0)] rounded-2xl shadow-md border border-[var(--p-surface-200)]' },
      content: { class: 'p-0' }, /* Remove o padding padrão para controlarmos no slot */
      text: { class: 'w-full' }, /* Garante que o conteúdo ocupe todo o espaço */
      icon: { class: 'hidden' }, /* Oculta o ícone padrão do PrimeVue */
      closeButton: { class: 'hidden' } /* Oculta o botão de fechar padrão */
  }">
    <template #message="{ message }">
      <div class="flex items-start gap-4 p-4 w-full">
        
        <i v-if="message.severity !== 'error'" 
          class="pi text-2xl mt-0.5 text-[var(--p-primary-500)]"
          :class="message.severity === 'success' ? 'pi-check-circle' : 'pi-info-circle'">
        </i>

        <div class="flex flex-col flex-1 gap-1">
          <span class="font-bold text-base" 
                :class="message.severity === 'error' ? 'text-red-500' : 'text-[var(--p-surface-800)]'">
            {{ message.summary }}
          </span>
          <span class="text-sm" 
                :class="message.severity === 'error' ? 'text-red-500' : 'text-[var(--p-surface-600)]'">
            {{ message.detail }}
          </span>
        </div>        
      </div>
    </template>
  </Toast>
  <div class="flex justify-center items-center min-h-screen bg-[radial-gradient(circle_at_10%_80%,#bc6cdb_0%,#5d5dcc_40%,#5dabcc_60%,#bc6cdb_100%)] p-8">
    <div class="flex flex-col items-center w-full max-w-[440px]">
      
      <AppBrand variant="white" container-class="flex items-center justify-center gap-4 mb-8" logo-class="w-[40px] h-auto" />

      <div class="bg-[var(--p-surface-0)] p-12 rounded-[16px] shadow-[0_10px_25px_rgba(2,24,71,0.15)] w-full">
        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">

          <div class="flex flex-col gap-2">
            <label for="username" class="text-sm font-semibold text-slate-700">Email</label>
            <IconField>
              <InputIcon class="pi pi-envelope" />
              <InputText 
                id="username" 
                v-model="username" 
                placeholder="Digite seu email" 
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
import Dialog from 'primevue/dialog' 
import AppBrand from '../components/AppBrand.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

// --- STATES ---
const username = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()
const toast = useToast()

// --- ERROR STATES ---
const errors = ref({
  username: '',
  password: ''
})

// --- FORGOT PASSWORD STATES ---
const forgotDialogVisible = ref(false)
const recoveryEmail = ref('')
const recoverySubmitted = ref(false)
const recoveryLoading = ref(false)

// --- VALIDATION LOGIC ---
const validateForm = () => {
  errors.value = { username: '', password: '' }
  let isValid = true
  
  // Regex simples para validação de formato de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!username.value.trim()) {
    errors.value.username = 'O campo email é obrigatório.'
    isValid = false
  } else if (!emailRegex.test(username.value)) {
    errors.value.username = 'Por favor, insira um e-mail válido.'
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
  
  if (!validateForm()) return;

  loading.value = true;

  try {
    const result = await AuthService.login(username.value, password.value);
    
    if (result.sucesso) {
      AuthService.saveSession(result.data);
      router.push('/inicio');
    } else {
      toast.add({ 
        severity: 'error', 
        summary: 'Erro de Autenticação', 
        detail: result.mensagem || 'Não foi possível realizar o login.', 
        life: 5000 
      });
    }
  } catch (error: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Erro de Conexão', 
      detail: 'Erro de comunicação com o servidor. Tente novamente mais tarde.', 
      life: 5000 
    });
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
        // await AuthService.requestPasswordReset(recoveryEmail.value)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        closeForgotDialog()
        toast.add({ 
          severity: 'success', 
          summary: 'E-mail enviado', 
          detail: 'As instruções de recuperação foram enviadas para seu e-mail.', 
          life: 5000 
        });
        
    } catch (error) {
        toast.add({ 
          severity: 'error', 
          summary: 'Erro', 
          detail: 'Não foi possível enviar o e-mail de recuperação.', 
          life: 5000 
        });
    } finally {
        recoveryLoading.value = false
    }
}
</script>
