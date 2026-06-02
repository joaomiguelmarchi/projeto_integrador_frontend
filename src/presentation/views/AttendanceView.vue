<template>
  <div class="min-h-screen bg-[var(--p-surface-100)] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[var(--p-surface-800)]">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <div class="bg-[var(--p-surface-0)] shadow-sm rounded-xl p-6 text-center border-t-4 border-[var(--p-primary-500)]">
        <h1 class="text-3xl font-extrabold text-[var(--p-primary-600)] tracking-tight">SMILEHUB</h1>
        <p class="text-[var(--p-surface-500)] mt-1 font-medium">Lista de atendimentos</p>
      </div>

      <Transition name="fade">
        <div 
          v-if="currentAlert" 
          class="bg-[var(--p-surface-0)] border-l-4 border-[var(--p-primary-500)] p-4 rounded-r-xl shadow-sm flex items-center justify-between"
        >
          <div class="flex items-center">
            <i class="pi pi-bell text-2xl mr-4 text-[var(--p-primary-500)] animate-bounce"></i>
            <div>
              <p class="text-sm font-bold text-[var(--p-primary-600)] uppercase tracking-wider">
                Notificação em tempo real
              </p>
              <p class="text-base text-[var(--p-surface-600)] mt-0.5 font-medium">
                {{ currentAlert }}
              </p>
            </div>
          </div>
          <span class="flex h-3 w-3 relative mr-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--p-primary-400)] opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-[var(--p-primary-500)]"></span>
          </span>
        </div>
      </Transition>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <section class="bg-[var(--p-surface-0)] shadow-sm rounded-xl p-6 border border-[var(--p-surface-200)]">
          <div class="flex items-center mb-5 gap-3">
            <i class="pi pi-user-plus text-xl text-[var(--p-primary-600)]"></i>
            <h2 class="text-lg font-bold text-[var(--p-surface-600)] m-0">Registrar Chegada</h2>
          </div>
          
          <form @submit.prevent="registerPatient" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label for="patientName" class="font-bold text-[var(--p-surface-800)] text-sm">
                Nome do Paciente
              </label>
              <InputText 
                id="patientName"
                v-model="newPatientName" 
                type="text" 
                placeholder="Ex: João da Silva" 
                required 
                class="w-full py-2 px-3 h-10 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-lg focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow"
              />
            </div>
            <Button 
              type="submit" 
              :label="isLoading ? 'Enviando...' : 'Adicionar à Fila'" 
              :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
              :disabled="isLoading"
              class="w-full !bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !font-semibold !text-[var(--p-surface-0)] transition-all h-10 flex items-center justify-center !rounded-lg shadow-md"
            />
          </form>
        </section>

        <section class="bg-[var(--p-surface-0)] shadow-sm rounded-xl p-6 border border-[var(--p-surface-200)] flex flex-col h-[350px]">
          <div class="flex justify-between items-center mb-5">
            <div class="flex items-center gap-3">
              <i class="pi pi-users text-xl text-[var(--p-primary-600)]"></i>
              <h2 class="text-lg font-bold text-[var(--p-surface-600)] m-0">Fila de Espera</h2>
            </div>
            <Button 
              icon="pi pi-refresh" 
              variant="text" 
              size="small"
              @click="fetchQueue" 
              class="!text-[var(--p-surface-500)] hover:!text-[var(--p-primary-600)] hover:!bg-[var(--p-surface-100)] !w-8 !h-8 !p-0"
              title="Atualizar manualmente (GET)"
            />
          </div>
          
          <div class="flex-1 overflow-y-auto pr-2 rounded-lg">
            <ul v-if="queue.length > 0" class="space-y-2">
              <li 
                v-for="(attendance, index) in queue" 
                :key="attendance.id"
                class="bg-[var(--p-surface-100)] border border-[var(--p-surface-200)] rounded-lg p-3 flex justify-between items-center hover:bg-[var(--p-surface-200)] transition-colors cursor-default"
              >
                <div class="flex items-center">
                  <span class="text-[var(--p-surface-400)] font-bold mr-3">#{{ index + 1 }}</span>
                  <span class="text-sm font-semibold text-[var(--p-surface-800)]">{{ attendance.patientName }}</span>
                </div>
                <span class="px-3 py-1 rounded-full inline-flex items-center gap-2 bg-[var(--p-surface-0)] text-[var(--p-surface-600)] border border-[var(--p-surface-300)] text-xs font-bold shadow-sm">
                  <span class="w-2 h-2 rounded-full bg-[var(--p-primary-500)]"></span>
                  Ficha: {{ attendance.id }}
                </span>
              </li>
            </ul>
            <div v-else class="h-full flex flex-col items-center justify-center text-[var(--p-surface-400)] space-y-3">
              <i class="pi pi-inbox text-4xl text-[var(--p-surface-300)]"></i>
              <p class="text-sm font-medium">Nenhum paciente aguardando.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

interface Attendance {
  id: number
  patientName: string
}

const newPatientName = ref('')
const isLoading = ref(false)
const queue = ref<Attendance[]>([])
const currentAlert = ref('')
let ws: WebSocket | null = null

const API_BASE_URL = 'http://localhost:9000/attendance'
const WS_URL = 'ws://localhost:9000/attendance/ws'

// ==========================================
// 1. WebSocket - Comunicação em Tempo Real
// ==========================================
const connectWebSocket = () => {
  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log("Conectado ao WebSocket do SMILEHUB")
  }

  ws.onmessage = (event) => {
    console.log("Mensagem recebida do servidor:", event.data)
    currentAlert.value = event.data 
    fetchQueue() 
  }

  ws.onerror = (error) => {
    console.error("Erro no WebSocket:", error)
  }

  ws.onclose = () => {
    console.log("Conexão WebSocket fechada")
  }
}

// ==========================================
// 2. API REST (POST) - Comunicação Síncrona
// ==========================================
const registerPatient = async () => {
  if (!newPatientName.value) return

  isLoading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: newPatientName.value })
    })

    if (response.ok) {
      newPatientName.value = '' 
    } else {
      console.error('Falha ao registrar')
    }
  } catch (error) {
    console.error("Erro na comunicação com a API REST:", error)
  } finally {
    isLoading.value = false
  }
}

// ==========================================
// 3. API REST (GET) - Consulta Síncrona
// ==========================================
const fetchQueue = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/list`)
    if (response.ok) {
      const data = await response.json()
      queue.value = data.data || data 
    }
  } catch (error) {
    console.error("Erro ao buscar a fila de mensagens:", error)
  }
}

onMounted(() => {
  connectWebSocket()
  fetchQueue()
})

onUnmounted(() => {
  if (ws) ws.close()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--p-surface-300);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--p-surface-400);
}
</style>