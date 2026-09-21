<template>
  <AppLayout title="Faturamento">
    <div class="billing-page bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
      <div class="flex flex-col gap-3 p-5 border-b border-[var(--p-surface-200)] sm:flex-row sm:items-center sm:justify-between">
        <IconField><InputIcon class="flex items-center"><i class="pi pi-search text-[var(--p-surface-400)]" /></InputIcon><InputText v-model="search" aria-label="Pesquisar globalmente" placeholder="Pesquisar" class="py-2 px-3 pl-10 h-9 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-full w-full sm:w-64 focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow" /></IconField>
      </div>
      <Tabs value="accounts" class="patient-record-tabs">
        <TabList>
          <Tab value="accounts"><span class="patient-record-tab-label"><i class="pi pi-receipt" />Faturamento</span></Tab>
          <Tab value="debtors"><span class="patient-record-tab-label"><i class="pi pi-users" />Devedores</span></Tab>
        </TabList>
        <TabPanels class="patient-record-tab-panels !p-0">
          <TabPanel value="accounts" class="patient-record-tab-panel">
            <DataTable v-model:filters="accountFilters" filterDisplay="row" :rowClass="rowClass" :value="filteredAccounts" class="app-table flex-1 px-4 sm:px-6 pb-2" dataKey="id" paginator :rows="10" :rowsPerPageOptions="[5, 10, 20]" scrollable paginatorTemplate="RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink" currentPageReportTemplate="{first} - {last} de {totalRecords}">
              <template #empty><div class="app-table-empty-state flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]"><i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]" /><p class="font-medium text-[var(--p-surface-500)]">Nenhuma conta encontrada.</p></div></template>
              <Column field="status" header="Status" :showFilterMenu="false" style="width: 8rem"><template #body="{ data }"><div class="flex justify-left w-full pl-2"><AppStatusBadge :value="data.status" /></div></template><template #filter="{ filterModel, filterCallback }"><Select v-model="filterModel.value" @change="filterCallback()" :options="statuses" showClear placeholder="Todos" aria-label="Status da conta" class="w-full h-[36px] text-sm" /></template></Column>
              <Column field="id" header="Conta" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar conta" aria-label="Buscar conta" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="patientName" header="Paciente" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar paciente" aria-label="Buscar paciente" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="generationLabel" header="Data geração" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar data" aria-label="Buscar data" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="totalLabel" header="Valor total" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar valor" aria-label="Buscar valor" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="balanceLabel" header="Saldo em aberto" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar saldo" aria-label="Buscar saldo" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column :exportable="false" headerClass="billing-actions-cell" bodyClass="billing-actions-cell" style="width: 10rem; min-width: 10rem"><template #body="{ data }"><div class="flex w-full items-center justify-center gap-2"><Button icon="pi pi-bars" aria-label="Detalhes da conta" v-tooltip.top="'Detalhes da conta'" variant="outlined" rounded size="small" @click="openAccount(data)" /><Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" aria-label="Inativar conta" v-tooltip.top="'Inativar conta'" :disabled="data.status === 'Inativo'" @click="accountToDeactivate = data" /></div></template></Column>
            </DataTable>
          </TabPanel>
          <TabPanel value="debtors" class="patient-record-tab-panel">
            <div class="billing-dashboard-toggle">
              <Button
                label="Resumo dos devedores"
                :icon="dashboardExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
                iconPos="right"
                text
                :aria-expanded="dashboardExpanded"
                aria-controls="billing-debtor-dashboard"
                @click="dashboardExpanded = !dashboardExpanded"
              />
            </div>
            <section v-show="dashboardExpanded" id="billing-debtor-dashboard" class="billing-dashboard" aria-label="Resumo dos devedores">
              <article class="billing-metric">
                <div class="billing-metric-heading"><span>Pacientes com atraso</span><i class="pi pi-users billing-metric-icon" aria-hidden="true" /></div>
                <strong class="billing-metric-value">{{ debtorCount }}</strong>
                <span class="billing-metric-caption">{{ debtors.length }} {{ debtors.length === 1 ? 'conta em acompanhamento' : 'contas em acompanhamento' }}</span>
              </article>
              <article class="billing-metric billing-metric-overdue">
                <div class="billing-metric-heading"><span>Total vencido</span><i class="pi pi-calendar-clock billing-metric-icon" aria-hidden="true" /></div>
                <strong class="billing-metric-value">{{ currency(totalOverdue) }}</strong>
                <span class="billing-metric-caption">Pagamentos com vencimento em atraso</span>
              </article>
              <article class="billing-metric">
                <div class="billing-metric-heading"><span>Saldo em aberto dos devedores</span><i class="pi pi-wallet billing-metric-icon" aria-hidden="true" /></div>
                <strong class="billing-metric-value">{{ currency(debtorBalance) }}</strong>
                <span class="billing-metric-caption">{{ currency(debtorBalance - totalOverdue) }} a vencer</span>
              </article>
            </section>
            <DataTable v-model:filters="debtorFilters" filterDisplay="row" :rowsPerPageOptions="[5, 10, 20]" :value="filteredDebtors" class="app-table flex-1 px-4 sm:px-6 pb-2" dataKey="id" paginator :rows="10" scrollable paginatorTemplate="RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink" currentPageReportTemplate="{first} - {last} de {totalRecords}">
              <template #empty><div class="app-table-empty-state flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]"><i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]" /><p class="font-medium text-[var(--p-surface-500)]">Nenhuma conta vencida encontrada.</p></div></template>
              <Column field="patientName" header="Paciente" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar paciente" aria-label="Buscar paciente" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="id" header="Conta" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar conta" aria-label="Buscar conta" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="phone" header="Telefone" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar telefone" aria-label="Buscar telefone" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="dueLabel" header="Data vencimento" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar vencimento" aria-label="Buscar vencimento" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="overdueLabel" header="Valor vencido" :showFilterMenu="false"><template #body="{ data }"><strong class="billing-overdue">{{ data.overdueLabel }}</strong></template><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar valor vencido" aria-label="Buscar valor vencido" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column field="balanceLabel" header="Saldo em aberto" :showFilterMenu="false"><template #filter="{ filterModel, filterCallback }"><InputText v-model="filterModel.value" @input="filterCallback()" placeholder="Buscar saldo" aria-label="Buscar saldo" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" /></template></Column>
              <Column :exportable="false" headerClass="billing-actions-cell" bodyClass="billing-actions-cell" style="width: 12rem; min-width: 12rem"><template #body="{ data }"><div class="flex w-full items-center justify-center gap-2"><Button icon="pi pi-bars" variant="outlined" rounded size="small" aria-label="Detalhes da conta" @click="openAccount(data)" /><Button aria-label="Cobrança" v-tooltip.top="'Cobrança'" icon="pi pi-comment" variant="outlined" rounded size="small" @click="collectionAccount = data" /><Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" aria-label="Inativar conta" v-tooltip.top="'Inativar conta'" :disabled="data.status === 'Inativo'" @click="accountToDeactivate = data" /></div></template></Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </AppLayout>
  <Dialog :visible="!!accountToDeactivate" @update:visible="accountToDeactivate = null" header="Confirmar Exclusão" modal class="app-dialog" :style="{ width: '450px', maxWidth: '95vw' }">
    <div class="app-confirm-body">
      <i class="pi pi-exclamation-triangle app-confirm-icon" />
      <div v-if="accountToDeactivate" class="app-dialog-section"><span>Tem certeza que deseja inativar a conta <b>{{ accountToDeactivate.id }}</b> do paciente <b>{{ accountToDeactivate.patientName }}</b>?</span></div>
    </div>
    <template #footer><Button label="Não" icon="pi pi-times" text @click="accountToDeactivate = null" /><Button label="Sim" icon="pi pi-check" severity="danger" @click="confirmDeactivate" /></template>
  </Dialog>
  <Dialog v-model:visible="detailVisible" header="Detalhes da conta" modal class="app-dialog p-fluid" :style="{ width: '980px', maxWidth: '95vw' }">
    <div v-if="selectedAccount" class="app-dialog-body app-dialog-section">
      <section class="billing-account-summary" aria-label="Identificação da conta">
        <div class="billing-account-patient">
          <span class="billing-account-icon"><i class="pi pi-receipt" aria-hidden="true" /></span>
          <div><span class="billing-eyebrow">Conta {{ selectedAccount.id }}</span><h2>{{ selectedAccount.patientName }}</h2></div>
        </div>
        <dl class="billing-account-meta">
          <div><dt><i class="pi pi-calendar" aria-hidden="true" />Data geração</dt><dd>{{ formatDate(selectedAccount.generatedAt) }}</dd></div>
          <div><dt><i class="pi pi-clipboard" aria-hidden="true" />Atendimento</dt><dd>{{ selectedAccount.attendanceId }}</dd></div>
          <div><dt><i class="pi pi-phone" aria-hidden="true" />Telefone</dt><dd>{{ selectedAccount.phone }}</dd></div>
        </dl>
      </section>
      <div class="billing-account-totals">
        <div><span>Valor total</span><strong>{{ currency(accountTotal(selectedAccount)) }}</strong></div>
        <div class="billing-total-paid"><span>Valor pago</span><strong>{{ currency(accountTotal(selectedAccount) - outstandingTotal(selectedAccount)) }}</strong></div>
        <div class="billing-total-balance"><span>Saldo em aberto</span><strong>{{ currency(outstandingTotal(selectedAccount)) }}</strong></div>
      </div>
      <section class="quotation-procedures-section">
      <div class="quotation-procedures-header"><h3 class="billing-section-title"><i class="pi pi-list" aria-hidden="true" />Procedimentos</h3><span class="billing-section-caption">{{ selectedAccount.procedures.length }} {{ selectedAccount.procedures.length === 1 ? 'item' : 'itens' }}</span></div>
      <DataTable :value="selectedAccount.procedures" class="quotation-procedures-table" scrollable>
        <Column field="name" header="Procedimento" /><Column field="quantity" header="Quantidade" />
        <Column header="Valor unitário"><template #body="{ data }">{{ currency(data.unitAmount) }}</template></Column>
        <Column header="Subtotal"><template #body="{ data }">{{ currency(data.unitAmount * data.quantity) }}</template></Column>
      </DataTable>
      </section>
      <section class="quotation-procedures-section">
      <div class="quotation-procedures-header"><h3 class="billing-section-title"><i class="pi pi-wallet" aria-hidden="true" />Pagamentos</h3><span class="billing-section-caption"> {{ selectedAccount.payments.length === 1 ? 'À vista' : `Parcelado em ${selectedAccount.payments.length} vezes` }}</span></div>
      <DataTable :value="selectedAccount.payments" class="quotation-procedures-table" scrollable>
        <Column header="Parcela"><template #body="{ index }">{{ index + 1 }}/{{ selectedAccount.payments.length }}</template></Column>
        <Column header="Status"><template #body="{ data }"><AppStatusBadge :value="data.status" /></template></Column>
        <Column field="dueDate" header="Vencimento"><template #body="{ data }">{{ formatDate(data.dueDate) }}<small v-if="selectedAccount.status !== 'Inativo' && isOverdue(data, today)" class="billing-overdue block">Vencido</small></template></Column>
        <Column header="Valor"><template #body="{ data }">{{ currency(data.amount) }}</template></Column>
        <Column :exportable="false" style="min-width: 8rem"><template #body="{ data }"><Button v-if="data.status === 'Pendente' && selectedAccount.status === 'Faturado'" aria-label="Registrar pagamento" v-tooltip.top="'Registrar pagamento'" icon="pi pi-check" variant="outlined" rounded size="small" @click="paymentToConfirm = data" /><span v-else class="billing-muted">{{ data.status === 'Pago' ? 'Recebido' : 'Indisponível' }}</span></template></Column>
      </DataTable>
      </section>
    </div>
    <template #footer><Button label="Fechar" icon="pi pi-times" text @click="detailVisible = false" /><Button v-if="selectedAccount?.status === 'Pendente'" label="Faturar conta" icon="pi pi-check" @click="invoiceVisible = true" /></template>
  </Dialog>
  <Dialog :visible="!!paymentToConfirm" @update:visible="paymentToConfirm = null" header="Confirmar recebimento" modal class="app-dialog" :style="{ width: '460px', maxWidth: '95vw' }">
    <div class="app-confirm-body" v-if="paymentToConfirm"><i class="pi pi-exclamation-triangle app-confirm-icon" /><div>Confirma o recebimento de <strong>{{ currency(paymentToConfirm.amount) }}</strong>, referente ao vencimento {{ formatDate(paymentToConfirm.dueDate) }}?</div></div>
    <template #footer><Button label="Cancelar" icon="pi pi-times" text @click="paymentToConfirm = null" /><Button label="Confirmar pagamento" icon="pi pi-check" @click="confirmPayment" /></template>
  </Dialog>
  <Dialog v-model:visible="invoiceVisible" header="Faturar conta" modal class="app-dialog" :style="{ width: '460px', maxWidth: '95vw' }">
    <div class="app-confirm-body"><i class="pi pi-exclamation-triangle app-confirm-icon" /><div>Confirma o faturamento da conta {{ selectedAccount?.id }}?</div></div>
    <template #footer><Button label="Cancelar" icon="pi pi-times" text @click="invoiceVisible = false" /><Button label="Confirmar faturamento" icon="pi pi-check" @click="confirmInvoice" /></template>
  </Dialog>
  <Dialog :visible="!!collectionAccount" @update:visible="collectionAccount = null" header="Cobrança do paciente" modal class="app-dialog" :style="{ width: '580px', maxWidth: '95vw' }">
    <div class="app-dialog-body app-dialog-section" v-if="collectionAccount">
      <p><strong>{{ collectionAccount.patientName }}</strong> · {{ collectionAccount.phone }}</p>
      <label for="collection-message" class="app-field-label">Mensagem para cobrança</label>
      <Textarea id="collection-message" :modelValue="collectionMessage" readonly rows="6" class="w-full" />
      <p class="billing-muted">Copie e revise a mensagem antes de entrar em contato. Nenhuma mensagem é enviada automaticamente.</p>
    </div>
    <template #footer><Button label="Fechar" icon="pi pi-times" text @click="collectionAccount = null" /><Button label="Copiar mensagem" icon="pi pi-copy" @click="copyCollection" /></template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import AppStatusBadge from '../components/AppStatusBadge.vue'
