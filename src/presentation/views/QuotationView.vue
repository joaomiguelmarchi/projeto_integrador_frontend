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
                            <p class="font-medium text-[var(--p-surface-500)]">Nenhum orçamento encontrado.</p>
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

                    <Column field="generationDate" header="Data de Geração" :showFilterMenu="false" style="width: 12rem;">
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
                                <Button icon="pi pi-download" variant="outlined" rounded size="small" @click="downloadQuotationPdf(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                                <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeleteQuotation(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog v-model:visible="addDialogVisible" :style="{ width: '980px' }" header="Novo Orcamento" :modal="true" class="app-dialog p-fluid">
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

    <Dialog v-model:visible="editDialogVisible" :style="{ width: '980px' }" header="Detalhes do Orçamento" :modal="true" class="app-dialog p-fluid">
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

    <Dialog v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" header="Confirmar Exclusão" :modal="true" class="app-dialog">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" />
            <div class="app-dialog-section">
                <span v-if="currentQuotation">Tem certeza que deseja inativar o orçamento do paciente <b>{{ currentQuotation.patientName }}</b>?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Não" icon="pi pi-times" text @click="deleteDialogVisible = false" />
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
import { getProcedureServiceErrorMessage, ProcedureService } from '../../infrastructure/services/ProcedureService';
import type { ApiProcedure } from '../../infrastructure/services/ProcedureService';
import AppLayout from '../components/AppLayout.vue';

