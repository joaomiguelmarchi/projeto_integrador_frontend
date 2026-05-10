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
                              v-model="procedureFilter['global'].value" 
                              placeholder="Pesquisar" 
                              class="py-1 px-2 text-sm h-[36px]" 
                          />
                      </IconField>
                      <Button 
                          icon="pi pi-plus" 
                          label="Adicionar" 
                          class="bg-[var(--p-primary-500)] hover:bg-[var(--p-primary-600)] border-none px-3 py-1 text-sm font-semibold text-white transition-colors h-[36px] flex items-center" 
                          @click="openNew"
                      />
                  </div>
              </div>

              <div class="flex-1 flex flex-col overflow-hidden p-5 pb-6">
                  <DataTable 
                      v-model:filters="procedureFilter"
                      v-model:selection="selectedProcedure"
                      :value="procedimentosMock" 
                      class="procedure-table flex-1"
                      scrollable 
                      scrollHeight="flex"
                      selectionMode="single"
                      :metaKeySelection="metaKey" 
                      dataKey="id"
                      filterDisplay="row"
                      :globalFilterFields="['status', 'id', 'descricao', 'valor', 'classificacao']"
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

                      <Column field="descricao" header="Descrição" :showFilterMenu="false">
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Descrição" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
                          </template>
                      </Column>

                      <Column field="valor" header="Valor" :showFilterMenu="false">
                          <template #body="{ data }">
                              {{ formatarMoeda(data.valor) }}
                          </template>
                          <template #filter="{ filterModel, filterCallback }">
                              <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Valor" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
                          </template>
                      </Column>
                      
                      <Column field="classificacao" header="Classificação" :showFilterMenu="false">
                          <template #filter="{ filterModel, filterCallback }">
                              <Select 
                                  v-model="filterModel.value" 
                                  @change="filterCallback()" 
                                  :options="classificacoes" 
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
                                <Button icon="pi pi-pencil" variant="outlined" rounded size="small" @click="editProcedure(slotProps.data)":disabled="slotProps.data.status === 'Inativo'"/>
                                <Button 
                                    icon="pi pi-trash" 
                                    variant="outlined" 
                                    rounded 
                                    severity="danger" 
                                    size="small" 
                                    @click="deleteProcedure(slotProps.data)" 
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

  <Dialog v-model:visible="editProcedureDialog" :style="{ width: '550px' }" header="Detalhes do Procedimento" :modal="true">
      <div class="flex flex-col gap-4 py-4">
          <div>
              <label for="descricao" class="block font-bold mb-2">Descrição</label>
              <InputText id="descricao" v-model.trim="procedure.descricao" required="true" autofocus :invalid="submitted && !procedure.descricao" class="w-full" />
              <small v-if="submitted && !procedure.descricao" class="text-red-500">A descrição é obrigatória.</small>
          </div>

          <div class="grid grid-cols-2 gap-4">
              <div>
                  <label for="valor" class="block font-bold mb-2">Valor (R$)</label>
                  <InputNumber id="valor" v-model="procedure.valor" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
              </div>
              <div>
                  <label for="classificacao" class="block font-bold mb-2">Classificação</label>
                  <Select id="classificacao" v-model="procedure.classificacao" :options="classificacoes" placeholder="Selecione" class="w-full"></Select>
              </div>
          </div>
      </div>

      <template #footer>
          <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
          <Button label="Salvar" icon="pi pi-check" @click="saveProcedure" />
      </template>
  </Dialog>

  <Dialog v-model:visible="deleteProcedureDialog" :style="{ width: '450px' }" header="Confirmar Exclusão" :modal="true">
      <div class="flex items-center gap-4 py-4">
          <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
          <span v-if="procedure">Você tem certeza que quer deletar <b>{{ procedure.descricao }}</b>?</span>
      </div>
      <template #footer>
          <Button label="Não" icon="pi pi-times" text @click="deleteProcedureDialog = false" />
          <Button label="Sim" icon="pi pi-check" severity="danger" @click="confirmDelete" />
      </template>
  </Dialog>

</template>

<script setup lang="ts">
interface Procedimento {
    id: string;
    status: string;
    descricao: string;
    valor: number;
    classificacao: string;
}

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
import { useRouter } from 'vue-router'

