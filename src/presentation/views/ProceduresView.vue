<template>
    <div class="bg-[var(--p-surface-100)] h-screen w-full flex overflow-hidden font-sans text-[var(--p-surface-800)]">
        
        <aside class="w-64 bg-[var(--p-surface-100)] border-r border-[var(--p-surface-200)] flex flex-col z-10 shadow-[4px_0_24px_rgba(0,0,0,0.04)]">
            <div class="h-[72px] flex items-center px-6 border-b border-transparent gap-3" >
                <Image :src="logoUrl" alt="Logo Odontohub" width="30" />
                <span class="text-xl font-extrabold text-[var(--p-primary-600)] tracking-tight">SMILEHUB</span>
            </div>
            
            <nav class="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
                <button @click="accessHome()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-home text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Início</span>
                </button>
                <button @click="accessPatientRegistration()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-users text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Cadastro de Paciente</span>
                </button>
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-folder text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Conta Paciente</span>
                </button>
                <button @click="accessQuotation()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-dollar text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Orçamento</span>
                </button>
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-calendar text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Agenda</span>
                </button>
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-receipt text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Faturamento</span>
                </button>
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--p-surface-0)] text-[var(--p-primary-600)] transition-all text-left cursor-pointer shadow-sm">
                    <i class="pi pi-list text-[var(--p-primary-600)]"></i>
                    <span class="font-semibold text-[15px]">Procedimentos</span>
                </button>
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group mt-auto">
                    <i class="pi pi-cog text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Configurações</span>
                </button>
            </nav>
        </aside>

        <main class="flex-1 flex flex-col overflow-hidden"> 
            
            <header class="h-[72px] bg-[var(--p-surface-100)] flex items-center justify-between px-8 shrink-0">
                <h1 class="text-[22px] font-bold text-[var(--p-surface-600)] m-0 tracking-tight">Procedimentos</h1>
            </header>

            <div class="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
                    
                    <div class="flex justify-between items-center p-5 border-b border-[var(--p-surface-200)]">
                        <div class="flex items-center gap-2">
                            <IconField>
                                <InputIcon class="flex items-center">
                                    <i class="pi pi-search text-[var(--p-surface-400)]" />
                                </InputIcon>
                                <InputText 
                                    v-model="procedureFilters['global'].value" 
                                    placeholder="Pesquisar" 
                                    class="py-2 px-3 pl-10 h-9 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-full w-64 focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow" 
                                />
                            </IconField>
                        </div>
                        
                        <div class="flex items-center gap-3">
                            <Button 
                                icon="pi pi-plus" 
                                label="Adicionar" 
                                class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2  !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center !rounded-lg ml-2 shadow-md" 
                                @click="openAddDialog"
                            />
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col overflow-hidden px-2 pb-2">
                    <DataTable 
                    v-model:filters="procedureFilters"
                    v-model:selection="selectedProcedure"
                    v-model:contextMenuSelection="contextMenuSelection"
                    @rowContextmenu="onRowContextMenu"
                    :value="proceduresMock" 
                    class="procedure-table flex-1 px-4 " 
                    scrollable 
                    scrollHeight="flex"
                    selectionMode="single"
                    :metaKeySelection="metaKey" 
                    dataKey="id"
                    filterDisplay="row"
                    :globalFilterFields="['status', 'id', 'description', 'price', 'category']"
                    :rowClass="rowClass"
                    >   
                        <template #empty> 
                            <div class="flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]">
                                <i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]"></i>
                                <p class="font-medium text-[var(--p-surface-500)]">Nenhum procedimento encontrado.</p>
                            </div> 
                        </template>
                        <template #loading> 
                            <div class="text-center py-8 text-[var(--p-surface-500)] font-medium flex items-center justify-center gap-3">
                                <i class="pi pi-spin pi-spinner text-xl"></i>
                                Carregando dados...
                            </div> 
                        </template>

                        <Column field="status" header="Status" :showFilterMenu="false" style="width: 8rem">
                            <template #body="{ data }">
                                <div class="flex justify-left w-full pl-2">
                                    <span 
                                        class="px-4 py-1.5 rounded-full inline-flex items-center gap-2" 
                                        :class="data.status === 'Ativo' ? 'bg-[var(--p-surface-0)] text-[var(--p-surface-500)] border border-[var(--p-surface-300)]' : 'bg-[var(--p-surface-0)] text-[var(--p-surface-500)] border border-[var(--p-surface-300)]'">
                                        <span class="w-2.5 h-2.5 rounded-full" :style="data.status === 'Ativo' ? 'background-color: var(--p-primary-1000)' : 'background-color: var(--p-surface-500)'"></span>
                                        {{ data.status }}
                                    </span>
                                </div>
                            </template>
                            <template #filter="{ filterModel, filterCallback }">
                                <Select 
                                    v-model="filterModel.value" 
                                    @change="filterCallback()" 
                                    :options="['Ativo', 'Inativo']" 
                                    placeholder="Todos" 
                                    class="w-full h-[36px] text-sm bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-md flex items-center" 
                                    :showClear="true"
                                >
                                </Select>
                            </template>
                        </Column>
                        
                        <Column field="id" header="ID Procedimento" :showFilterMenu="false" style="width: 12rem">
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full"  />
                            </template>
                        </Column>

                        <Column field="description" header="Descrição" :showFilterMenu="false">
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Descrição" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
                            </template>
                        </Column>

                        <Column field="price" header="Valor" :showFilterMenu="false" style="width: 12rem">
                            <template #body="{ data }">
                                {{ formatCurrency(data.price) }}
                            </template>
                            <template #filter="{ filterModel, filterCallback }">
                                <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Valor" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                            </template>
                        </Column>

                        <Column field="category" header="Classificação" :showFilterMenu="false" style="width: 12rem">
                            <template #filter="{ filterModel, filterCallback }">
                                <Select 
                                    v-model="filterModel.value" 
                                    @change="filterCallback()" 
                                    :options="categories" 
                                    placeholder="Selecione" 
                                    class="py-1 px-2 text-sm h-[36px] flex items-center w-full" 
                                    :showClear="true"
                                >
                                </Select>
                            </template>
                        </Column>

                        <Column :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex justify-center gap-2 pr-2">
                                <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'"/>
                                <Button icon="pi pi-trash" variant="outlined" rounded  severity="danger" size="small" @click="confirmDeleteProcedure(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'"
                                />
                            </div>
                        </template>
                        </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

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
import logoUrl from '../../assets/LogoAzul.png'
import Image from 'primevue/image'

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
    { id: '#0000004', status: 'Ativo', description: 'Restauração Resina', price: 150.00, category: 'Procedimento' },
    { id: '#0000005', status: 'Ativo', description: 'Implante Dentário', price: 2450.00, category: 'Cirurgia' },
    { id: '#0000006', status: 'Ativo', description: 'Tratamento de Canal', price: 600.00, category: 'Cirurgia' },
    { id: '#0000007', status: 'Inativo', description: 'Prótese Fixa', price: 1200.00, category: 'Laboratório' },
    { id: '#0000008', status: 'Ativo', description: 'Manutenção Aparelho', price: 120.00, category: 'Procedimento' },
    { id: '#0000009', status: 'Ativo', description: 'Enxerto Ósseo', price: 1110.00, category: 'Cirurgia' },
    { id: '#0000010', status: 'Inativo', description: 'Coroa de Porcelana', price: 950.00, category: 'Laboratório' },
    { id: '#0000011', status: 'Inativo', description: 'Placa de Bruxismo', price: 350.00, category: 'Laboratório' },
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
    status: { value: 'Ativo', matchMode: FilterMatchMode.EQUALS },
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    price: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
});