interface QuotationProcedure {
    rowKey: string;
    procedureId: number | null;
    procedureIdText: string;
    description: string;
    value: number;
    classification: string;
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

interface ProcedureOption {
    id: number | null;
    displayId: string;
    description: string;
    value: number;
    classification: string;
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
            { rowKey: 'mock-1-p1', procedureId: 1, procedureIdText: '#0000001', description: 'Limpeza Simples', value: 150.00, classification: 'Preventivo' },
            { rowKey: 'mock-1-p2', procedureId: 2, procedureIdText: '#0000002', description: 'Clareamento Dental', value: 900.00, classification: 'Estetico' }
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
const registeredProcedures = ref<ProcedureOption[]>([]);
const procedureDescriptionSuggestions = ref<ProcedureOption[]>([]);
const patientVirtualScrollerOptions = {
    itemSize: 44
};
const procedureVirtualScrollerOptions = {
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

        return () => h(Accordion, { value: '0', class: 'quotation-general-accordion' }, () => [
            h(AccordionPanel, { value: '0' }, () => [
                h(AccordionHeader, null, () => 'Informações Gerais'),
                h(AccordionContent, null, () => [
                    h('div', { class: 'grid grid-cols-12 gap-4 pt-2' }, [
                        h('div', { class: 'app-field col-span-12 md:col-span-4' }, [
                            h('label', { for: `${prefix}-cpf`, class: 'app-field-label' }, 'CPF'),
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
                                ? h('small', { class: 'app-field-error' }, 'O nome do paciente é obrigatorio.')
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
                    h('h3', { class: 'text-lg font-bold text-[var(--p-surface-700)] m-0' }, 'Procedimentos do Orçamento'),
                    h('p', { class: 'text-sm text-[var(--p-surface-500)] m-0 mt-1' }, 'Adicione os procedimentos vinculados a este orçamento.')
                ]),
                h(Button, {
                    label: 'Adicionar Procedimento',
                    icon: 'pi pi-plus',
                    size: 'small',
                    outlined: true,
                    onClick: addProcedureRow
                })
            ]),
            currentQuotation.value.procedures.length
                ? h(DataTable, {
                    value: currentQuotation.value.procedures,
                    class: 'quotation-procedures-table',
                    dataKey: 'rowKey',
                    responsiveLayout: 'scroll'
                }, {
                    default: () => [
                        h(Column, {
                            field: 'procedureIdText',
                            header: 'ID Procedimento',
                            style: 'width: 11rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h(InputText, {
                                modelValue: data.procedureIdText,
                                'onUpdate:modelValue': (value: string) => syncProcedureIdInput(data, value),
                                placeholder: '#0000000',
                                class: 'w-full'
                            })
                        }),
                        h(Column, {
                            field: 'description',
                            header: 'Descricao',
                            style: 'min-width: 18rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h(AutoComplete, {
                                modelValue: data.description,
                                'onUpdate:modelValue': (value: ProcedureOption | string | null) => syncProcedureDescriptionInput(data, value),
                                suggestions: procedureDescriptionSuggestions.value,
                                optionLabel: 'description',
                                dropdown: true,
                                completeOnFocus: true,
                                forceSelection: false,
                                virtualScrollerOptions: procedureVirtualScrollerOptions,
                                fluid: true,
                                placeholder: 'Buscar procedimento',
                                onComplete: searchProcedureDescriptions,
                                onChange: (event: { value: ProcedureOption | string | null }) => syncProcedureDescriptionInput(data, event.value),
                                onItemSelect: (event: { value: ProcedureOption }) => applyProcedureToRow(data, event.value)
                            })
                        }),
                        h(Column, {
                            field: 'value',
                            header: 'Valor',
                            style: 'width: 10rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h('span', { class: 'quotation-procedure-readonly-field' }, data.procedureId ? formatCurrency(data.value) : '')
                        }),
                        h(Column, {
                            field: 'classification',
                            header: 'Classificacao',
                            style: 'width: 12rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h('span', { class: 'quotation-procedure-readonly-field' }, data.classification)
                        }),
                        h(Column, {
                            header: '',
                            style: 'width: 4rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h('div', { class: 'quotation-procedure-action' }, [
                                h(Button, {
                                    icon: 'pi pi-trash',
                                    variant: 'outlined',
                                    rounded: true,
                                    severity: 'danger',
                                    size: 'small',
                                    onClick: () => removeProcedureRow(data)
                                })
                            ])
                        })
                    ]
                })
                : h('div', { class: 'quotation-procedures-empty' }, [
                    h('i', { class: 'pi pi-list text-2xl text-[var(--p-surface-400)]' }),
                    h('span', null, 'Nenhum procedimento adicionado a este orçamento.')
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

const formatProcedureDisplayId = (id?: number | null) => id ? `#${id.toString().padStart(7, '0')}` : '';
const normalizeProcedureId = (value?: string | number | null) => String(value ?? '').replace(/\D/g, '');

const toProcedureOption = (procedure: ApiProcedure): ProcedureOption => ({
    id: procedure.id ?? null,
    displayId: formatProcedureDisplayId(procedure.id),
    description: procedure.name ?? '',
    value: procedure.value ?? 0,
    classification: procedure.type ?? ''
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

const loadProcedures = async () => {
    try {
        const procedures = await ProcedureService.list();
        registeredProcedures.value = procedures
            .filter(procedure => procedure.statusCode !== 1)
            .map(toProcedureOption)
            .filter(procedure => procedure.id || procedure.description);
        procedureDescriptionSuggestions.value = registeredProcedures.value;
    } catch (error: unknown) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: getProcedureServiceErrorMessage(error),
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

const getEmptyQuotationProcedure = (): QuotationProcedure => ({
    rowKey: `procedure-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    procedureId: null,
    procedureIdText: '',
    description: '',
    value: 0,
    classification: ''
});

const updateQuotationTotalFromProcedures = () => {
    currentQuotation.value.totalValue = currentQuotation.value.procedures.reduce((acc, procedure) => acc + (procedure.value ?? 0), 0);
};

const addProcedureRow = () => {
    currentQuotation.value.procedures.push(getEmptyQuotationProcedure());
};

const removeProcedureRow = (procedure: QuotationProcedure) => {
    currentQuotation.value.procedures = currentQuotation.value.procedures.filter(item => item.rowKey !== procedure.rowKey);
    updateQuotationTotalFromProcedures();
};

const clearProcedureRow = (row: QuotationProcedure) => {
    row.procedureId = null;
    row.procedureIdText = '';
    row.description = '';
    row.value = 0;
    row.classification = '';
    updateQuotationTotalFromProcedures();
};

const applyProcedureToRow = (row: QuotationProcedure, procedure: ProcedureOption) => {
    row.procedureId = procedure.id;
    row.procedureIdText = procedure.displayId;
    row.description = procedure.description;
    row.value = procedure.value;
    row.classification = procedure.classification;
    updateQuotationTotalFromProcedures();
};

const findProcedureById = (value: string) => {
    const digits = normalizeProcedureId(value);
    if (!digits) return null;

    return registeredProcedures.value.find(procedure => normalizeProcedureId(procedure.displayId) === digits || String(procedure.id ?? '') === digits) ?? null;
};

const findProcedureByDescription = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return null;

    return registeredProcedures.value.find(procedure => procedure.description.toLowerCase() === query) ?? null;
};

const syncProcedureIdInput = (row: QuotationProcedure, value: string | null) => {
    const nextValue = value ?? '';
    row.procedureIdText = nextValue;

    if (!normalizeProcedureId(nextValue)) {
        clearProcedureRow(row);
        return;
    }

    const procedure = findProcedureById(nextValue);
    if (procedure) {
        applyProcedureToRow(row, procedure);
        return;
    }

    row.procedureId = null;
    row.description = '';
    row.value = 0;
    row.classification = '';
    updateQuotationTotalFromProcedures();
};

const syncProcedureDescriptionInput = (row: QuotationProcedure, value: ProcedureOption | string | null) => {
    if (value && typeof value === 'object') {
        applyProcedureToRow(row, value);
        return;
    }

    const nextValue = value ?? '';
    row.description = nextValue;

    if (!nextValue.trim()) {
        clearProcedureRow(row);
        return;
    }

    const procedure = findProcedureByDescription(nextValue);
    if (procedure) {
        applyProcedureToRow(row, procedure);
        return;
    }

    row.procedureId = null;
    row.procedureIdText = '';
    row.value = 0;
    row.classification = '';
    updateQuotationTotalFromProcedures();
};

const searchProcedureDescriptions = (event: { query: string }) => {
    const query = event.query?.trim().toLowerCase() ?? '';
    const queryId = normalizeProcedureId(query);

    procedureDescriptionSuggestions.value = registeredProcedures.value.filter(procedure => {
        const description = procedure.description.toLowerCase();
        const id = normalizeProcedureId(procedure.displayId);
        return !query || description.includes(query) || (queryId && id.includes(queryId));
    });
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

const sanitizePdfText = (value: string) => value
    .normalize('NFC')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const toPdfBytes = (value: string) => Uint8Array.from(Array.from(value, char => char.charCodeAt(0) <= 255 ? char.charCodeAt(0) : 63));

const wrapPdfText = (value: string, maxLength: number) => {
    const words = value.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;

        if (nextLine.length <= maxLength) {
            currentLine = nextLine;
            return;
        }

        if (currentLine) lines.push(currentLine);
        currentLine = word;
    });

    if (currentLine) lines.push(currentLine);
    return lines.length ? lines : [''];
};

const createQuotationPdfBlob = (quotation: Quotation) => {
    const pageWidth = 595;
    const top = 790;
    const left = 50;
    const bottom = 60;
    const pages: string[] = [];
    let lines: string[] = [];
    let y = top;

    const addPage = () => {
        if (lines.length) pages.push(lines.join('\n'));
        lines = [];
        y = top;
    };

    const addText = (text: string, x = left, size = 10, font = 'F1') => {
        if (y < bottom) addPage();
        lines.push(`BT /${font} ${size} Tf ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`);
        y -= size + 6;
    };

    const addWrappedText = (text: string, x = left, size = 10, maxLength = 78) => {
        wrapPdfText(text, maxLength).forEach(line => addText(line, x, size));
    };

    const addRule = () => {
        if (y < bottom) addPage();
        lines.push(`${left} ${y} m ${pageWidth - left} ${y} l S`);
        y -= 14;
    };

    addText('Orçamento', left, 18, 'F2');
    addText(`Código: ${quotation.id || 'Novo orçamento'}`, left, 11, 'F2');
    addRule();
    addText(`Paciente: ${quotation.patientName || '-'}`);
    addText(`CPF: ${quotation.patientCpf || '-'}`);
    addText(`Status: ${quotation.status}`);
    addText(`Data de geração: ${formatDate(quotation.generationDate) || '-'}`);
    addText(`Valor total: ${formatCurrency(quotation.totalValue)}`, left, 11, 'F2');
    y -= 8;
    addText('Procedimentos', left, 13, 'F2');
    addRule();

    if (quotation.procedures.length) {
        quotation.procedures.forEach((procedure, index) => {
            addText(`${index + 1}. ${procedure.procedureIdText || '-'} - ${procedure.description || '-'}`, left, 10, 'F2');
            addWrappedText(`Classificação: ${procedure.classification || '-'}`, left + 14, 10, 74);
            addText(`Valor: ${formatCurrency(procedure.value || 0)}`, left + 14);
            y -= 4;
        });
    } else {
        addText('Nenhum procedimento adicionado.');
    }

    y -= 8;
    addRule();
    addText(`Total do orçamento: ${formatCurrency(quotation.totalValue)}`, left, 12, 'F2');
    if (lines.length) pages.push(lines.join('\n'));

    const pageCount = pages.length;
    const fontRegularObjectNumber = 3 + pageCount * 2;
    const fontBoldObjectNumber = fontRegularObjectNumber + 1;
    const objects: string[] = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pageCount} >>`
    ];

    pages.forEach((content, index) => {
        const pageObjectNumber = 3 + index * 2;
        const contentObjectNumber = pageObjectNumber + 1;
        const streamContent = `${content}\n`;
        objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} 842] /Resources << /Font << /F1 ${fontRegularObjectNumber} 0 R /F2 ${fontBoldObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
        objects.push(`<< /Length ${toPdfBytes(streamContent).length} >>\nstream\n${streamContent}endstream`);
    });

    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];

    objects.forEach((object, index) => {
        offsets.push(toPdfBytes(pdf).length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = toPdfBytes(pdf).length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach(offset => {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([toPdfBytes(pdf)], { type: 'application/pdf' });
};

const downloadQuotationPdf = (quotation: Quotation) => {
    const blob = createQuotationPdfBlob(quotation);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeId = (quotation.id || 'orcamento').replace(/[^\w-]/g, '');

    link.href = url;
    link.download = `${safeId || 'orcamento'}-${quotation.patientName || 'paciente'}.pdf`.replace(/[\\/:*?"<>|]/g, '-');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
                label: 'Aprovar orçamento',
                icon: 'pi pi-check',
                command: () => approveQuotation()
            },
            {
                label: 'Rejeitar orçamento',
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

const openAddDialog = () => {
    currentQuotation.value = getEmptyQuotation();
    selectedPatient.value = null;
    patientSuggestions.value = registeredPatients.value;
    procedureDescriptionSuggestions.value = registeredProcedures.value;
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
        if (currentQuotation.value.procedures.length > 0) {
            updateQuotationTotalFromProcedures();
        }

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
    procedureDescriptionSuggestions.value = registeredProcedures.value;
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
            updateQuotationTotalFromProcedures();
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

onMounted(() => {
    void loadPatients();
    void loadProcedures();
});
</script>
