<template>
    <AppLayout title="Orcamentos">
        <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <div class="flex flex-col gap-3 p-5 border-b border-[var(--p-surface-200)] sm:flex-row sm:items-center sm:justify-between">
                <div class="flex w-full items-center gap-2 sm:w-auto">
                    <IconField class="w-full sm:w-auto">
                        <InputIcon class="flex items-center">
                            <i class="pi pi-search text-[var(--p-surface-400)]" />
                        </InputIcon>
                        <InputText
                            v-model="quotationFilters.global.value"
                            placeholder="Pesquisar"
                            class="py-2 px-3 pl-10 h-9 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-full w-full sm:w-64 focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow"
                        />
                    </IconField>
                </div>

                <div class="flex w-full items-center gap-3 sm:w-auto">
                    <Button
                        icon="pi pi-plus"
                        label="Adicionar"
                        class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center justify-center !rounded-lg sm:ml-2 shadow-md"
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
                    class="app-table flex-1 px-2 sm:px-4"
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
                        <div class="app-table-empty-state flex flex-col items-center justify-center py-12 text-[var(--p-surface-400)]">
                            <i class="pi pi-inbox text-4xl mb-3 text-[var(--p-surface-300)]"></i>
                            <p class="font-medium text-[var(--p-surface-500)]">Nenhum orcamento encontrado.</p>
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

                    <Column field="id" header="ID Orcamento" :showFilterMenu="false" style="width: 12rem;">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="generationDate" header="Data de Geracao" :showFilterMenu="false" style="width: 12rem;">
                        <template #body="{ data }">
                            {{ formatDate(data.generationDate) }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Data" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="patientName" header="Nome do Paciente" :showFilterMenu="false">
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
                                <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                                <Button icon="pi pi-envelope" variant="outlined" rounded size="small" :disabled="slotProps.data.status === 'Inativo'" />
                                <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeleteQuotation(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog v-model:visible="addDialogVisible" :style="{ width: '800px' }" header="Novo Orcamento" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <QuotationGeneralFields
                mode="add"
                :submitted="submitted"
            />
            <QuotationProceduresSection />
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
            <Button label="Salvar" icon="pi pi-check" @click="saveAddedQuotation" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editDialogVisible" :style="{ width: '800px' }" header="Detalhes do Orcamento" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <QuotationGeneralFields
                mode="edit"
                :submitted="submitted"
            />
            <QuotationProceduresSection />
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
            <Button label="Salvar" icon="pi pi-check" @click="saveEditedQuotation" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" header="Confirmar Exclusao" :modal="true" class="app-dialog">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" />
            <div class="app-dialog-section">
                <span v-if="currentQuotation">Tem certeza que deseja inativar o orcamento do paciente <b>{{ currentQuotation.patientName }}</b>?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Nao" icon="pi pi-times" text @click="deleteDialogVisible = false" />
            <Button label="Sim" icon="pi pi-check" severity="danger" @click="executeDelete" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import Accordion from 'primevue/accordion';
import AccordionContent from 'primevue/accordioncontent';
import AccordionHeader from 'primevue/accordionheader';
import AccordionPanel from 'primevue/accordionpanel';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Column from 'primevue/column';
import ContextMenu from 'primevue/contextmenu';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { getPatientServiceErrorMessage, PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';
import AppLayout from '../components/AppLayout.vue';

interface QuotationProcedure {
    id: string;
    name: string;
    value: number;
    quantity: number;
}

interface Quotation {
    id: string;
    patientId: number | null;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Inativo';
    generationDate: string;
    patientName: string;
    patientCpf: string;
    totalValue: number;
    procedures: QuotationProcedure[];
}

interface PatientOption {
    id: number | null;
    name: string;
    cpf: string;
}

const quotationsMock = ref<Quotation[]>([
    {
        id: '#0000001',
        patientId: null,
        status: 'Pendente',
        generationDate: '2026-05-20',
        patientName: 'Joao Silva Oliveira',
        patientCpf: '111.222.333-44',
        totalValue: 1050.00,
        procedures: [
            { id: 'p1', name: 'Limpeza Simples', value: 150.00, quantity: 1 },
            { id: 'p2', name: 'Clareamento Dental', value: 900.00, quantity: 1 }
        ]
    },
    { id: '#0000002', patientId: null, status: 'Aprovado', generationDate: '2026-05-18', patientName: 'Maria Santos Souza', patientCpf: '555.666.777-88', totalValue: 2450.00, procedures: [] },
    { id: '#0000003', patientId: null, status: 'Rejeitado', generationDate: '2026-05-15', patientName: 'Lucas Ferreira', patientCpf: '321.654.987-11', totalValue: 600.00, procedures: [] },
    { id: '#0000004', patientId: null, status: 'Inativo', generationDate: '2026-05-10', patientName: 'Ana Costa', patientCpf: '123.456.789-00', totalValue: 1350.00, procedures: [] },
    { id: '#0000005', patientId: null, status: 'Pendente', generationDate: '2026-05-24', patientName: 'Pedro Almeida', patientCpf: '999.888.777-66', totalValue: 450.00, procedures: [] }
]);

const toast = useToast();
const statusOptions = ref(['Pendente', 'Aprovado', 'Rejeitado', 'Inativo']);
const selectedQuotation = ref<Quotation | null>(null);
const contextMenuSelection = ref<Quotation | null>(null);
const metaKey = ref(true);
const cm = ref();
const menuItems = ref<any[]>([]);
const registeredPatients = ref<PatientOption[]>([]);
const patientSuggestions = ref<PatientOption[]>([]);
const selectedPatient = ref<PatientOption | string | null>(null);
const patientVirtualScrollerOptions = {
    itemSize: 44
};

const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);
const currentQuotation = ref<Quotation>(getEmptyQuotation());

const quotationFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    id: { value: null, matchMode: FilterMatchMode.CONTAINS },
    generationDate: { value: null, matchMode: FilterMatchMode.CONTAINS },
    patientName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    totalValue: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const QuotationGeneralFields = defineComponent({
    props: {
        mode: {
            type: String,
            required: true
        },
        submitted: {
            type: Boolean,
            required: true
        }
    },
    setup(props) {
        const prefix = props.mode;

        return () => h(Accordion, { value: '0' }, () => [
            h(AccordionPanel, { value: '0' }, () => [
                h(AccordionHeader, null, () => 'Informacoes Gerais'),
                h(AccordionContent, null, () => [
                    h('div', { class: 'grid grid-cols-12 gap-4 pt-2' }, [
                        h('div', { class: 'app-field col-span-12 md:col-span-4' }, [
                            h('label', { for: `${prefix}-cpf`, class: 'app-field-label' }, 'CPF do Paciente'),
                            h(InputMask, {
                                id: `${prefix}-cpf`,
                                modelValue: currentQuotation.value.patientCpf,
                                'onUpdate:modelValue': onPatientCpfInput,
                                mask: '999.999.999-99',
                                placeholder: '000.000.000-00',
                                class: 'w-full'
                            })
                        ]),
                        h('div', { class: 'app-field col-span-12 md:col-span-8' }, [
                            h('label', { for: `${prefix}-patient`, class: 'app-field-label' }, [
                                'Nome do Paciente',
                                h('span', { class: 'app-required-mark' }, '*')
                            ]),
                            h(AutoComplete, {
                                id: `${prefix}-patient`,
                                modelValue: selectedPatient.value,
                                'onUpdate:modelValue': (value: PatientOption | string | null) => {
                                    selectedPatient.value = value;
                                    if (typeof value === 'string' && !value.trim()) {
                                        clearPatientFields();
                                    }
                                    if (value === null) {
                                        clearPatientFields();
                                    }
                                },
                                suggestions: patientSuggestions.value,
                                optionLabel: 'name',
                                placeholder: 'Buscar paciente cadastrado',
                                dropdown: true,
                                completeOnFocus: true,
                                virtualScrollerOptions: patientVirtualScrollerOptions,
                                fluid: true,
                                invalid: props.submitted && !currentQuotation.value.patientName,
                                onComplete: searchPatients,
                                onChange: syncPatientName,
                                onItemSelect: selectPatientFromSearch
                            }),
                            props.submitted && !currentQuotation.value.patientName
                                ? h('small', { class: 'app-field-error' }, 'O nome do paciente e obrigatorio.')
                                : null
                        ]),
                        h('div', { class: 'app-field col-span-12 md:col-span-6' }, [
                            h('label', { for: `${prefix}-value`, class: 'app-field-label' }, 'Valor Total (R$)'),
                            h(InputNumber, {
                                id: `${prefix}-value`,
                                modelValue: currentQuotation.value.totalValue,
                                'onUpdate:modelValue': (value: number | null) => {
                                    currentQuotation.value.totalValue = value ?? 0;
                                },
                                mode: 'currency',
                                currency: 'BRL',
                                locale: 'pt-BR',
                                class: 'w-full'
                            })
                        ]),
                        h('div', { class: 'app-field col-span-12 md:col-span-6' }, [
                            h('label', { for: `${prefix}-status`, class: 'app-field-label' }, 'Status'),
                            h(Select, {
                                id: `${prefix}-status`,
                                modelValue: currentQuotation.value.status,
                                'onUpdate:modelValue': (value: Quotation['status']) => {
                                    currentQuotation.value.status = value;
                                },
                                options: ['Pendente', 'Aprovado', 'Rejeitado'],
                                class: 'w-full'
                            })
                        ])
                    ])
                ])
            ])
        ]);
    }
});

const QuotationProceduresSection = defineComponent({
    setup() {
        return () => h('div', { class: 'quotation-procedures-section' }, [
            h('div', { class: 'quotation-procedures-header' }, [
                h('div', null, [
                    h('h3', { class: 'text-lg font-bold text-[var(--p-surface-700)] m-0' }, 'Procedimentos do Orcamento'),
                    h('p', { class: 'text-sm text-[var(--p-surface-500)] m-0 mt-1' }, 'Estrutura reservada para a etapa de procedimentos.')
                ]),
                h(Button, {
                    label: 'Adicionar Procedimento',
                    icon: 'pi pi-plus',
                    size: 'small',
                    outlined: true,
                    disabled: true
                })
            ]),
            currentQuotation.value.procedures.length
                ? h(DataTable, {
                    value: currentQuotation.value.procedures,
                    class: 'border border-[var(--p-surface-200)] rounded-lg overflow-hidden',
                    responsiveLayout: 'scroll'
                }, {
                    default: () => [
                        h(Column, { field: 'name', header: 'Procedimento' }),
                        h(Column, { field: 'quantity', header: 'Qtd.', style: 'width: 6rem' }),
                        h(Column, {
                            field: 'value',
                            header: 'Valor Unitario',
                            style: 'width: 10rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => formatCurrency(data.value)
                        }),
                        h(Column, {
                            header: 'Subtotal',
                            style: 'width: 10rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => formatCurrency(data.value * data.quantity)
                        })
                    ]
                })
                : h('div', { class: 'quotation-procedures-empty' }, [
                    h('i', { class: 'pi pi-list text-2xl text-[var(--p-surface-400)]' }),
                    h('span', null, 'Nenhum procedimento adicionado a este orcamento.')
                ])
        ]);
    }
});

function getEmptyQuotation(): Quotation {
    return {
        id: '',
        patientId: null,
        status: 'Pendente',
        generationDate: '',
        patientName: '',
        patientCpf: '',
        totalValue: 0,
        procedures: []
    };
}

const normalizeCpf = (value?: string | null) => (value ?? '').replace(/\D/g, '');
const formatCpf = (value?: string | null) => {
    const digits = normalizeCpf(value);
    if (digits.length !== 11) return value ?? '';
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const toPatientOption = (patient: ApiPatient): PatientOption => ({
    id: patient.id ?? null,
    name: patient.name ?? '',
    cpf: formatCpf(patient.document)
});

const loadPatients = async () => {
    try {
        const patients = await PatientService.list();
        registeredPatients.value = patients
            .map(toPatientOption)
            .filter(patient => patient.name || patient.cpf);
    } catch (error: unknown) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: getPatientServiceErrorMessage(error),
            life: 5000
        });
    }
};

