<template>
  <div class="bg-[var(--p-surface-200)] h-screen w-full flex overflow-hidden">
      
      <aside class="w-64 bg-white border-r border-[var(--p-surface-200)] flex flex-col">
          <div class="h-16 flex items-center px-6 border-b border-[var(--p-surface-200)]">
              <span class="text-xl font-bold text-[var(--p-primary-500)]">SMILEHUB</span>
          </div>
          
          <nav class="flex-1 flex flex-col gap-2 p-4">
              <button @click="accessHome()" class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-home"></i>
                  <span class="font-medium">Início</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md bg-[var(--p-primary-50)] text-[var(--p-primary-700)] transition-colors text-left cursor-pointer">
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
              <button @click="accessProcedures()" class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left cursor-pointer">
                  <i class="pi pi-list"></i>
                  <span class="font-medium">Procedimentos</span>
              </button>
              <button class="flex items-center gap-3 px-3 py-2 rounded-md text-slate-600 hover:bg-[var(--p-surface-100)] transition-colors text-left mt-auto cursor-pointer">
                  <i class="pi pi-cog"></i>
                  <span class="font-medium">Configurações</span>
              </button>
          </nav>
      </aside>

      <main class="flex-1 flex flex-col p-4 overflow-hidden"> 
          <div class="bg-white rounded-lg shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-300)]">
              
              <div class="flex justify-between items-center p-5 border-b border-[var(--p-surface-200)]">
                  <div class="flex items-center gap-3">
                      <h2 class="text-xl font-bold text-[var(--p-surface-500)] m-0 tracking-[0.5px]">
                            PACIENTES
                      </h2>
                  </div>
                  
                  <div class="flex items-center gap-3">
                      <IconField>
                          <InputIcon class="flex items-center">
                              <i class="pi pi-search" />
                          </InputIcon>
                          <InputText 
                              v-model="patientFilters['global'].value" 
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
                      v-model:filters="patientFilters"
                      v-model:selection="selectedPatient"
                      v-model:contextMenuSelection="contextMenuSelection"
                      @rowContextmenu="onRowContextMenu"
                      :value="patientsMock" 
                      class="patient-table flex-1"
                      scrollable 
                      scrollHeight="flex"
                      selectionMode="single"
                      :metaKeySelection="metaKey" 
                      dataKey="id"
                      filterDisplay="row"
                      :globalFilterFields="['status', 'id', 'name', 'cpf', 'mobilePhone']"
                      :rowClass="rowClass"
                  >   
                      <template #empty> Nenhum paciente encontrado. </template>
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
                      
                      <Column field="id" header="ID Paciente" :showFilterMenu="false" style="width: 12rem">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full"  />
                          </template>
                      </Column>

                      <Column field="name" header="Nome do Paciente" :showFilterMenu="false">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Nome" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                          </template>
                      </Column>

                      <Column field="cpf" header="CPF" :showFilterMenu="false" style="width: 15rem">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar CPF" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                          </template>
                      </Column>

                      <Column field="mobilePhone" header="Celular" :showFilterMenu="false" style="width: 15rem">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Celular" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                          </template>
                      </Column>

                      <Column :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex justify-end gap-2 pr-2">
                                <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'"/>
                                <Button 
                                    icon="pi pi-trash" 
                                    variant="outlined" 
                                    rounded 
                                    severity="danger" 
                                    size="small" 
                                    @click="confirmDeletePatient(slotProps.data)" 
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

  <Dialog v-model:visible="addDialogVisible" :style="{ width: '800px' }" header="Adicionar Paciente" :modal="true" class="p-fluid">
      <div class="grid grid-cols-12 gap-4 py-4">
          
          <div class="col-span-12 md:col-span-8">
              <label for="add-name" class="block font-bold mb-2">Nome Completo</label>
              <InputText id="add-name" v-model.trim="currentPatient.name" required="true" autofocus :invalid="submitted && !currentPatient.name" class="w-full" />
              <small v-if="submitted && !currentPatient.name" class="text-red-500">O nome é obrigatório.</small>
          </div>
          <div class="col-span-12 md:col-span-4">
              <label for="add-cpf" class="block font-bold mb-2">CPF</label>
              <InputText id="add-cpf" v-model="currentPatient.cpf" placeholder="000.000.000-00" :invalid="submitted && !currentPatient.cpf" class="w-full" />
              <small v-if="submitted && !currentPatient.cpf" class="text-red-500">O CPF é obrigatório.</small>
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="add-birth" class="block font-bold mb-2">Data de Nascimento</label>
              <InputText id="add-birth" type="date" v-model="currentPatient.birthDate" class="w-full" />
          </div>
          
          <div class="col-span-12 md:col-span-4">
              <label for="add-gender" class="block font-bold mb-2">Sexo</label>
              <Select id="add-gender" v-model="currentPatient.gender" :options="genders" placeholder="Selecione" class="w-full" />
          </div>

          <div class="col-span-12">
              <label for="add-responsible" class="block font-bold mb-2">Nome do Responsável</label>
              <InputText id="add-responsible" v-model="currentPatient.responsibleName" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="add-zip" class="block font-bold mb-2">CEP</label>
              <InputText id="add-zip" v-model="currentPatient.zipCode" placeholder="00000-000" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-8">
              <label for="add-address" class="block font-bold mb-2">Endereço Completo</label>
              <InputText id="add-address" v-model="currentPatient.address" class="w-full" />
          </div>
          
          <div class="col-span-12 md:col-span-4">
              <label for="add-home-phone" class="block font-bold mb-2">Telefone Residencial</label>
              <InputText id="add-home-phone" v-model="currentPatient.homePhone" placeholder="(00) 0000-0000" class="w-full" />
          </div>
          <div class="col-span-12 md:col-span-4">
              <label for="add-mobile-phone" class="block font-bold mb-2">Celular Pessoal</label>
              <InputText id="add-mobile-phone" v-model="currentPatient.mobilePhone" placeholder="(00) 90000-0000" class="w-full" />
          </div>
          <div class="col-span-12 md:col-span-4">
              <label for="add-work-phone" class="block font-bold mb-2">Celular Comercial</label>
              <InputText id="add-work-phone" v-model="currentPatient.workMobilePhone" placeholder="(00) 90000-0000" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-6">
              <label for="add-email" class="block font-bold mb-2">E-mail</label>
              <InputText id="add-email" type="email" v-model="currentPatient.email" placeholder="paciente@exemplo.com" class="w-full" />
          </div>
          <div class="col-span-12 md:col-span-6">
              <label for="add-profession" class="block font-bold mb-2">Profissão</label>
              <InputText id="add-profession" v-model="currentPatient.profession" class="w-full" />
          </div>

      </div>

      <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
          <Button label="Salvar" icon="pi pi-check" @click="saveAddedPatient" />
      </template>
  </Dialog>

  <Dialog v-model:visible="editDialogVisible" :style="{ width: '800px' }" header="Detalhes do Paciente" :modal="true" class="p-fluid">
      <div class="grid grid-cols-12 gap-4 py-4">
          
          <div class="col-span-12 md:col-span-8">
              <label for="edit-name" class="block font-bold mb-2">Nome Completo</label>
              <InputText id="edit-name" v-model.trim="currentPatient.name" required="true" autofocus :invalid="submitted && !currentPatient.name" class="w-full" />
              <small v-if="submitted && !currentPatient.name" class="text-red-500">O nome é obrigatório.</small>
          </div>
          <div class="col-span-12 md:col-span-4">
              <label for="edit-cpf" class="block font-bold mb-2">CPF</label>
              <InputText id="edit-cpf" v-model="currentPatient.cpf" placeholder="000.000.000-00" :invalid="submitted && !currentPatient.cpf" class="w-full" />
              <small v-if="submitted && !currentPatient.cpf" class="text-red-500">O CPF é obrigatório.</small>
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="edit-birth" class="block font-bold mb-2">Data de Nascimento</label>
              <InputText id="edit-birth" type="date" v-model="currentPatient.birthDate" class="w-full" />
          </div>
        
          <div class="col-span-12 md:col-span-4">
              <label for="edit-gender" class="block font-bold mb-2">Sexo</label>
              <Select id="edit-gender" v-model="currentPatient.gender" :options="genders" placeholder="Selecione" class="w-full" />
          </div>

          <div class="col-span-12">
              <label for="edit-responsible" class="block font-bold mb-2">Nome do Responsável (se menor)</label>
              <InputText id="edit-responsible" v-model="currentPatient.responsibleName" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="edit-zip" class="block font-bold mb-2">CEP</label>
              <InputText id="edit-zip" v-model="currentPatient.zipCode" placeholder="00000-000" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-8">
              <label for="edit-address" class="block font-bold mb-2">Endereço Completo</label>
              <InputText id="edit-address" v-model="currentPatient.address" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="edit-home-phone" class="block font-bold mb-2">Telefone Residencial</label>
              <InputText id="edit-home-phone" v-model="currentPatient.homePhone" placeholder="(00) 0000-0000" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="edit-mobile-phone" class="block font-bold mb-2">Celular Pessoal</label>
              <InputText id="edit-mobile-phone" v-model="currentPatient.mobilePhone" placeholder="(00) 90000-0000" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-4">
              <label for="edit-work-phone" class="block font-bold mb-2">Celular Comercial</label>
              <InputText id="edit-work-phone" v-model="currentPatient.workMobilePhone" placeholder="(00) 90000-0000" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-6">
              <label for="edit-email" class="block font-bold mb-2">E-mail</label>
              <InputText id="edit-email" type="email" v-model="currentPatient.email" placeholder="paciente@exemplo.com" class="w-full" />
          </div>

          <div class="col-span-12 md:col-span-6">
              <label for="edit-profession" class="block font-bold mb-2">Profissão</label>
              <InputText id="edit-profession" v-model="currentPatient.profession" class="w-full" />
          </div>

      </div>

      <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
          <Button label="Salvar" icon="pi pi-check" @click="saveEditedPatient" />
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
          <span v-if="currentPatient">Você tem certeza que quer deletar o paciente <b>{{ currentPatient.name }}</b>?</span>
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
interface Patient {
    id: string;
    status: string;
    name: string;
    birthDate: string;
    age: number | null;
    gender: string;
    responsibleName: string;
    cpf: string;
    address: string;
    zipCode: string;
    homePhone: string;
    mobilePhone: string;
    profession: string;
    workMobilePhone: string;
    email: string;
}

