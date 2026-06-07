<template>
    <AppLayout title="Orçamentos">

                <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
                    
                    <div class="flex justify-between items-center p-5 border-b border-[var(--p-surface-200)]">
                        <div class="flex items-center gap-2">
                            <IconField>
                                <InputIcon class="flex items-center">
                                    <i class="pi pi-search text-[var(--p-surface-400)]" />
                                </InputIcon>
                                <InputText 
                                    v-model="quotationFilters['global'].value" 
                                    placeholder="Pesquisar" 
                                    class="py-2 px-3 pl-10 h-9 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-full w-64 focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow" 
                                />
                            </IconField>
                        </div>
                        
                        <div class="flex items-center gap-3">
                            <Button 
                                icon="pi pi-plus" 
                                label="Adicionar" 
                                class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center !rounded-lg ml-2 shadow-md" 
                                @click="openAddDialog"
                            />
                        </div>
                    </div>

                    <div class="flex-1 flex flex-col overflow-hidden px-2 pb-2">
                        <DataTable 
                            v-model:filters="quotationFilters"
                            v-model:selection="selectedQuotation"
                            v-model:contextMenuSelection="contextMenuSelection"
                            @rowContextmenu="onRowContextMenu"
                            :value="quotationsMock" 
                            class="app-table flex-1 px-4" 
                            scrollable 
                            scrollHeight="flex"
                            selectionMode="single"
                            :metaKeySelection="metaKey" 
                            dataKey="id"
                            filterDisplay="row"
                            :globalFilterFields="['status', 'id', 'patientName', 'patientCpf', 'totalValue', 'generationDate']"
                            :rowClass="rowClass"
                            paginator
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 20]"
                            paginatorTemplate="RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink "
                            currentPageReportTemplate="{first} - {last} de {totalRecords}"
                        >   
                            <template #empty> 
                                <div class="flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]">
                                    <i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]"></i>
                                    <p class="font-medium text-[var(--p-surface-500)]">Nenhum orçamento encontrado.</p>
                                </div> 
                            </template>
                            
                            <template #loading> 
                                <div class="text-center py-8 text-[var(--p-surface-500)] font-medium flex items-center justify-center gap-3">
                                    <i class="pi pi-spin pi-spinner text-xl"></i>
                                    Carregando dados...
                                </div> 
                            </template>

                            <Column field="status" header="Status" :showFilterMenu="false" style="width: 8rem;">
                                <template #body="{ data }">
                                    <div class="flex justify-left w-full pl-2">
                                        <span class="px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-[var(--p-surface-300)] bg-[var(--p-surface-0)] text-[var(--p-surface-500)]">
                                            <span class="w-3 h-3 rounded-full" :style="getStatusStyle(data.status)"></span>
                                            {{ data.status }}
                                        </span>
                                    </div>
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <Select 
                                        v-model="filterModel.value" 
                                        @change="filterCallback()" 
                                        :options="statusOptions" 
                                        placeholder="Todos" 
                                        class="w-full h-[36px] text-sm bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-md flex items-center" 
                                        :showClear="true" 
                                    />
                                </template>
                            </Column>

                            <Column field="id" header="ID Orçamento" :showFilterMenu="false" style="width: 12rem;">
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full"  />
                                </template>
                            </Column>

                            <Column field="generationDate" header="Data de Geração" :showFilterMenu="false" style="width: 12rem;">
                                <template #body="{ data }">
                                    {{ formatDate(data.generationDate) }}
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Data" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                                </template>
                            </Column>

                            <Column field="patientName" header="Nome do Paciente" :showFilterMenu="false" >
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Paciente" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                                </template>
                            </Column>

                            <Column field="totalValue" header="Valor Total" :showFilterMenu="false" style="width: 12rem;">
                                <template #body="{ data }">
                                    {{ formatCurrency(data.totalValue) }}
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Valor" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                                </template>
                            </Column>

                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="slotProps">
                                    <div class="flex justify-center gap-2 pr-2">
                                        <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'"/>
                                        <Button icon="pi pi-envelope" variant="outlined" rounded size="small" :disabled="slotProps.data.status === 'Inativo'"/>
                                        <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeleteQuotation(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog v-model:visible="addDialogVisible" :style="{ width: '550px' }" header="Novo Orçamento" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-4 py-4">
            <div>
                <label for="add-patient" class="block font-bold mb-2">Selecionar Paciente</label>
                <InputGroup>
                    <InputText placeholder="Nome do Paciente" v-model="currentQuotation.patientName" />
                    <InputGroupAddon>
                        <Button icon="pi pi-search" severity="secondary" variant="text"/>
                    </InputGroupAddon>
                </InputGroup>
                <small v-if="submitted && !currentQuotation.patientName" class="text-red-500">O nome do paciente é obrigatório.</small>
            </div>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
            <Button label="Salvar" icon="pi pi-check" @click="saveAddedQuotation" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editDialogVisible" :style="{ width: '800px' }" header="Detalhes do Orçamento" :modal="true" class="p-fluid">
        <div class="flex flex-col gap-6 py-4">
            
            <Accordion value="0">
                <AccordionPanel value="0">
                    <AccordionHeader>Informações Gerais</AccordionHeader>
                    <AccordionContent>
                        <div class="grid grid-cols-12 gap-4 pt-2">
                            <div class="col-span-12 md:col-span-4">
                                <label for="edit-cpf" class="block font-bold mb-2">CPF do Paciente</label>
                                <InputText id="edit-cpf" v-model="currentQuotation.patientCpf" placeholder="000.000.000-00" class="w-full" />
                            </div>
                            <div class="col-span-12 md:col-span-8">
                                <label for="edit-patient" class="block font-bold mb-2">Nome do Paciente</label>
                                <InputText id="edit-patient" v-model.trim="currentQuotation.patientName" required="true" :invalid="submitted && !currentQuotation.patientName" class="w-full" disabled/>
                                <small v-if="submitted && !currentQuotation.patientName" class="text-red-500">O nome do paciente é obrigatório.</small>
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label for="edit-value" class="block font-bold mb-2">Valor Total (R$)</label>
                                <InputNumber id="edit-value" v-model="currentQuotation.totalValue" mode="currency" currency="BRL" locale="pt-BR" class="w-full" disabled />
                            </div>
                            <div class="col-span-12 md:col-span-6">
                                <label for="edit-status" class="block font-bold mb-2">Status</label>
                                <Select id="edit-status" v-model="currentQuotation.status" :options="['Pendente', 'Aprovado', 'Rejeitado']" class="w-full" />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <div class="bg-[var(--p-surface-100)] p-4 rounded-xl border border-[var(--p-surface-300)]">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-[var(--p-surface-700)] m-0">Procedimentos do Orçamento</h3>
                    <Button label="Adicionar Procedimento" icon="pi pi-plus" size="small" outlined @click="addProcedureToQuotation" />
                </div>

                <DataTable :value="currentQuotation.procedures" class="border border-[var(--p-surface-200)] rounded-lg overflow-hidden" responsiveLayout="scroll">
                    <template #empty>
                        <div class="p-4 text-center text-[var(--p-surface-500)]">Nenhum procedimento adicionado a este orçamento.</div>
                    </template>
                    
                    <Column field="name" header="Procedimento">
                        <template #body="{ data }">
                            <InputText v-model="data.name" class="w-full p-1 text-sm" />
                        </template>
                    </Column>
                    <Column field="quantity" header="Qtd." style="width: 6rem">
                        <template #body="{ data }">
                            <InputNumber v-model="data.quantity" :min="1" inputClass="w-full p-1 text-sm text-center" />
                        </template>
                    </Column>
                    <Column field="value" header="Valor Unitário" style="width: 10rem">
                        <template #body="{ data }">
                            <InputNumber v-model="data.value" mode="currency" currency="BRL" locale="pt-BR" inputClass="w-full p-1 text-sm" />
                        </template>
                    </Column>
                    <Column header="Subtotal" style="width: 10rem">
                        <template #body="{ data }">
                            <span class="font-semibold">{{ formatCurrency(data.value * data.quantity) }}</span>
                        </template>
                    </Column>
                    <Column style="width: 4rem" :exportable="false">
                        <template #body="{ index }">
                            <Button icon="pi pi-times" variant="text" severity="danger" rounded @click="removeProcedure(index)" />
                        </template>
                    </Column>
                </DataTable>
            </div>

        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
            <Button label="Salvar" icon="pi pi-check" @click="saveEditedQuotation" />
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
            <span v-if="currentQuotation">Tem a certeza que deseja eliminar o orçamento do paciente <b>{{ currentQuotation.patientName }}</b>?</span>
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
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import ContextMenu from 'primevue/contextmenu';
import AppLayout from '../components/AppLayout.vue';
import InputNumber from 'primevue/inputnumber';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

// --- INTERFACES ---
interface QuotationProcedure {
    id: string;
    name: string;
    value: number;
    quantity: number;
}

interface Quotation {
    id: string;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Inativo';
    generationDate: string; 
    patientName: string;
    patientCpf: string;
    totalValue: number;
    procedures: QuotationProcedure[];
}

// --- MOCK DATA ---
const quotationsMock = ref<Quotation[]>([
    { 
        id: '#0000001', status: 'Pendente', generationDate: '2026-05-20', patientName: 'João Silva Oliveira', patientCpf: '111.222.333-44', totalValue: 1050.00,
        procedures: [
            { id: 'p1', name: 'Limpeza Simples', value: 150.00, quantity: 1 },
            { id: 'p2', name: 'Clareamento Dental', value: 900.00, quantity: 1 }
        ]
    },
    { id: '#0000002', status: 'Aprovado', generationDate: '2026-05-18', patientName: 'Maria Santos Souza', patientCpf: '555.666.777-88', totalValue: 2450.00, procedures: [] },
    { id: '#0000003', status: 'Rejeitado', generationDate: '2026-05-15', patientName: 'Lucas Ferreira', patientCpf: '321.654.987-11', totalValue: 600.00, procedures: [] },
    { id: '#0000004', status: 'Inativo', generationDate: '2026-05-10', patientName: 'Ana Costa', patientCpf: '123.456.789-00', totalValue: 1350.00, procedures: [] },
    { id: '#0000005', status: 'Pendente', generationDate: '2026-05-24', patientName: 'Pedro Almeida', patientCpf: '999.888.777-66', totalValue: 450.00, procedures: [] }
]);

const statusOptions = ref(['Pendente', 'Aprovado', 'Rejeitado', 'Inativo']);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};


