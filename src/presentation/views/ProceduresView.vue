<template>
  <div class="bg-[var(--p-surface-50)] h-screen w-full flex overflow-hidden">
      
      <aside class="w-64 bg-white border-r border-[var(--p-surface-200)] flex flex-col">
          <div class="h-16 flex items-center px-6 border-b border-[var(--p-surface-200)]">
              <span class="text-xl font-bold text-[var(--p-primary-500)]">SMILEHUB</span>
          </div>
          
          <nav class="flex-1 flex flex-col gap-2 p-4">
              <button @click="accessHome()" class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-home"></i>
                  <span class="font-medium">Início</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-users"></i>
                  <span class="font-medium">Cadastro de Paciente</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-folder"></i>
                  <span class="font-medium">Conta Paciente</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-dollar"></i>
                  <span class="font-medium">Orçamento</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-calendar"></i>
                  <span class="font-medium">Agenda</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-receipt"></i>
                  <span class="font-medium">Faturamento</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md bg-[var(--p-primary-50)] text-[var(--p-primary-700)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-list"></i>
                  <span class="font-medium">Procedimentos</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left mt-auto cursor-pointer">
                  <i class="pi pi-cog"></i>
                  <span class="font-medium">Configurações</span>
              </button>
          </nav>
      </aside>

      <main class="flex-1 flex flex-col p-6 overflow-hidden"> 
          <div class="bg-white rounded-lg shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
              
              <div class="flex justify-between items-center p-5 border-b border-[var(--p-surface-200)]">
                  <div class="flex items-center gap-3">
                      <h2 class="text-xl font-bold text-[var(--p-surface-500)] m-0 tracking-[0.5px]">
                          PROCEDIMENTOS
                      </h2>
                  </div>
                  
                  <div class="flex items-center gap-3">
                      <IconField>
                          <InputIcon class="flex items-center">
                              <i class="pi pi-search" />
                          </InputIcon>
                          <InputText 
                              v-model="procedureFilters['global'].value" 
                              placeholder="Pesquisar" 
                              class="py-1 px-2 text-sm h-[36px]" 
                          />
                      </IconField>
                      <Button 
                          icon="pi pi-plus" 
                          label="Adicionar" 
                          class="bg-[var(--p-primary-500)] hover:bg-[var(--p-primary-600)] border-none px-3 py-1 text-sm font-semibold text-white transition-colors h-[36px] flex items-center" 
                          @click="openAddDialog"
                      />
                  </div>
              </div>

              <div class="flex-1 flex flex-col overflow-hidden p-5 pb-6">
                  <DataTable 
                      v-model:filters="procedureFilters"
                      v-model:selection="selectedProcedure"
                      v-model:contextMenuSelection="contextMenuSelection"
                      @rowContextmenu="onRowContextMenu"
                      :value="proceduresMock" 
                      class="procedure-table flex-1"
                      scrollable 
                      scrollHeight="flex"
                      selectionMode="single"
                      :metaKeySelection="metaKey" 
                      dataKey="id"
                      filterDisplay="row"
                      :globalFilterFields="['status', 'id', 'description', 'price', 'category']"
                      :rowClass="rowClass"
                  >   
                      <template #empty> Nenhum procedimento encontrado. </template>
                      <template #loading> Carregando dados. Por favor aguarde... </template>
                      
                      <Column field="status" header="Status" bodyClass="relative" :showFilterMenu="false">
                          <template #body="{ data }">
                              <div 
                                  class="absolute left-0 top-0 h-full w-2"
                                  :class="data.status === 'Ativo' ? 'bg-[var(--p-primary-1000)]' : 'bg-[var(--p-primary-1010)]'"
                              ></div>
                              <span class="ml-2 font-medium" :class="data.status === 'Ativo' ? 'text-slate-700' : ''">
                                  {{ data.status }}
                              </span>
                          </template>
                          <template #filter="{ filterModel, filterCallback }">
                              <Select 
                                  v-model="filterModel.value" 
                                  @change="filterCallback()" 
                                  :options="['Ativo', 'Inativo']" 
                                  placeholder="Todos" 
                                  class="py-1 px-2 text-sm h-[36px] flex items-center" 
                                  style="min-width: 8rem" 
                                  :showClear="true"
                              >
                              </Select>
                          </template>
                      </Column>
                      
                      <Column field="id" header="ID Procedimento" :showFilterMenu="false" style="width: 15rem">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full"  />
                          </template>
                      </Column>

                      <Column field="description" header="Descrição" :showFilterMenu="false">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Descrição" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
                          </template>
                      </Column>

                      <Column field="price" header="Valor" :showFilterMenu="false">
                          <template #body="{ data }">
                              {{ formatCurrency(data.price) }}
                          </template>
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Valor" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
                          </template>
                      </Column>
                      
                      <Column field="category" header="Classificação" :showFilterMenu="false">
                          <template #filter="{ filterModel, filterCallback }">
                              <Select 
                                  v-model="filterModel.value" 
                                  @change="filterCallback()" 
                                  :options="categories" 
                                  placeholder="Selecione" 
                                  class="py-1 px-2 text-sm h-[36px] flex items-center" 
                                  style="min-width: 10rem" 
                                  :showClear="true"
                              >
                              </Select>
                          </template>
                      </Column>

                      <Column :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex justify-end gap-2 pr-2">
                                <Button icon="pi pi-pencil" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'"/>
                                <Button 
                                    icon="pi pi-trash" 
                                    variant="outlined" 
                                    rounded 
                                    severity="danger" 
                                    size="small" 
                                    @click="confirmDeleteProcedure(slotProps.data)" 
                                    :disabled="slotProps.data.status === 'Inativo'"
                                />
                            </div>
                        </template>
                      </Column>
                  </DataTable>
              </div>
          </div>
      </main>
  </div>

  <ContextMenu ref="cm" :model="menuItems" />

  <Dialog v-model:visible="addDialogVisible" :style="{ width: '550px' }" header="Adicionar Procedimento" :modal="true">
      <div class="flex flex-col gap-4 py-4">
          <div>
              <label for="add-description" class="block font-bold mb-2">Descrição</label>
              <InputText id="add-description" v-model.trim="currentProcedure.description" required="true" autofocus :invalid="submitted && !currentProcedure.description" class="w-full" />
              <small v-if="submitted && !currentProcedure.description" class="text-red-500">A descrição é obrigatória.</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
              <div>
                  <label for="add-price" class="block font-bold mb-2">Valor (R$)</label>
                  <InputNumber id="add-price" v-model="currentProcedure.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
              </div>
              <div>
                  <label for="add-category" class="block font-bold mb-2">Classificação</label>
                  <Select id="add-category" v-model="currentProcedure.category" :options="categories" placeholder="Selecione" class="w-full"></Select>
              </div>
          </div>
      </div>

      <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
          <Button label="Salvar" icon="pi pi-check" @click="saveAddedProcedure" />
      </template>
  </Dialog>

  <Dialog v-model:visible="editDialogVisible" :style="{ width: '550px' }" header="Detalhes do Procedimento" :modal="true">
      <div class="flex flex-col gap-4 py-4">
          <div>
              <label for="edit-description" class="block font-bold mb-2">Descrição</label>
              <InputText id="edit-description" v-model.trim="currentProcedure.description" required="true" autofocus :invalid="submitted && !currentProcedure.description" class="w-full" />
              <small v-if="submitted && !currentProcedure.description" class="text-red-500">A descrição é obrigatória.</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
              <div>
                  <label for="edit-price" class="block font-bold mb-2">Valor (R$)</label>
                  <InputNumber id="edit-price" v-model="currentProcedure.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
              </div>
              <div>
                  <label for="edit-category" class="block font-bold mb-2">Classificação</label>
                  <Select id="edit-category" v-model="currentProcedure.category" :options="categories" placeholder="Selecione" class="w-full"></Select>
              </div>
          </div>
      </div>

      <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
          <Button label="Salvar" icon="pi pi-check" @click="saveEditedProcedure" />
      </template>
  </Dialog>

  <Dialog v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" :modal="true">
      <template #header>
          <div class="flex items-center gap-3">
              <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
              <span class="text-xl font-bold">Confirmar Exclusão</span>
          </div>
      </template>
      <div class="py-4">
          <span v-if="currentProcedure">Você tem certeza que quer deletar <b>{{ currentProcedure.description }}</b>?</span>
      </div>
      <template #footer>
          <Button label="Não" icon="pi pi-times" text @click="deleteDialogVisible = false" />
          <Button label="Sim" icon="pi pi-check" severity="danger" @click="executeDelete" />
      </template>
  </Dialog>

</template>

<script setup lang="ts">
import { ref } from 'vue';                
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import ContextMenu from 'primevue/contextmenu';
import { useRouter } from 'vue-router';

// --- INTERFACES ---
interface Procedure {
    id: string;
    status: string;
    description: string;
    price: number;
    category: string;
}

// --- MOCK DATA ---
const proceduresMock = ref<Procedure[]>([
    { id: '#0000001', status: 'Ativo', description: 'Clareamento Dental', price: 850.00, category: 'Procedimento'},
    { id: '#0000002', status: 'Inativo', description: 'Limpeza (Profilaxia)', price: 200.00, category: 'Procedimento' },
    { id: '#0000003', status: 'Ativo', description: 'Extração Siso', price: 450.00, category: 'Cirurgia' },    
    { id: '#0000004', status: 'Ativo', description: 'Extração Siso', price: 450.00, category: 'Cirurgia' },
    { id: '#0000005', status: 'Ativo', description: 'Extração Siso', price: 450.00, category: 'Cirurgia' },
    { id: '#0000006', status: 'Ativo', description: 'Extração Siso', price: 450.00, category: 'Cirurgia' },
    { id: '#0000007', status: 'Inativo', description: 'Limpeza (Profilaxia)', price: 200.00, category: 'Procedimento' },
    { id: '#0000008', status: 'Ativo', description: 'Limpeza (Profilaxia)', price: 200.00, category: 'Procedimento' },
    { id: '#0000009', status: 'Ativo', description: 'Extração Siso', price: 4110.00, category: 'Cirurgia' },
    { id: '#0000010', status: 'Inativo', description: 'Extração Siso', price: 950.00, category: 'Cirurgia' },
    { id: '#0000011', status: 'Inativo', description: 'Extração Siso', price: 950.00, category: 'Cirurgia' },
]);

const categories = ref(['Cirurgia', 'Procedimento', 'Laboratório']);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// --- TABLE STATES AND FILTERS ---
const selectedProcedure = ref();
const contextMenuSelection = ref();
const metaKey = ref(true);

const procedureFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: 'Ativo', matchMode: FilterMatchMode.EQUALS }, // Padrão setado para "Ativo"
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    price: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
});