// --- MOCK DATA ---
const patientsMock = ref<Patient[]>([
    { 
        id: '#0000001', status: 'Ativo', name: 'João Silva Oliveira', cpf: '111.222.333-44', birthDate: '1985-10-15', age: 38, gender: 'Masculino', responsibleName: '', 
        address: 'Rua das Flores, 123, Centro', zipCode: '89010-000', homePhone: '(47) 3322-1100', mobilePhone: '(47) 99123-4567', profession: 'Engenheiro', workMobilePhone: '(47) 98888-0000', email: 'joao.silva@email.com'
    },
    { 
        id: '#0000002', status: 'Ativo', name: 'Maria Santos Souza', cpf: '555.666.777-88', birthDate: '1992-05-20', age: 31, gender: 'Feminino', responsibleName: '', 
        address: 'Av. Paulista, 1500, Bela Vista', zipCode: '01310-100', homePhone: '', mobilePhone: '(11) 99999-1111', profession: 'Arquiteta', workMobilePhone: '', email: 'maria.arq@email.com'
    },
    { 
        id: '#0000003', status: 'Inativo', name: 'Pedro Almeida', cpf: '999.888.777-66', birthDate: '2012-08-10', age: 11, gender: 'Masculino', responsibleName: 'Carlos Almeida', 
        address: 'Rua XV de Novembro, 800', zipCode: '89010-120', homePhone: '(47) 3333-2222', mobilePhone: '(47) 99999-3333', profession: 'Estudante', workMobilePhone: '', email: 'carlos.almeida@email.com'
    },
    { 
        id: '#0000004', status: 'Ativo', name: 'Ana Costa', cpf: '123.456.789-00', birthDate: '1970-12-01', age: 53, gender: 'Feminino', responsibleName: '', 
        address: 'Rua Sete de Setembro, 50', zipCode: '89010-200', homePhone: '(47) 3222-5555', mobilePhone: '(47) 98888-4444', profession: 'Professora', workMobilePhone: '(47) 97777-1111', email: 'ana.costa@email.com'
    },
    { 
        id: '#0000005', status: 'Inativo', name: 'Lucas Ferreira', cpf: '321.654.987-11', birthDate: '1998-03-25', age: 26, gender: 'Masculino', responsibleName: '', 
        address: 'Rua Humberto de Campos, 900', zipCode: '89036-050', homePhone: '', mobilePhone: '(47) 99111-2222', profession: 'Desenvolvedor', workMobilePhone: '', email: 'lucas.dev@email.com'
    }
]);