import { FilterMatchMode } from '@primevue/core/api'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'
import AppLayout from '../components/AppLayout.vue'
import { accountTotal, outstandingTotal, overdueTotal, isOverdue, type AccountStatus, type PatientAccount, type Payment } from '../../core/entities/Billing'
import { createDemoAccounts } from '../../infrastructure/services/BillingDemo'

const accounts = ref(createDemoAccounts())
const statuses: AccountStatus[] = ['Faturado', 'Pendente', 'Inativo']
const search = ref('')
const dashboardExpanded = ref(false)
const selectedAccount = ref<PatientAccount | null>(null)
const accountToDeactivate = ref<PatientAccount | null>(null)
const detailVisible = ref(false)
const invoiceVisible = ref(false)
const paymentToConfirm = ref<Payment | null>(null)
const collectionAccount = ref<PatientAccount | null>(null)
const toast = useToast()
const localToday = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const today = ref(localToday())
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(() => { today.value = localToday() }, 30000) })
onUnmounted(() => clearInterval(timer))
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const matches = (account: PatientAccount, query: string) => normalize([
  account.id, account.patientName, account.patientId, account.phone, account.status,
  formatDate(account.generatedAt), currency(accountTotal(account)), currency(outstandingTotal(account)),
  formatDate(oldestDue(account)), currency(overdueTotal(account, today.value)),
].join(' ')).includes(normalize(query.trim()))
const tableRow = (account: PatientAccount) => ({
  ...account,
  generationLabel: formatDate(account.generatedAt),
  totalLabel: currency(accountTotal(account)),
  balanceLabel: currency(outstandingTotal(account)),
  dueLabel: formatDate(oldestDue(account)),
  overdueLabel: currency(overdueTotal(account, today.value)),
})
const filteredAccounts = computed(() => accounts.value.filter(account => matches(account, search.value)).map(tableRow))
const debtors = computed(() => accounts.value.filter(account => account.status !== 'Inativo' && overdueTotal(account, today.value) > 0))
const filteredDebtors = computed(() => debtors.value.filter(account => matches(account, search.value)).map(tableRow))
const debtorBalance = computed(() => debtors.value.reduce((sum, account) => sum + outstandingTotal(account), 0))
const debtorCount = computed(() => new Set(debtors.value.map(account => account.patientId)).size)
const totalOverdue = computed(() => debtors.value.reduce((sum, account) => sum + overdueTotal(account, today.value), 0))
const currency = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatDate = (date: string) => date.split('-').reverse().join('/')
const columnFilter = () => ({ value: null, matchMode: FilterMatchMode.CONTAINS })
const accountFilters = ref({ generationLabel: columnFilter(), totalLabel: columnFilter(), balanceLabel: columnFilter(), status: { value: null, matchMode: FilterMatchMode.EQUALS }, id: { value: null, matchMode: FilterMatchMode.CONTAINS }, patientName: { value: null, matchMode: FilterMatchMode.CONTAINS } })
const debtorFilters = ref({ dueLabel: columnFilter(), overdueLabel: columnFilter(), balanceLabel: columnFilter(), id: { value: null, matchMode: FilterMatchMode.CONTAINS }, patientName: { value: null, matchMode: FilterMatchMode.CONTAINS }, phone: { value: null, matchMode: FilterMatchMode.CONTAINS } })
const rowClass = (account: PatientAccount) => [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': account.status === 'Inativo' }]
const oldestDue = (account: PatientAccount) => account.payments.filter(payment => isOverdue(payment, today.value)).map(payment => payment.dueDate).sort()[0] || ''
function openAccount(account: PatientAccount) {
  selectedAccount.value = accounts.value.find(item => item.id === account.id) ?? null
  detailVisible.value = !!selectedAccount.value
}
function confirmDeactivate() {
  const account = accounts.value.find(item => item.id === accountToDeactivate.value?.id)
  if (!account || account.status === 'Inativo') return
  account.status = 'Inativo'
  accountToDeactivate.value = null
  toast.add({ severity: 'success', summary: 'Conta inativada', life: 3000 })
}
function confirmPayment() {
  if (!paymentToConfirm.value || selectedAccount.value?.status !== 'Faturado' || paymentToConfirm.value.status !== 'Pendente') return
  paymentToConfirm.value.status = 'Pago'
  paymentToConfirm.value = null
  toast.add({ severity: 'success', summary: 'Pagamento registrado', detail: 'Saldo e contas vencidas atualizados nesta demonstração.', life: 3500 })
}
function confirmInvoice() {
  if (selectedAccount.value?.status !== 'Pendente') return
  selectedAccount.value.status = 'Faturado'
  invoiceVisible.value = false
  toast.add({ severity: 'success', summary: 'Conta faturada', life: 3000 })
}
const collectionMessage = computed(() => {
  const account = collectionAccount.value
  return account ? `Olá, ${account.patientName}! Identificamos um valor pendente de ${currency(overdueTotal(account, today.value))} referente às parcelas vencidas da conta ${account.id}. Poderia entrar em contato com a clínica para combinarmos a regularização? Caso já tenha pago, por favor nos envie o comprovante. Obrigado!` : ''
})
async function copyCollection() {
  try { await navigator.clipboard.writeText(collectionMessage.value); toast.add({ severity: 'success', summary: 'Mensagem copiada', life: 3000 }) }
  catch { toast.add({ severity: 'warn', summary: 'Não foi possível copiar', detail: 'Selecione e copie o texto da mensagem manualmente.', life: 4000 }) }
}
</script>

<style scoped>
.billing-page { min-height: 0; }
.billing-page :deep(.app-table .billing-actions-cell) {
  padding-left: .75rem;
  padding-right: .75rem;
  text-align: center;
  vertical-align: middle;
}
.billing-muted { color: var(--p-surface-500); font-size: .85rem; }
.billing-overdue { color: var(--p-primary-1010); }

.billing-dashboard-toggle { display: flex; align-items: center; padding: .5rem 1.25rem; border-bottom: 1px solid var(--p-surface-200); }
.billing-dashboard { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; padding: 1.25rem; }
.billing-metric { display: flex; flex-direction: column; gap: .65rem; min-width: 0; padding: 1.25rem; border: 1px solid var(--p-surface-200); border-radius: .75rem; background: var(--p-surface-0); box-shadow: 0 2px 8px color-mix(in srgb, var(--p-primary-600) 5%, transparent); }
.billing-metric-heading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; color: var(--p-surface-600); font-size: .875rem; font-weight: 600; }
.billing-metric-icon, .billing-account-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: .75rem; background: var(--p-primary-50); color: var(--p-primary-600); }
.billing-metric-value { font-size: clamp(1.35rem, 2vw, 1.75rem); font-weight: 700; color: var(--p-primary-700); letter-spacing: -.025em; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.billing-metric-caption, .billing-section-caption { font-size: .8125rem; color: var(--p-surface-500); }
.billing-metric-overdue { border-color: color-mix(in srgb, var(--p-primary-1010) 22%, var(--p-surface-200)); background: color-mix(in srgb, var(--p-primary-1010) 3%, var(--p-surface-0)); }
.billing-metric-overdue .billing-metric-icon { color: var(--p-primary-1010); background: color-mix(in srgb, var(--p-primary-1010) 10%, var(--p-surface-0)); }
.billing-metric-overdue .billing-metric-value { color: var(--p-primary-1010); }
.billing-account-summary { border: 1px solid var(--p-surface-200); border-radius: .75rem; overflow: hidden; }
.billing-account-patient { display: flex; align-items: center; gap: .875rem; padding: 1.25rem; background: var(--p-surface-100); }
.billing-account-icon { width: 3rem; height: 3rem; background: var(--p-surface-0); border: 1px solid var(--p-surface-200); font-size: 1.25rem; }
.billing-eyebrow { color: var(--p-primary-600); font-size: .75rem; font-weight: 700; }
.billing-account-patient h2 { margin: .25rem 0 0; color: var(--p-surface-700); font-size: 1.125rem; font-weight: 700; overflow-wrap: anywhere; }
.billing-account-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; padding: 1rem 1.25rem; margin: 0; }
.billing-account-meta dt { display: flex; align-items: center; gap: .5rem; color: var(--p-surface-500); font-size: .8125rem; }
.billing-account-meta dt i { color: var(--p-primary-600); }
.billing-account-meta dd { margin: .45rem 0 0; font-size: .875rem; color: var(--p-surface-700); font-weight: 600; overflow-wrap: anywhere; }
.billing-account-totals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .875rem; }
.billing-account-totals > div { display: flex; flex-direction: column; gap: .5rem; padding: 1rem; border: 1px solid var(--p-surface-200); border-radius: .75rem; }
.billing-account-totals span { font-size: .8125rem; color: var(--p-surface-500); }
.billing-account-totals strong { font-size: 1.25rem; font-weight: 700; color: var(--p-surface-700); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.billing-account-totals .billing-total-paid strong { color: var(--p-primary-1000); }
.billing-account-totals .billing-total-balance { background: var(--p-primary-50); border-color: var(--p-primary-100); }
.billing-account-totals .billing-total-balance strong { color: var(--p-primary-700); }
.billing-section-title { display: flex; align-items: center; gap: .5rem; margin: 0; font-size: .875rem; font-weight: 700; color: var(--p-surface-700); }
.billing-section-title i { color: var(--p-primary-600); }
@media (max-width: 1100px) { .billing-dashboard { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .billing-account-meta, .billing-account-totals { grid-template-columns: 1fr; } .billing-account-patient { align-items: flex-start; } }
</style>