// --- CONTEXT MENU LOGIC (RIGHT-CLICK) ---
const cm = ref();
const menuItems = ref([
    { 
        label: 'Reativar procedimento', 
        command: () => reactivateProcedure() 
    },
    { 
        label: 'Excluir procedimento'
    }
]);

const onRowContextMenu = (event: any) => {
    // Abre o menu apenas se o registro selecionado for "Inativo"
    if (contextMenuSelection.value && contextMenuSelection.value.status === 'Inativo') {
        cm.value.show(event.originalEvent);
    }
};

const reactivateProcedure = () => {
    if (contextMenuSelection.value) {
        const index = proceduresMock.value.findIndex(p => p.id === contextMenuSelection.value.id);
        const itemToReactivate = proceduresMock.value[index];
        // O TypeScript agora sabe que itemToReactivate não é undefined
        if (itemToReactivate) {
            itemToReactivate.status = 'Ativo';
        }
        
        contextMenuSelection.value = null; // Limpa a seleção do menu de contexto
    }
};

// --- DIALOG STATES ---
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);
const currentProcedure = ref<Procedure>({} as Procedure);

// --- ADD PROCEDURE LOGIC ---
const openAddDialog = () => {
    currentProcedure.value = {
        id: '',
        status: 'Ativo',
        description: '',
        price: 0,
        category: ''
    };
    submitted.value = false;
    addDialogVisible.value = true;
};