const applyPatientToQuotation = (patient: PatientOption) => {
    currentQuotation.value.patientId = patient.id;
    currentQuotation.value.patientName = patient.name;
    currentQuotation.value.patientCpf = patient.cpf;
    selectedPatient.value = patient;
};

const clearPatientFields = () => {
    currentQuotation.value.patientId = null;
    currentQuotation.value.patientName = '';
    currentQuotation.value.patientCpf = '';
    selectedPatient.value = null;
};

const findPatientByCpf = (cpf: string) => {
    const digits = normalizeCpf(cpf);
    if (digits.length !== 11) return;

    const patient = registeredPatients.value.find(item => normalizeCpf(item.cpf) === digits);
    if (patient) {
        applyPatientToQuotation(patient);
    }
};

const onPatientCpfInput = (value: string | null | undefined) => {
    const nextValue = value ?? '';
    currentQuotation.value.patientCpf = nextValue;

    if (!normalizeCpf(nextValue)) {
        clearPatientFields();
        return;
    }

    findPatientByCpf(nextValue);
};

const searchPatients = (event: { query: string }) => {
    const query = event.query?.trim().toLowerCase() ?? '';

    patientSuggestions.value = registeredPatients.value.filter(patient => {
        const name = patient.name.toLowerCase();
        const cpf = normalizeCpf(patient.cpf);
        const queryCpf = normalizeCpf(query);

        return !query || name.includes(query) || (queryCpf && cpf.includes(queryCpf));
    });
};