const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Aprovado': return 'background-color: var(--p-primary-1000);'; 
        case 'Pendente': return 'background-color: var(--p-primary-25);'; 
        case 'Rejeitado': return 'background-color: var(--p-primary-1010);'; 
        case 'Inativo': 
        default: 
            return 'background-color: var(--p-surface-500);'; 
    }
};

// --- TABLE STATES AND FILTERS ---
const selectedQuotation = ref();
const contextMenuSelection = ref();
const metaKey = ref(true);

const quotationFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    generationDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    patientName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    totalValue: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

// --- CONTEXT MENU LOGIC (RIGHT-CLICK) ---
const cm = ref();
const menuItems = ref<any[]>([]);

const approveQuotation = () => {
    if (contextMenuSelection.value) {
        const index = quotationsMock.value.findIndex(q => q.id === contextMenuSelection.value.id);
        if (index !== -1 && quotationsMock.value[index]) {
            quotationsMock.value[index].status = 'Aprovado';
        }
        contextMenuSelection.value = null;
    }
};

const rejectQuotation = () => {
    if (contextMenuSelection.value) {
        const index = quotationsMock.value.findIndex(q => q.id === contextMenuSelection.value.id);
        if (index !== -1 && quotationsMock.value[index]) {
            quotationsMock.value[index].status = 'Rejeitado';
        }
        contextMenuSelection.value = null;
    }
};

