<template>
    <AppLayout title="Orçamentos">
        <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <AppTableToolbar
                v-model="quotationFilters.global.value"
                placeholder="Pesquisar orçamentos"
                :has-filters="Object.values(quotationFilters).some(filter => !!filter.value)"
                @clear="Object.values(quotationFilters).forEach(filter => filter.value = null)"
            >
                <Button size="small" icon="pi pi-plus" label="Novo orçamento" :disabled="busy || loading" @click="openAddDialog" />
            </AppTableToolbar>

            <div v-if="listError" role="alert" class="p-4 flex items-center gap-3">
                <span>{{ listError }}</span>
                <Button label="Tentar novamente" size="small" :disabled="loading || busy" @click="loadQuotations" />
            </div>
            <div class="app-table-region flex-1 flex flex-col overflow-hidden px-2 pb-2">
                <DataTable
                    v-model:filters="quotationFilters"
                    v-model:selection="selectedQuotation"
                    v-model:contextMenuSelection="contextMenuSelection"
                    @rowContextmenu="onRowContextMenu"
                    :value="quotations"
                    :loading="loading"
                    class="app-table flex-1 px-2 sm:px-4"
                    scrollable
                    scrollHeight="flex"
                    selectionMode="single"
                    :metaKeySelection="metaKey"
                    dataKey="id"
                    filterDisplay="row"
                    :globalFilterFields="['status', 'code', 'patientName', 'patientCpf', 'totalValue', 'generationDate']"
                    :rowClass="rowClass"
                    paginator
                    :rows="10"
                    :rowsPerPageOptions="[5, 10, 20]"
                    paginatorTemplate="RowsPerPageDropdown PrevPageLink CurrentPageReport NextPageLink "
                    currentPageReportTemplate="{first}–{last} de {totalRecords} registros"
                >
                    <template #empty><AppEmptyState :title="loading ? 'Carregando orçamentos…' : listError ? 'Não foi possível carregar os orçamentos.' : 'Nenhum orçamento encontrado.'" /></template>

                    <Column field="status" header="Status" :showFilterMenu="false" style="width: 8rem;">
                        <template #body="{ data }">
                            <AppStatusBadge :value="data.status" />
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <Select
                                v-model="filterModel.value"
                                @change="filterCallback()"
                                :options="statusOptions"
                                placeholder="Todos" aria-label="Todos"
                                class="w-full h-[36px] text-sm bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-md flex items-center"
                                :showClear="true"
                            />
                        </template>
                    </Column>

                    <Column field="code" header="ID Orçamento" :showFilterMenu="false" style="width: 12rem;">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" aria-label="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="generationDate" header="Data de Geração" :showFilterMenu="false" style="width: 12rem;">
                        <template #body="{ data }">
                            {{ formatDate(data.generationDate) }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Data" aria-label="Buscar Data" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="patientName" header="Nome do Paciente" :showFilterMenu="false">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Paciente" aria-label="Buscar Paciente" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column headerClass="app-numeric-cell" bodyClass="app-numeric-cell" field="totalValue" header="Valor Total" :showFilterMenu="false" style="width: 12rem;">
                        <template #body="{ data }">
                            {{ formatCurrency(data.totalValue) }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Valor" aria-label="Buscar Valor" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column headerClass="app-actions-cell" header="Ações" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex justify-center gap-2 pr-2">
                                <Button aria-label="Editar detalhes" title="Editar detalhes" icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="busy" />
                                <Button aria-label="Baixar orçamento em PDF" title="Baixar orçamento em PDF" icon="pi pi-download" variant="outlined" rounded size="small" @click="downloadQuotationPdf(slotProps.data)" :disabled="busy" />
                                <Button aria-label="Inativar registro" title="Inativar registro" icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeleteQuotation(slotProps.data)" :disabled="busy || slotProps.data.status === 'Inativo'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog :draggable="false" v-model:visible="addDialogVisible" :style="{ width: '1180px' }" header="Novo Orçamento" :modal="true" :closable="!busy" :closeOnEscape="!busy" class="app-dialog p-fluid">
        <fieldset :disabled="busy" class="app-dialog-body app-dialog-section border-0 min-w-0">
            <QuotationGeneralFields
                mode="add"
                :submitted="submitted"
            />
            <QuotationProceduresSection />
        </fieldset>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" :disabled="busy" text @click="closeAddDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="busy" :disabled="busy" @click="saveAddedQuotation" />
        </template>
    </Dialog>

    <Dialog :draggable="false" v-model:visible="editDialogVisible" :style="{ width: '1180px' }" header="Detalhes do Orçamento" :modal="true" :closable="!busy" :closeOnEscape="!busy" class="app-dialog p-fluid">
        <fieldset :disabled="busy" class="app-dialog-body app-dialog-section border-0 min-w-0">
            <QuotationGeneralFields
                mode="edit"
                :submitted="submitted"
            />
            <QuotationProceduresSection />
        </fieldset>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" :disabled="busy" text @click="closeEditDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="busy" :disabled="busy" @click="saveEditedQuotation" />
        </template>
    </Dialog>

    <Dialog :draggable="false" v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" header="Confirmar inativação" :modal="true" :closable="!busy" :closeOnEscape="!busy" class="app-dialog">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" />
            <div class="app-dialog-section">
                <span v-if="currentQuotation">Tem certeza que deseja inativar o orçamento do paciente <b>{{ currentQuotation.patientName }}</b>?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" :disabled="busy" text @click="deleteDialogVisible = false" />
            <Button label="Inativar" icon="pi pi-check" :loading="busy" :disabled="busy" severity="danger" @click="executeDelete" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import axios from 'axios';
import { getApiErrorMessage } from '../../infrastructure/http/api';
import { QuotationService } from '../../infrastructure/services/QuotationService';
import type { ApiQuotation, QuotationInput, QuotationStatus } from '../../infrastructure/services/QuotationService';
import AppEmptyState from '../components/AppEmptyState.vue';
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
import InputMask from 'primevue/inputmask';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';
import { ProcedureService } from '../../infrastructure/services/ProcedureService';
import type { ApiProcedure } from '../../infrastructure/services/ProcedureService';
import AppTableToolbar from '../components/AppTableToolbar.vue';
import AppStatusBadge from '../components/AppStatusBadge.vue';
import AppLayout from '../components/AppLayout.vue';

interface QuotationProcedure {
    rowKey: string;
    id?: number;
    procedureId: number | null;
    procedureIdText: string;
    description: string;
    value: number;
    classification: string;
}

interface Quotation {
    id: number | null;
    code: string;
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

const quotations = ref<Quotation[]>([]);
const loading = ref(false);
const busy = ref(false);
const listError = ref('');
const totalMode = ref<'automatic' | 'manual'>('automatic');
const originalStatus = ref<Quotation['status']>('Pendente');
const statusToApi: Record<Quotation['status'], QuotationStatus> = {
    Pendente: 'PENDENTE', Aprovado: 'APROVADO', Rejeitado: 'REJEITADO', Inativo: 'INATIVO'
};
const statusFromApi: Record<QuotationStatus, Quotation['status']> = {
    PENDENTE: 'Pendente', APROVADO: 'Aprovado', REJEITADO: 'Rejeitado', INATIVO: 'Inativo'
};
const allowedStatuses: Record<Quotation['status'], Quotation['status'][]> = {
    Pendente: ['Pendente', 'Aprovado', 'Rejeitado', 'Inativo'],
    Aprovado: ['Aprovado', 'Pendente', 'Inativo'],
    Rejeitado: ['Rejeitado', 'Pendente', 'Inativo'],
    Inativo: ['Inativo', 'Pendente']
};
const fromApi = (data: ApiQuotation): Quotation => ({
    ...data, status: statusFromApi[data.status], patientCpf: formatCpf(data.patientCpf),
    procedures: data.procedures.map((item, index) => ({
        ...item, rowKey: `saved-${data.id}-${index}`, procedureIdText: item.procedureCode ?? ''
    }))
});
const replaceSavedQuotation = (data: ApiQuotation) => {
    const saved = fromApi(data);
    const index = quotations.value.findIndex(item => item.id === saved.id);
    if (index < 0) quotations.value.unshift(saved);
    else quotations.value.splice(index, 1, saved);
};
const loadQuotations = async () => {
    loading.value = true;
    listError.value = '';
    try { quotations.value = (await QuotationService.list()).map(fromApi); }
    catch (error) { listError.value = getApiErrorMessage(error); }
    finally { loading.value = false; }
};
const showOperationError = async (error: unknown) => {
    toast.add({ severity: 'error', summary: 'Operação não concluída', detail: getApiErrorMessage(error), life: 6000 });
    if (axios.isAxiosError(error) && error.response?.status === 409) {
        editDialogVisible.value = false;
        deleteDialogVisible.value = false;
        await loadQuotations();
        toast.add({ severity: 'warn', summary: 'Dados alterados', detail: 'A lista foi recarregada. Reabra os detalhes antes de tentar novamente.', life: 6000 });
    }
};

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
    code: { value: null, matchMode: FilterMatchMode.CONTAINS },
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
                                inputId: `${prefix}-patient`,
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
                                inputId: `${prefix}-value`,
                                modelValue: currentQuotation.value.totalValue,
                                'onUpdate:modelValue': (value: number | null) => {
                                    totalMode.value = 'manual';
                                    currentQuotation.value.totalValue = value ?? 0;
                                },
                                mode: 'currency',
                                currency: 'BRL',
                                locale: 'pt-BR',
                                class: 'w-full',
                                min: 0, max: 9999999999.99
                            }),
                            h(Button, { label: 'Recalcular pelos itens', size: 'small', text: true,
                                disabled: !currentQuotation.value.procedures.length,
                                onClick: () => { totalMode.value = 'automatic'; updateQuotationTotalFromProcedures(); }
                            }),
                            h('small', null, totalMode.value === 'automatic' ? 'Total calculado pelos itens ao salvar.' : 'Total manual preservado ao salvar.')
                        ]),
                        h('div', { class: 'app-field col-span-12 md:col-span-6' }, [
                            h('label', { for: `${prefix}-status`, class: 'app-field-label' }, 'Status'),
                            h(Select, {
                                inputId: `${prefix}-status`,
                                modelValue: currentQuotation.value.status,
                                'onUpdate:modelValue': (value: Quotation['status']) => {
                                    currentQuotation.value.status = value;
                                },
                                options: props.mode === 'add' ? ['Pendente'] : allowedStatuses[originalStatus.value],
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
                            header: 'Descrição',
                            style: 'min-width: 24rem'
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
                            body: ({ data }: { data: QuotationProcedure }) => h(InputNumber, {
                                modelValue: data.value, 'onUpdate:modelValue': (value: number | null) => { data.value = value ?? 0; updateQuotationTotalFromProcedures(); },
                                mode: 'currency', currency: 'BRL', locale: 'pt-BR', min: 0, max: 9999999999.99, fluid: true,
                                'aria-label': 'Valor do procedimento'
                            })
                        }),
                        h(Column, {
                            field: 'classification',
                            header: 'Classificação',
                            style: 'width: 12rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h(InputText, {
                                modelValue: data.classification, 'onUpdate:modelValue': (value: string | undefined) => { data.classification = value ?? ''; },
                                maxlength: 255, fluid: true, 'aria-label': 'Classificação do procedimento'
                            })
                        }),
                        h(Column, {
                            header: 'Ações',
                            headerClass: 'app-actions-cell',
                            style: 'width: 4rem'
                        }, {
                            body: ({ data }: { data: QuotationProcedure }) => h('div', { class: 'quotation-procedure-action' }, [
                                h(Button, {
                                    'aria-label': 'Remover procedimento',
                                    title: 'Remover procedimento',
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

function localDate() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function getEmptyQuotation(): Quotation {
    return {
        id: null,
        code: '',
        patientId: null,
        status: 'Pendente',
        generationDate: localDate(),
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
            .filter(patient => patient.statusCode === 0)
            .map(toPatientOption)
            .filter(patient => patient.name || patient.cpf);
    } catch (error: unknown) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: getApiErrorMessage(error),
            life: 5000
        });
    }
};

const loadProcedures = async () => {
    try {
        const procedures = await ProcedureService.list();
        registeredProcedures.value = procedures
            .filter(procedure => procedure.statusCode === 0)
            .map(toProcedureOption)
            .filter(procedure => procedure.id || procedure.description);
        procedureDescriptionSuggestions.value = registeredProcedures.value;
    } catch (error: unknown) {
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: getApiErrorMessage(error),
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

    currentQuotation.value.patientId = null;
    selectedPatient.value = currentQuotation.value.patientName;
    if (normalizeCpf(nextValue)) findPatientByCpf(nextValue);
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
    const quotation = currentQuotation.value;
    selectedPatient.value = quotation.patientId == null ? quotation.patientName : {
        id: quotation.patientId, name: quotation.patientName, cpf: quotation.patientCpf
    };
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
    if (totalMode.value === 'automatic') {
        currentQuotation.value.totalValue = currentQuotation.value.procedures.reduce((acc, item) => acc + Math.round((item.value ?? 0) * 100), 0) / 100;
    }
};

const addProcedureRow = () => {
    if (currentQuotation.value.procedures.length >= 200) {
        toast.add({ severity: 'warn', summary: 'Limite de itens', detail: 'O orçamento permite até 200 procedimentos.', life: 4000 });
        return;
    }
    currentQuotation.value.procedures.push(getEmptyQuotationProcedure());
};

const removeProcedureRow = (procedure: QuotationProcedure) => {
    currentQuotation.value.procedures = currentQuotation.value.procedures.filter(item => item.rowKey !== procedure.rowKey);
    updateQuotationTotalFromProcedures();
};

const clearProcedureRow = (row: QuotationProcedure) => {
    delete row.id;
    row.procedureId = null;
    row.procedureIdText = '';
    row.description = '';
    row.value = 0;
    row.classification = '';
    updateQuotationTotalFromProcedures();
};

const applyProcedureToRow = (row: QuotationProcedure, procedure: ProcedureOption) => {
    if (row.procedureId === procedure.id && row.id != null) return;
    delete row.id;
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
    if (nextValue === row.procedureIdText) return;
    delete row.id;
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
    if (nextValue === row.description) return;
    delete row.id;
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
    addText(`Código: ${quotation.code || 'Novo orçamento'}`, left, 11, 'F2');
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

const downloadQuotationPdf = async (target: Quotation) => {
    if (busy.value || target.id == null) return;
    busy.value = true;
    try {
    const quotation = fromApi(await QuotationService.details(target.id));
    const blob = createQuotationPdfBlob(quotation);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeId = (quotation.code || 'orcamento').replace(/[^\w-]/g, '');

    link.href = url;
    link.download = `${safeId || 'orcamento'}-${quotation.patientName || 'paciente'}.pdf`.replace(/[\\/:*?"<>|]/g, '-');
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    } catch (error) { await showOperationError(error); }
    finally { busy.value = false; }
};


const changeQuotationStatus = async (status: Quotation['status']) => {
    const target = contextMenuSelection.value;
    if (busy.value || target?.id == null) return;
    busy.value = true;
    try {
        replaceSavedQuotation(await QuotationService.changeStatus(target.id, statusToApi[status]));
        toast.add({ severity: 'success', summary: 'Status atualizado', detail: 'O orçamento foi atualizado.', life: 3000 });
    } catch (error) { await showOperationError(error); }
    finally { busy.value = false; contextMenuSelection.value = null; }
};
const onRowContextMenu = (event: any) => {
    if (busy.value || !contextMenuSelection.value) return;
    const status = contextMenuSelection.value.status;
    menuItems.value = status === 'Pendente' ? [
        { label: 'Aprovar orçamento', icon: 'pi pi-check', command: () => changeQuotationStatus('Aprovado') },
        { label: 'Rejeitar orçamento', icon: 'pi pi-times', command: () => changeQuotationStatus('Rejeitado') }
    ] : [{ label: status === 'Inativo' ? 'Reativar orçamento' : 'Reabrir orçamento', icon: 'pi pi-refresh', command: () => changeQuotationStatus('Pendente') }];
    cm.value.show(event.originalEvent);
};
const openAddDialog = () => {
    if (busy.value) return;
    void loadPatients();
    void loadProcedures();
    currentQuotation.value = getEmptyQuotation();
    totalMode.value = 'automatic';
    originalStatus.value = 'Pendente';
    selectedPatient.value = null;
    patientSuggestions.value = registeredPatients.value;
    procedureDescriptionSuggestions.value = registeredProcedures.value;
    submitted.value = false;
    addDialogVisible.value = true;
};
const closeAddDialog = () => { if (!busy.value) { addDialogVisible.value = false; submitted.value = false; } };
const closeEditDialog = () => { if (!busy.value) { editDialogVisible.value = false; submitted.value = false; } };
const openEditDialog = async (target: Quotation) => {
    if (busy.value || target.id == null) return;
    busy.value = true;
    try {
        await Promise.all([loadPatients(), loadProcedures()]);
        currentQuotation.value = fromApi(await QuotationService.details(target.id));
        originalStatus.value = currentQuotation.value.status;
        totalMode.value = 'manual';
        syncSelectedPatient();
        procedureDescriptionSuggestions.value = registeredProcedures.value;
        submitted.value = false;
        editDialogVisible.value = true;
    } catch (error) { await showOperationError(error); }
    finally { busy.value = false; }
};
const validMoney = (value: number) => Number.isFinite(value) && value >= 0 && value <= 9999999999.99 && Math.abs(value * 100 - Math.round(value * 100)) < 0.001;
const validCpf = (cpf: string) => {
    if (!cpf) return true;
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    for (const length of [9, 10]) {
        const sum = [...cpf.slice(0, length)].reduce((acc, digit, index) => acc + Number(digit) * (length + 1 - index), 0);
        const check = (sum * 10 % 11) % 10;
        if (check !== Number(cpf[length])) return false;
    }
    return true;
};
const quotationPayload = (): QuotationInput => {
    const q = currentQuotation.value;
    if (!q.patientName.trim() || q.patientName.trim().length > 255) throw new Error('Informe um nome de paciente com até 255 caracteres.');
    const cpf = normalizeCpf(q.patientCpf);
    if (!validCpf(cpf)) throw new Error('Informe um CPF válido ou deixe o campo vazio.');
    if (!validMoney(q.totalValue)) throw new Error('Informe um total válido, com até duas casas decimais.');
    if (!q.procedures.length && q.totalValue <= 0) throw new Error('Informe itens ou um total maior que zero.');
    if (q.procedures.length > 200) throw new Error('O orçamento permite até 200 itens.');
    for (const item of q.procedures) {
        if (!item.description.trim() || item.description.length > 255 || !item.classification.trim() || item.classification.length > 255 || !validMoney(item.value)) {
            throw new Error('Preencha descrição, classificação e valor válido de todos os procedimentos (textos com até 255 caracteres).');
        }
    }
    return {
        patientId: q.patientId, patientName: q.patientName.trim(), patientCpf: cpf || null,
        status: statusToApi[q.status], generationDate: q.generationDate,
        totalValue: totalMode.value === 'automatic' && q.procedures.length ? 0 : q.totalValue,
        procedures: q.procedures.map(item => ({
            ...(item.id == null ? {} : { id: item.id }), procedureId: item.procedureId,
            description: item.description, value: item.value, classification: item.classification
        }))
    };
};
const saveQuotation = async (editing: boolean) => {
    if (busy.value) return;
    submitted.value = true;
    busy.value = true;
    try {
        syncPatientName({ value: selectedPatient.value });
        updateQuotationTotalFromProcedures();
        const payload = quotationPayload();
        const id = currentQuotation.value.id;
        if (editing && id == null) throw new Error('Orçamento sem identificador. Reabra os detalhes.');
        const saved = editing ? await QuotationService.edit({ ...payload, id: id! }) : await QuotationService.create(payload);
        replaceSavedQuotation(saved);
        addDialogVisible.value = false;
        editDialogVisible.value = false;
        toast.add({ severity: 'success', summary: 'Orçamento salvo', detail: 'Os dados foram salvos no servidor.', life: 3000 });
    } catch (error) { await showOperationError(error); }
    finally { busy.value = false; }
};
const saveAddedQuotation = () => saveQuotation(false);
const saveEditedQuotation = () => saveQuotation(true);
const confirmDeleteQuotation = (quotation: Quotation) => {
    if (busy.value) return;
    currentQuotation.value = { ...quotation };
    deleteDialogVisible.value = true;
};
const executeDelete = async () => {
    const id = currentQuotation.value.id;
    if (busy.value || id == null) return;
    busy.value = true;
    try {
        await QuotationService.inactivate(id);
        const target = quotations.value.find(item => item.id === id);
        if (target) target.status = 'Inativo';
        deleteDialogVisible.value = false;
        toast.add({ severity: 'success', summary: 'Orçamento inativado', detail: 'O registro continua disponível para consulta e reativação.', life: 3000 });
    } catch (error) { await showOperationError(error); }
    finally { busy.value = false; }
};

const rowClass = (data: Quotation) => {
    return [{ 'inactive-row': data.status === 'Inativo' }];
};

onMounted(() => {
    void loadQuotations();
    void loadPatients();
    void loadProcedures();
});
</script>
