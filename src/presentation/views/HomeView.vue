<template>
  <div class="min-h-screen bg-[var(--p-surface-100)] flex flex-col">
    <header class="flex justify-between items-center px-6 py-5 md:px-12 md:py-6">
      <AppBrand />

      <div class="flex gap-4">
        <Button 
          icon="pi pi-cog" 
          text 
          rounded 
          severity="secondary" 
          v-tooltip.bottom="'Configuration'" 
          aria-label="Configuration" 
        />
        <Button 
          icon="pi pi-sign-out" 
          text 
          rounded 
          severity="danger" 
          v-tooltip.bottom="'Logout'" 
          aria-label="Logout" 
          @click="logout" 
        />
      </div>
    </header>

    <main class="flex-1 flex justify-center items-center p-8">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[900px] w-full">
        <Card 
          v-for="item in modules" 
          :key="item.title" 
          class="group cursor-pointer text-center border-2 border-transparent bg-[var(--p-surface-0)] shadow-[0_12px_25px_rgba(12,62,119,0.1)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--p-primary-color)] hover:shadow-[0_12px_25px_rgba(6,46,91,0.141)]" 
          @click="accessModule(item.route)"
        >
          <template #content>
            <div class="flex flex-col items-center py-6 gap-4">
              <div class="w-16 h-16 rounded-full flex justify-center items-center bg-[var(--p-primary-50)] text-[var(--p-primary-600)] transition-all duration-300 group-hover:bg-[var(--p-primary-600)] group-hover:text-[var(--p-surface-0)]">
                <i :class="['pi', item.icon, '!text-2xl']"></i>
              </div>
              <h2 class="text-[1.1rem] font-semibold text-[var(--p-surface-700)] m-0">{{ item.title }}</h2>
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
import AppBrand from '../components/AppBrand.vue'
import { AuthService } from '../../infrastructure/services/AuthService'

const router = useRouter()
const modules = ref([
  { title: 'Cadastro de Paciente', icon: 'pi-users', route: '/cadastroPaciente' },
  { title: 'Conta Paciente', icon: 'pi-folder', route: '/patientAcount' },
  { title: 'Orçamento', icon: 'pi-dollar', route: '/orcamento' },
  { title: 'Agenda', icon: 'pi-calendar', route: '/schedule' },
  { title: 'Faturamento', icon: 'pi-receipt', route: '/billing' },
  { title: 'Procedimentos', icon: 'pi-list', route: '/procedimentos' }
])

const accessModule = (route: string) => {
  router.push(route)
}

const logout = () => {
  AuthService.logout()
  router.push('/login')
}
</script>