const reactivateQuotation = () => {
    if (contextMenuSelection.value) {
        const index = quotationsMock.value.findIndex(q => q.id === contextMenuSelection.value.id);
        const targetQuotation = quotationsMock.value[index];
        if (index !== -1 && targetQuotation) {
            targetQuotation.status = 'Pendente';
        }
        contextMenuSelection.value = null; 
    }
};

const onRowContextMenu = (event: any) => {
    if (!contextMenuSelection.value) return;

    if (contextMenuSelection.value.status === 'Pendente') {
        menuItems.value = [
            { 
                label: 'Aprovar Orçamento', 
                icon: 'pi pi-check',
                command: () => approveQuotation() 
            },
            { 
                label: 'Rejeitar Orçamento', 
                icon: 'pi pi-times',
                class: 'text-[var(--p-primary-1010)]',
                command: () => rejectQuotation() 
            }
        ];
        cm.value.show(event.originalEvent);
    } else if (contextMenuSelection.value.status === 'Inativo') {
        menuItems.value = [
            { 
                label: 'Reativar orçamento', 
                icon: 'pi pi-refresh',
                command: () => reactivateQuotation() 
            },
            { 
                label: 'Excluir permanentemente',
                icon: 'pi pi-trash',
                class: 'text-[var(--p-primary-1010)]'
            }
        ];
        cm.value.show(event.originalEvent);
    }
};