// --- CONTEXT MENU LOGIC ---
const cm = ref();
const menuItems = ref([
    { 
        label: 'Reativar procedimento', 
        icon: 'pi pi-refresh',
        command: () => reactivateProcedure() 
    },
    { 
        label: 'Excluir permanentemente',
        icon: 'pi pi-trash',
        class: 'text-[var(--p-primary-1010)]'
    }
]);

const onRowContextMenu = (event: any) => {
    if (contextMenuSelection.value && contextMenuSelection.value.status === 'Inativo') {
        cm.value.show(event.originalEvent);
    }
};

const reactivateProcedure = () => {
    if (contextMenuSelection.value) {
        const index = proceduresMock.value.findIndex(p => p.id === contextMenuSelection.value.id);
        const itemToReactivate = proceduresMock.value[index];
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
    return [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': data.status === 'Inativo' }];
};

const router = useRouter();
const accessHome = () => {
  router.push('/inicio');
};
const accessPatientRegistration = () => {
  router.push('/cadastroPaciente');
};
const accessQuotation = () => {
  router.push('/orcamento');
};
</script>

<style scoped>
:deep(.procedure-table .p-datatable-thead > tr > th) {
    background-color: transparent;
    color: var(--p-surface-600);
    border-bottom: 1px solid var(--p-surface-100); 
    padding: 1rem 0.75rem;
}

:deep(.procedure-table .p-datatable-thead > tr:nth-child(2) > th) {
    padding-top: 1rem;
    padding-bottom: 1rem;
    background-color: transparent;
    border-bottom: 1px solid var(--p-surface-100);
}

:deep(.procedure-table .p-datatable-thead > tr > th:first-child),
:deep(.procedure-table .p-datatable-tbody > tr > td:first-child) {
    padding-left: 0;
}
:deep(.procedure-table .p-datatable-thead > tr > th:last-child),
:deep(.procedure-table .p-datatable-tbody > tr > td:last-child) {
    padding-right: 0;
}

:deep(.procedure-table .p-datatable-thead > tr > th) {
    background-color: transparent;
    color: var(--p-surface-600);
    border-bottom: 1px solid var(--p-surface-200); 
    padding: 1rem 0.75rem;
}

:deep(.procedure-table .p-datatable-thead > tr:nth-child(2) > th) {
    padding-top: 1rem;
    padding-bottom: 1rem;
    background-color: transparent;
    border-bottom: 1px solid var(--p-surface-200); 
}

:deep(.procedure-table .p-datatable-tbody > tr > td) {
    padding: 1rem 0.75rem;
    border-bottom: 1px solid var(--p-surface-200); 
}

</style>