const genders = ref(['Masculino', 'Feminino', 'Outro']);

// --- TABLE STATES AND FILTERS ---
const selectedPatient = ref();
const contextMenuSelection = ref();
const metaKey = ref(true);

const patientFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: 'Ativo', matchMode: FilterMatchMode.EQUALS },
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    cpf: { value: null, matchMode: FilterMatchMode.CONTAINS },
    mobilePhone: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// --- CONTEXT MENU LOGIC (RIGHT-CLICK) ---
const cm = ref();
const menuItems = ref([
    { 
        label: 'Reativar paciente', 
        command: () => reactivatePatient() 
    }
]);

const onRowContextMenu = (event: any) => {
    if (contextMenuSelection.value && contextMenuSelection.value.status === 'Inativo') {
        cm.value.show(event.originalEvent);
    }
};

const reactivatePatient = () => {
    if (contextMenuSelection.value) {
        const index = patientsMock.value.findIndex(p => p.id === contextMenuSelection.value.id);
        const itemToReactivate = patientsMock.value[index];
        if (itemToReactivate) {
            itemToReactivate.status = 'Ativo';
        }
        contextMenuSelection.value = null; 
    }
};

// --- DIALOG STATES ---
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);

const getEmptyPatient = (): Patient => ({
    id: '', status: 'Ativo', name: '', birthDate: '', age: null, gender: '', responsibleName: '', 
    cpf: '', address: '', zipCode: '', homePhone: '', mobilePhone: '', profession: '', workMobilePhone: '', email: ''
});