// --- PROCEDURES LOGIC ---
const addProcedureToQuotation = () => {
    currentQuotation.value.procedures.push({
        id: 'novo-' + Date.now(),
        name: 'Novo Procedimento',
        value: 0,
        quantity: 1
    });
};

const removeProcedure = (index: number) => {
    currentQuotation.value.procedures.splice(index, 1);
};

// --- DIALOG STATES ---
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);

const getEmptyQuotation = (): Quotation => ({
    id: '', 
    status: 'Pendente', 
    generationDate: '', 
    patientName: '', 
    patientCpf: '',
    totalValue: 0,
    procedures: []
});

const currentQuotation = ref<Quotation>(getEmptyQuotation());

// --- ADD LOGIC ---
const openAddDialog = () => {
    currentQuotation.value = getEmptyQuotation();
    submitted.value = false;
    addDialogVisible.value = true;
};

const closeAddDialog = () => {
    addDialogVisible.value = false;
    submitted.value = false;
};

const saveAddedQuotation = () => {
    submitted.value = true;
    if (currentQuotation.value.patientName?.trim()) {
        currentQuotation.value.id = '#' + Math.floor(Math.random() * 1000000).toString().padStart(7, '0');
        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        currentQuotation.value.generationDate = `${yyyy}-${mm}-${dd}`;
        
        quotationsMock.value.unshift(currentQuotation.value);
        addDialogVisible.value = false;
        currentQuotation.value = getEmptyQuotation();
    }
};

// --- EDIT LOGIC ---
const openEditDialog = (quotation: Quotation) => {
    currentQuotation.value = JSON.parse(JSON.stringify(quotation)); // Deep copy para evitar reatividade direta na tabela antes de salvar
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    submitted.value = false;
};

const saveEditedQuotation = () => {
    submitted.value = true;
    if (currentQuotation.value.patientName?.trim()) {
        
        // Recalcular valor total baseado nos procedimentos
        if (currentQuotation.value.procedures && currentQuotation.value.procedures.length > 0) {
            currentQuotation.value.totalValue = currentQuotation.value.procedures.reduce((acc, proc) => {
                return acc + (proc.value * proc.quantity);
            }, 0);
        }

        const index = quotationsMock.value.findIndex(q => q.id === currentQuotation.value.id);
        if (index !== -1) {
            quotationsMock.value.splice(index, 1, currentQuotation.value);
        }
        editDialogVisible.value = false;
        currentQuotation.value = getEmptyQuotation();
    }
};

// --- DELETE LOGIC ---
const confirmDeleteQuotation = (quotation: Quotation) => {
    currentQuotation.value = { ...quotation }; 
    deleteDialogVisible.value = true;
};

const executeDelete = () => {
    const index = quotationsMock.value.findIndex(q => q.id === currentQuotation.value.id);
    const targetQuotation = quotationsMock.value[index];
    
    if (index !== -1 && targetQuotation) {
        targetQuotation.status = 'Inativo';
    }
    
    deleteDialogVisible.value = false;
    currentQuotation.value = getEmptyQuotation();
};

// --- STYLING ROW CLASSES ---
const rowClass = (data: Quotation) => {
    return [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': data.status === 'Inativo' }];
};


</script>

