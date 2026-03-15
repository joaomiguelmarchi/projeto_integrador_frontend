<template>
  <div class="home-wrapper">
    
    <header class="topbar">
      <div class="logo-area">
        <Image :src="logoUrl" alt="Logo SmileHub" width="40" />
        <span class="logo-text" style=" color: #2563eb;" >ODONTOHUB</span>
      </div>
      
      <div class="actions-area">
        <Button 
          icon="pi pi-cog" 
          text 
          rounded 
          severity="secondary" 
          v-tooltip.bottom="'Configurações'" 
          aria-label="Configurações" 
        />
        <Button 
          icon="pi pi-sign-out" 
          text 
          rounded 
          severity="danger" 
          v-tooltip.bottom="'Sair do Sistema'" 
          aria-label="Sair" 
          @click="sair" 
        />
      </div>
    </header>

    <main class="main-content">
      <div class="modules-grid">
        
        <Card 
          v-for="modulo in modulos" 
          :key="modulo.titulo" 
          class="module-card" 
          @click="acessarModulo(modulo.rota)"
        >
          <template #content>
            <div class="card-body">
              <div class="icon-wrapper">
                <i :class="['pi', modulo.icone]"></i>
              </div>
              <h2 class="module-title">{{ modulo.titulo }}</h2>
            </div>
          </template>
        </Card>

      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Image from 'primevue/image'
import logoUrl from '../../assets/LogoAzul.png'

const router = useRouter()
const modulos = ref([
  { titulo: 'Cadastro Paciente', icone: 'pi-users', rota: '/pacientes' },
  { titulo: 'Conta Paciente', icone: 'pi-folder', rota: '/contas' },
  { titulo: 'Orçamento', icone: 'pi-dollar', rota: '/orcamentos' },
  { titulo: 'Agenda', icone: 'pi-calendar', rota: '/agenda' },
  { titulo: 'Faturamento', icone: 'pi-receipt', rota: '/faturamento' },
  { titulo: 'Procedimentos', icone: 'pi-list', rota: '/procedimentos' }
])

const acessarModulo = (rota: string) => {
  router.push(rota)
}

const sair = () => {
  localStorage.removeItem('usuario_logado')
  router.push('/login')
}
</script>

<style scoped>
.home-wrapper {
  min-height: 100vh;
  background-color: var(--p-surface-50);
  display: flex;
  flex-direction: column;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 3rem;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--p-surface-900);
  letter-spacing: -0.5px;
}

.actions-area {
  display: flex;
  gap: 1rem;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center; 
  padding: 2rem;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); 
  gap: 2rem;
  max-width: 900px;
  width: 100%;
}

.module-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background-color: var(--p-surface-0);
  text-align: center;
}

.module-card:hover {
  transform: translateY(-5px);
  border-color: var(--p-primary-color);
  box-shadow: 0 12px 25px rgba(6, 46, 91, 0.141);
}

.card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 0;
  gap: 1rem;
}

.icon-wrapper {
  background-color: var(--p-primary-50);
  color: var(--p-primary-600);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.75rem;
  transition: all 0.3s ease;
}

.module-card:hover .icon-wrapper {
  background-color: var(--p-primary-600);
  color: var(--p-surface-0);
}

.module-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--p-surface-700);
  margin: 0;
}

.icon-wrapper i {
  font-size: 1.5rem !important; 
}

@media (max-width: 900px) {
  .modules-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .modules-grid {
    grid-template-columns: 1fr;
  }
}
</style>