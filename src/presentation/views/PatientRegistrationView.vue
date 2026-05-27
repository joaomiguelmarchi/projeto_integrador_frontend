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
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--p-surface-0)] text-[var(--p-primary-600)] transition-all text-left cursor-pointer shadow-sm">
                    <i class="pi pi-users text-[var(--p-primary-600)]"></i>
                    <span class="font-semibold text-[15px]">Cadastro de Paciente</span>
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
                <button @click="accessProcedures()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group">
                    <i class="pi pi-list text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Procedimentos</span>
                </button>
                <button class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--p-surface-500)] hover:bg-[var(--p-surface-0)] hover:text-[var(--p-surface-800)] transition-all text-left cursor-pointer group mt-auto">
                    <i class="pi pi-cog text-[var(--p-surface-400)] group-hover:text-[var(--p-surface-600)] transition-colors"></i>
                    <span class="font-medium text-[15px]">Configurações</span>
                </button>
            </nav>
        </aside>

        <main class="flex-1 flex flex-col overflow-hidden"> 
            
            <header class="h-[72px] bg-[var(--p-surface-100)] flex items-center justify-between px-8 shrink-0">
                <h1 class="text-[22px] font-bold text-[var(--p-surface-600)] m-0 tracking-tight">Pacientes</h1>
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
                                    v-model="patientFilters['global'].value" 
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
                            v-model:filters="patientFilters"
                            v-model:selection="selectedPatient"
                            v-model:contextMenuSelection="contextMenuSelection"
                            @rowContextmenu="onRowContextMenu"
                            :value="patientsMock" 
                            class="patient-table flex-1 px-4" 
                            scrollable 
                            scrollHeight="flex"
                            selectionMode="single"
                            :metaKeySelection="metaKey" 
                            dataKey="id"
                            filterDisplay="row"
                            :globalFilterFields="['status', 'id', 'name', 'cpf', 'mobilePhone']"
                            :rowClass="rowClass"
                        >   
                            <template #empty> 
                                <div class="flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]">
                                    <i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]"></i>
                                    <p class="font-medium text-[var(--p-surface-500)]">Nenhum paciente encontrado.</p>
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
                                        <span 
                                            class="px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-[var(--p-surface-300)] bg-[var(--p-surface-0)] text-[var(--p-surface-500)]">
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
                                    />
                                </template>
                            </Column>

                            <Column field="id" header="ID Paciente" :showFilterMenu="false" style="width: 12rem;">
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full"  />
                                </template>
                            </Column>

                            <Column field="name" header="Nome do Paciente" :showFilterMenu="false">
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Nome" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                                </template>
                            </Column>

                            <Column field="cpf" header="CPF" :showFilterMenu="false" style="width: 12rem">
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar CPF" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                                </template>
                            </Column>

                            <Column field="mobilePhone" header="Celular" :showFilterMenu="false" style="width: 12rem">
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Celular" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                                </template>
                            </Column>

                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="slotProps">
                                    <div class="flex justify-center gap-2 pr-2">
                                        <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'"/>
                                        <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeletePatient(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
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
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import ContextMenu from 'primevue/contextmenu';
import { useRouter } from 'vue-router';
import logoUrl from '../../assets/LogoAzul.png';
import Image from 'primevue/image';

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
        icon: 'pi pi-refresh',
        command: () => reactivatePatient() 
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
    return [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': data.status === 'Inativo' }];
};

const router = useRouter();
const accessHome = () => {
  router.push('/inicio');
};
const accessProcedures = () => {
  router.push('/procedimentos');
};
const accessQuotation = () => {
  router.push('/orcamento');
};
</script>

<style scoped>
/* Estilos alinhados com o modelo visual da ProceduresView */
:deep(.patient-table .p-datatable-thead > tr > th) {
    background-color: transparent;
    color: var(--p-surface-600);
    border-bottom: 1px solid var(--p-surface-200); 
    padding: 1rem 0.75rem;
}

:deep(.patient-table .p-datatable-thead > tr:nth-child(2) > th) {
    padding-top: 1rem;
    padding-bottom: 1rem;
    background-color: transparent;
    border-bottom: 1px solid var(--p-surface-200);
}

:deep(.patient-table .p-datatable-thead > tr > th:first-child),
:deep(.patient-table .p-datatable-tbody > tr > td:first-child) { 
    padding-left: 0; 
}

:deep(.patient-table .p-datatable-thead > tr > th:last-child),
:deep(.patient-table .p-datatable-tbody > tr > td:last-child) { 
    padding-right: 0; 
}

:deep(.patient-table .p-datatable-tbody > tr > td) {
    padding: 1rem 0.75rem;
    border-bottom: 1px solid var(--p-surface-200); 
}
</style>