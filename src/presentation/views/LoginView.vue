<template>
  <div class="login-wrapper">
    
    <div class="login-container">
      <div class="header-section">
        <img src="../../assets/LogoBranca.png" alt="SMILEHUB Logo" class="login-logo">
        <h1 class="system-name">SMILEHUB</h1>
      </div>

      <div class="login-card">
        <form @submit.prevent="fazerLogin" class="form-layout">
          <div class="field-group">
            <label for="usuario">Usuário</label>
            <IconField>
              <InputIcon class="pi pi-user" />
              <InputText 
                id="usuario" 
                v-model="usuario" 
                placeholder="Digite seu usuário" 
                :invalid="!!erros.usuario"
                fluid 
              />
            </IconField>
            <Message v-if="erros.usuario" severity="error" variant="simple" size="small">
              {{ erros.usuario }}
            </Message>
          </div>
          
          <div class="field-group">
            <label for="senha">Senha</label>
            <IconField>
              <InputIcon class="pi pi-lock" />
              <Password 
                id="senha" 
                v-model="senha" 
                placeholder="Digite sua senha" 
                :feedback="false" 
                toggleMask 
                :invalid="!!erros.senha"
                fluid 
              />
            </IconField>
            <Message v-if="erros.senha" severity="error" variant="simple" size="small">
              {{ erros.senha }}
            </Message>
          </div>

          <Button 
            type="submit" 
            label="Entrar"  
            :loading="carregando" 
            class="submit-button"
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

const usuario = ref('')
const senha = ref('')
const carregando = ref(false)
const router = useRouter()

const erros = ref({
  usuario: '',
  senha: ''
})

const validar = () => {
  erros.value = { usuario: '', senha: '' }
  let valido = true
  if (!usuario.value.trim()) {
    erros.value.usuario = 'O campo usuário é obrigatório.'
    valido = false
  }
  if (!senha.value) {
    erros.value.senha = 'O campo senha é obrigatório.'
    valido = false
  }
  return valido
}

const fazerLogin = async () => {
  if (!validar()) return
  carregando.value = true

  try {
    await AuthService.login(usuario.value, senha.value)
    localStorage.setItem('usuario_logado', 'true') 
    router.push('/home')

  } catch (error: any) {
    erros.value.usuario = 'Usuário ou senha incorretos.'
    erros.value.senha = 'Usuário ou senha incorretos.'
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at 10% 80%, #bc6cdb 0%, #5d5dcc 40%, #5dabcc 60%,#bc6cdb 100%);
  padding: 2rem;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 440px;
}

.header-section {
  display: flex;
  align-items: center; 
  justify-content: center;
  gap: 1rem;          
  margin-bottom: 2rem;
}

.login-logo {
  width: 50px;         
  height: auto;
}

.system-name {
  color: white;       
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -1px;
}

.login-card {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(2, 24, 71, 0.15);
  width: 100%;
}

.form-layout {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.submit-button {
  border: none !important;
  padding: 0.85rem !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  margin-top: 0.5rem;
}
</style>