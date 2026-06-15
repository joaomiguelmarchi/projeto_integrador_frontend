<template>
  <div class="min-h-screen bg-[var(--p-surface-100)] py-10 px-4 sm:px-6 lg:px-8 font-sans text-[var(--p-surface-800)]">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="bg-[var(--p-surface-0)] shadow-sm rounded-xl p-6 text-center border-t-4 border-[var(--p-primary-500)]">
        <h1 class="text-3xl font-extrabold text-[var(--p-primary-600)] tracking-tight">SMILEHUB</h1>
        <p class="text-[var(--p-surface-500)] mt-1 font-medium">Lista de atendimentos</p>
      </div>

      <Toast>
        <template #message="slotProps">
          <div class="flex flex-col gap-3 w-full">
            <div>
              <span class="font-bold text-sm text-[var(--p-surface-800)]">{{ slotProps.message.summary }}</span>
              <div class="text-sm text-[var(--p-surface-600)] mt-1">{{ slotProps.message.detail }}</div>
              <div v-if="slotProps.message.patientId" class="text-xs font-semibold text-[var(--p-surface-500)] mt-1">
                ID do paciente: {{ slotProps.message.patientId }}
              </div>
            </div>
            <Button
              v-if="slotProps.message.patientId"
              label="Ver"
              icon="pi pi-eye"
              size="small"
              class="self-start !rounded-lg"
              @click.stop="openPatientDialogById(slotProps.message.patientId)"
            />
          </div>
        </template>
      </Toast>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section class="bg-[var(--p-surface-0)] shadow-sm rounded-xl p-6 border border-[var(--p-surface-200)]">
          <div class="flex items-center mb-5 gap-3">
            <i class="pi pi-user-plus text-xl text-[var(--p-primary-600)]"></i>
            <h2 class="text-lg font-bold text-[var(--p-surface-600)] m-0">Registrar Chegada</h2>
          </div>

          <form @submit.prevent="registerPatient" class="space-y-4">
            <div class="flex flex-col gap-2">
              <label for="patientId" class="font-bold text-[var(--p-surface-800)] text-sm">
                Paciente
              </label>
              <Select
                id="patientId"
                v-model="selectedPatientId"
                :options="patients"
                option-label="name"
                option-value="id"
                placeholder="Selecione um paciente"
                filter
                :loading="isLoadingPatients"
                :disabled="isLoadingPatients"
                class="w-full"
              />
            </div>
            <Button
              type="submit"
              :label="isLoading ? 'Enviando...' : 'Adicionar a Fila'"
              :icon="isLoading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
              :disabled="isLoading || !selectedPatientId || isLoadingPatients"
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
                  <span class="text-sm font-semibold text-[var(--p-surface-800)]">
                    {{ attendance.patientName || getPatientName(attendance.patientId) || 'Paciente sem nome' }}
                  </span>
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

      <Dialog
        v-model:visible="patientDialogVisible"
        :style="{ width: '520px' }"
        header="Detalhes do Paciente"
        :modal="true"
      >
        <div v-if="selectedPatient" class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div class="flex flex-col gap-1">
            <span class="font-bold text-[var(--p-surface-500)]">ID</span>
            <span>{{ selectedPatient.id }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-bold text-[var(--p-surface-500)]">Nome</span>
            <span>{{ selectedPatient.name || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-bold text-[var(--p-surface-500)]">Email</span>
            <span>{{ selectedPatient.email || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-bold text-[var(--p-surface-500)]">Telefone</span>
            <span>{{ selectedPatient.phoneNumber || selectedPatient.homePhoneNumber || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-bold text-[var(--p-surface-500)]">Nascimento</span>
            <span>{{ selectedPatient.birthday || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-bold text-[var(--p-surface-500)]">Responsavel</span>
            <span>{{ selectedPatient.responsible || '-' }}</span>
          </div>
          <div class="flex flex-col gap-1 sm:col-span-2">
            <span class="font-bold text-[var(--p-surface-500)]">Endereco</span>
            <span>{{ patientAddress }}</span>
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Toast from 'primevue/toast'
import type { ToastMessageOptions } from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { AuthService } from '../../infrastructure/services/AuthService'
import { getPatientServiceErrorMessage, PatientService } from '../../infrastructure/services/PatientService'
import type { ApiPatient } from '../../infrastructure/services/PatientService'

interface Attendance {
  id: number
  patientId?: number | null
  patientName?: string | null
}

interface AttendanceNotification extends ToastMessageOptions {
  patientId?: number
}

interface WebSocketPayload {
  senderEmail?: string
  message?: string
  patientId?: number
  patient?: ApiPatient
}

const selectedPatientId = ref<number | null>(null)
const isLoading = ref(false)
const isLoadingPatients = ref(false)
const queue = ref<Attendance[]>([])
const patients = ref<ApiPatient[]>([])
const selectedPatient = ref<ApiPatient | null>(null)
const patientDialogVisible = ref(false)
let ws: WebSocket | null = null

const API_BASE_URL = 'http://localhost:9090/attendance'
const WS_URL = 'ws://localhost:9090/attendance/ws'
const TOKEN_STORAGE_KEY = 'auth_token'
const TOKEN_COOKIE_NAME = 'token'

const toast = useToast()

const patientAddress = computed(() => {
  if (!selectedPatient.value) return '-'

  const address = [
    selectedPatient.value.address,
    selectedPatient.value.addressesNumber
  ].filter(Boolean).join(', ')

  return address || '-'
})

const syncTokenCookie = () => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)

  if (!token) return

  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`
}

const showError = (detail: string) => {
  toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 })
}

const getPatientName = (patientId?: number | null) => {
  if (!patientId) return ''
  return patients.value.find(patient => patient.id === patientId)?.name ?? ''
}

const normalizePatientId = (payload: WebSocketPayload) => {
  return payload.patientId ?? payload.patient?.id ?? null
}

const getPayloadMessage = (payload: WebSocketPayload, patientId?: number | null) => {
  return payload.message ?? (patientId ? `Paciente ${patientId} adicionado a fila.` : 'Paciente adicionado a fila.')
}

const loadPatients = async () => {
  isLoadingPatients.value = true

  try {
    patients.value = await PatientService.list()
  } catch (error) {
    showError(getPatientServiceErrorMessage(error))
  } finally {
    isLoadingPatients.value = false
  }
}

const openPatientDialogById = async (patientId: number) => {
  let patient = patients.value.find(item => item.id === patientId)

  if (!patient) {
    await loadPatients()
    patient = patients.value.find(item => item.id === patientId)
  }

  if (!patient) {
    showError('Paciente nao encontrado.')
    return
  }

  selectedPatient.value = patient
  patientDialogVisible.value = true
}

const connectWebSocket = () => {
  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log('Conectado ao WebSocket do SMILEHUB')
  }

  ws.onmessage = (event) => {
    console.log('Mensagem recebida do servidor:', event.data)

    try {
      const payload = JSON.parse(event.data) as WebSocketPayload
      console.log(payload)
      const currentUser = AuthService.getUser()
      const patientId = normalizePatientId(payload)
      const patientName = payload.patient?.name ?? getPatientName(patientId)

      
        const message: AttendanceNotification = {
          severity: 'info',
          summary: 'Novo Atendimento',
          detail: `Paciente: ${patientName}.`,
          life: 10000
        }

        if (patientId) {
          message.patientId = patientId
        }

        toast.add(message)
    
    } catch (error) {
      console.error('Erro ao processar mensagem do WebSocket. O formato esperado e JSON.', error)
    }

    fetchQueue()
  }

  ws.onerror = (error) => {
    console.error('Erro no WebSocket:', error)
  }

  ws.onclose = () => {
    console.log('Conexao WebSocket fechada')
  }
}

const registerPatient = async () => {
  if (!selectedPatientId.value) return

  isLoading.value = true
  try {
    syncTokenCookie()

    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ patientId: selectedPatientId.value })
    })

    if (response.ok) {
      selectedPatientId.value = null
    } else {
      console.error('Falha ao registrar')
      showError('Falha ao registrar paciente na fila.')
    }
  } catch (error) {
    console.error('Erro na comunicacao com a API REST:', error)
    showError('Nao foi possivel conectar com a API de atendimento.')
  } finally {
    isLoading.value = false
  }
}

const fetchQueue = async () => {
  try {
    syncTokenCookie()

    const response = await fetch(`${API_BASE_URL}/list`, {
      credentials: 'include'
    })
    if (response.ok) {
      const data = await response.json()
      queue.value = data.data || data
    }
  } catch (error) {
    console.error('Erro ao buscar a fila de mensagens:', error)
  }
}

onMounted(() => {
  connectWebSocket()
  loadPatients()
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