const procedimentosMock = ref([
    { id: '#0000001', status: 'Ativo', descricao: 'Clareamento Dental', valor: 850.00, classificacao: 'Procedimento'},
    { id: '#0000002', status: 'Inativo', descricao: 'Limpeza (Profilaxia)', valor: 200.00, classificacao: 'Procedimento' },
    { id: '#0000003', status: 'Ativo', descricao: 'Extração Siso', valor: 450.00, classificacao: 'Cirurgia' },    
    { id: '#0000004', status: 'Ativo', descricao: 'Extração Siso', valor: 450.00, classificacao: 'Cirurgia' },
    { id: '#0000005', status: 'Ativo', descricao: 'Extração Siso', valor: 450.00, classificacao: 'Cirurgia' },
    { id: '#0000006', status: 'Ativo', descricao: 'Extração Siso', valor: 450.00, classificacao: 'Cirurgia' },
    { id: '#0000007', status: 'Inativo', descricao: 'Limpeza (Profilaxia)', valor: 200.00, classificacao: 'Procedimento' },
    { id: '#0000008', status: 'Ativo', descricao: 'Limpeza (Profilaxia)', valor: 200.00, classificacao: 'Procedimento' },
    { id: '#0000009', status: 'Ativo', descricao: 'Extração Siso', valor: 4110.00, classificacao: 'Cirurgia' },
    { id: '#0000010', status: 'Inativo', descricao: 'Extração Siso', valor: 950.00, classificacao: 'Cirurgia' },
    { id: '#0000011', status: 'Inativo', descricao: 'Extração Siso', valor: 950.00, classificacao: 'Cirurgia' },
]);

const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};

// --- ESTADOS DA TABELA E FILTROS ---
const selectedProcedure = ref();
const metaKey = ref(true);
const classificacoes = ref(['Cirurgia', 'Procedimento', 'Laboratório']);

const procedureFilter = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    descricao: { value: null, matchMode: FilterMatchMode.CONTAINS },
    valor: { value: null, matchMode: FilterMatchMode.CONTAINS },
    classificacao: { value: null, matchMode: FilterMatchMode.EQUALS },
});

// --- LÓGICA DE EDIÇÃO/CRIAÇÃO ---
const editProcedureDialog = ref(false);
const submitted = ref(false);
const procedure = ref<Procedimento>({} as Procedimento);

const openNew = () => {
    procedure.value = {
        id: '',
        status: 'Ativo',
        descricao: '',
        valor: 0,
        classificacao: ''
    };
    submitted.value = false;
    editProcedureDialog.value = true;
};

const hideDialog = () => {
    editProcedureDialog.value = false;
    submitted.value = false;
};

const editProcedure = (proc: Procedimento) => {
    procedure.value = { ...proc }; 
    editProcedureDialog.value = true;
};

const saveProcedure = () => {
    submitted.value = true;

    if (procedure.value.descricao?.trim()) {
        if (procedure.value.id) {
            const index = procedimentosMock.value.findIndex(p => p.id === procedure.value.id);
            if (index !== -1) {
                procedimentosMock.value[index] = procedure.value;
            }
        } else {
            procedure.value.id = '#' + Math.floor(Math.random() * 1000000).toString().padStart(7, '0');
            procedimentosMock.value.unshift(procedure.value);
        }

        editProcedureDialog.value = false;
        procedure.value = {} as Procedimento;
    }
};

// --- LÓGICA DE EXCLUSÃO ---
const deleteProcedureDialog = ref(false);

const deleteProcedure = (proc: Procedimento) => {
    procedure.value = { ...proc }; // Copia os dados da linha clicada para exibir o nome na mensagem
    deleteProcedureDialog.value = true;
};

const confirmDelete = () => {
    const index = procedimentosMock.value.findIndex(p => p.id === procedure.value.id);
    
    // Pegamos a referência do item
    const itemParaInativar = procedimentosMock.value[index];

    // Se o item existir (não for undefined), alteramos o status
    if (itemParaInativar) {
        itemParaInativar.status = 'Inativo';
    }
    
    deleteProcedureDialog.value = false;
    procedure.value = {} as Procedimento;
};

// --- OUTRAS FUNÇÕES ---
const rowClass = (data: Procedimento) => {
    return [{ 'linha-inativa': data.status === 'Inativo' }];
};

const router = useRouter()
const accessHome = () => {
  router.push('/home')
}
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

:deep(.procedure-table .p-datatable-tbody > tr.linha-inativa > td),
:deep(.procedure-table .p-datatable-tbody > tr.linha-inativa > td *) {
    color: var(--p-surface-400) !important;   
}

:deep(.procedure-table .p-datatable-tbody > tr.linha-inativa:not(.p-highlight):hover > td) {
    background-color: var(--p-primary-50) !important;
}
</style>