const closeAddDialog = () => {
    addDialogVisible.value = false;
    submitted.value = false;
};

const saveAddedProcedure = () => {
    submitted.value = true;

    if (currentProcedure.value.description?.trim()) {
        currentProcedure.value.id = '#' + Math.floor(Math.random() * 1000000).toString().padStart(7, '0');
        proceduresMock.value.unshift(currentProcedure.value);
        
        addDialogVisible.value = false;
        currentProcedure.value = {} as Procedure;
    }
};

// --- EDIT PROCEDURE LOGIC ---
const openEditDialog = (proc: Procedure) => {
    currentProcedure.value = { ...proc }; 
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    submitted.value = false;
};

const saveEditedProcedure = () => {
    submitted.value = true;

    if (currentProcedure.value.description?.trim()) {
        const index = proceduresMock.value.findIndex(p => p.id === currentProcedure.value.id);
        if (index !== -1) {
            proceduresMock.value[index] = currentProcedure.value;
        }

        editDialogVisible.value = false;
        currentProcedure.value = {} as Procedure;
    }
};

// --- DELETE PROCEDURE LOGIC ---
const confirmDeleteProcedure = (proc: Procedure) => {
    currentProcedure.value = { ...proc }; 
    deleteDialogVisible.value = true;
};

const executeDelete = () => {
    const index = proceduresMock.value.findIndex(p => p.id === currentProcedure.value.id);
    const itemToDeactivate = proceduresMock.value[index];

    if (itemToDeactivate) {
        itemToDeactivate.status = 'Inativo';
    }
    
    deleteDialogVisible.value = false;
    currentProcedure.value = {} as Procedure;
};

// --- MISC FUNCTIONS ---
const rowClass = (data: Procedure) => {
    return [{ 'inactive-row': data.status === 'Inativo' }];
};

const router = useRouter();
const accessHome = () => {
  router.push('/home');
};
</script>

<style scoped>
:deep(.procedure-table) {
    border-radius: 0.5rem; 
    border: 1px solid var(--p-surface-200); 
    overflow: hidden; 
}

:deep(.procedure-table .p-datatable-thead > tr > th) {
    background-color: var(--p-primary-50);
    color: var(--p-surface-600);
}

:deep(.procedure-table .p-datatable-tbody > tr:not(.p-highlight):hover > td) {
    background-color: var(--p-primary-50) !important;
    cursor: pointer;
}

:deep(.procedure-table .p-datatable-tbody > tr.p-highlight > td) {
    background-color: var(--p-primary-50) !important;
    color: var(--p-primary-900) !important;
}

:deep(.procedure-table .p-datatable-tbody > tr.inactive-row > td),
:deep(.procedure-table .p-datatable-tbody > tr.inactive-row > td *) {
    color: var(--p-surface-400) !important;   
}

:deep(.procedure-table .p-datatable-tbody > tr.inactive-row:not(.p-highlight):hover > td) {
    background-color: var(--p-primary-50) !important;
}
</style>