const selectPatientFromSearch = (event: { value: PatientOption }) => {
    applyPatientToQuotation(event.value);
};

const syncPatientName = (event: { value: PatientOption | string | null }) => {
    if (typeof event.value === 'string') {
        if (!event.value.trim()) {
            clearPatientFields();
            return;
        }

        currentQuotation.value.patientId = null;
        currentQuotation.value.patientName = event.value;
        return;
    }

    if (event.value) {
        applyPatientToQuotation(event.value);
    }
};

const syncSelectedPatient = () => {
    const selected = registeredPatients.value.find(patient => normalizeCpf(patient.cpf) === normalizeCpf(currentQuotation.value.patientCpf));
    selectedPatient.value = selected ?? currentQuotation.value.patientName;
};

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

const approveQuotation = () => {
    if (!contextMenuSelection.value) return;

    const index = quotationsMock.value.findIndex(q => q.id === contextMenuSelection.value?.id);
    if (index !== -1 && quotationsMock.value[index]) {
        quotationsMock.value[index].status = 'Aprovado';
    }
    contextMenuSelection.value = null;
};

const rejectQuotation = () => {
    if (!contextMenuSelection.value) return;

    const index = quotationsMock.value.findIndex(q => q.id === contextMenuSelection.value?.id);
    if (index !== -1 && quotationsMock.value[index]) {
        quotationsMock.value[index].status = 'Rejeitado';
    }
    contextMenuSelection.value = null;
};