const currentPatient = ref<Patient>(getEmptyPatient());

// --- ADD PATIENT LOGIC ---
const openAddDialog = () => {
    currentPatient.value = getEmptyPatient();
    submitted.value = false;
    addDialogVisible.value = true;
};

const closeAddDialog = () => {
    addDialogVisible.value = false;
    submitted.value = false;
};

const saveAddedPatient = () => {
    submitted.value = true;

    if (currentPatient.value.name?.trim() && currentPatient.value.cpf?.trim()) {
        currentPatient.value.id = '#' + Math.floor(Math.random() * 1000000).toString().padStart(7, '0');
        patientsMock.value.unshift(currentPatient.value);
        
        addDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
    }
};

// --- EDIT PATIENT LOGIC ---
const openEditDialog = (patient: Patient) => {
    currentPatient.value = { ...patient }; 
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    submitted.value = false;
};

const saveEditedPatient = () => {
    submitted.value = true;

    if (currentPatient.value.name?.trim() && currentPatient.value.cpf?.trim()) {
        const index = patientsMock.value.findIndex(p => p.id === currentPatient.value.id);
        if (index !== -1) {
            patientsMock.value[index] = currentPatient.value;
        }

        editDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
    }
};

// --- DELETE PATIENT LOGIC ---
const confirmDeletePatient = (patient: Patient) => {
    currentPatient.value = { ...patient }; 
    deleteDialogVisible.value = true;
};

const executeDelete = () => {
    const index = patientsMock.value.findIndex(p => p.id === currentPatient.value.id);
    const itemToDeactivate = patientsMock.value[index];

    if (itemToDeactivate) {
        itemToDeactivate.status = 'Inativo';
    }
    
    deleteDialogVisible.value = false;
    currentPatient.value = getEmptyPatient();
};

// --- MISC FUNCTIONS ---
const rowClass = (data: Patient) => {
    return [{ 'inactive-row': data.status === 'Inativo' }];
};

const router = useRouter();
const accessHome = () => {
  router.push('/home');
};
const accessProcedures = () => {
  router.push('/procedures');
};
</script>

<style scoped>
:deep(.patient-table) {
    border-radius: 0.5rem; 
    border: 1.5px solid var(--p-surface-300); 
    overflow: hidden; 
}

:deep(.patient-table .p-datatable-thead > tr > th) {
    background-color: var(--p-primary-50);
    color: var(--p-surface-600);
}

:deep(.patient-table .p-datatable-tbody > tr:not(.p-highlight):hover > td) {
    background-color: var(--p-primary-50) !important;
    cursor: pointer;
}

:deep(.patient-table .p-datatable-tbody > tr.p-highlight > td) {
    background-color: var(--p-primary-50) !important;
    color: var(--p-primary-900) !important;
}

:deep(.patient-table .p-datatable-tbody > tr.inactive-row > td),
:deep(.patient-table .p-datatable-tbody > tr.inactive-row > td *) {
    color: var(--p-surface-400) !important;   
}

:deep(.patient-table .p-datatable-tbody > tr.inactive-row:not(.p-highlight):hover > td) {
    background-color: var(--p-primary-50) !important;
}
</style>