const reactivateQuotation = () => {
    if (!contextMenuSelection.value) return;

    const index = quotationsMock.value.findIndex(q => q.id === contextMenuSelection.value?.id);
    if (index !== -1 && quotationsMock.value[index]) {
        quotationsMock.value[index].status = 'Pendente';
    }
    contextMenuSelection.value = null;
};

const onRowContextMenu = (event: any) => {
    if (!contextMenuSelection.value) return;

    if (contextMenuSelection.value.status === 'Pendente') {
        menuItems.value = [
            {
                label: 'Aprovar orcamento',
                icon: 'pi pi-check',
                command: () => approveQuotation()
            },
            {
                label: 'Rejeitar orcamento',
                icon: 'pi pi-times',
                class: 'text-[var(--p-primary-1010)]',
                command: () => rejectQuotation()
            }
        ];
        cm.value.show(event.originalEvent);
    } else if (contextMenuSelection.value.status === 'Inativo') {
        menuItems.value = [
            {
                label: 'Reativar orcamento',
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

const openAddDialog = () => {
    currentQuotation.value = getEmptyQuotation();
    selectedPatient.value = null;
    patientSuggestions.value = registeredPatients.value;
    submitted.value = false;
    addDialogVisible.value = true;
};

const closeAddDialog = () => {
    addDialogVisible.value = false;
    submitted.value = false;
};

const saveAddedQuotation = () => {
    submitted.value = true;
    syncPatientName({ value: selectedPatient.value });

    if (currentQuotation.value.patientName?.trim()) {
        currentQuotation.value.id = '#' + Math.floor(Math.random() * 1000000).toString().padStart(7, '0');

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        currentQuotation.value.generationDate = `${yyyy}-${mm}-${dd}`;

        quotationsMock.value.unshift(JSON.parse(JSON.stringify(currentQuotation.value)));
        addDialogVisible.value = false;
        currentQuotation.value = getEmptyQuotation();
        selectedPatient.value = null;
    }
};

const openEditDialog = (quotation: Quotation) => {
    currentQuotation.value = JSON.parse(JSON.stringify(quotation));
    syncSelectedPatient();
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    submitted.value = false;
};

const saveEditedQuotation = () => {
    submitted.value = true;
    syncPatientName({ value: selectedPatient.value });

    if (currentQuotation.value.patientName?.trim()) {
        if (currentQuotation.value.procedures.length > 0) {
            currentQuotation.value.totalValue = currentQuotation.value.procedures.reduce((acc, proc) => acc + (proc.value * proc.quantity), 0);
        }

        const index = quotationsMock.value.findIndex(q => q.id === currentQuotation.value.id);
        if (index !== -1) {
            quotationsMock.value.splice(index, 1, JSON.parse(JSON.stringify(currentQuotation.value)));
        }
        editDialogVisible.value = false;
        currentQuotation.value = getEmptyQuotation();
        selectedPatient.value = null;
    }
};

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

const rowClass = (data: Quotation) => {
    return [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': data.status === 'Inativo' }];
};

onMounted(loadPatients);
</script>
