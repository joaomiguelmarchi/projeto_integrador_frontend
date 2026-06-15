<template>
    <AppLayout title="Procedimentos">
        <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <div class="flex justify-between items-center p-5 border-b border-[var(--p-surface-200)]">
                <IconField>
                    <InputIcon class="flex items-center">
                        <i class="pi pi-search text-[var(--p-surface-400)]" />
                    </InputIcon>
                    <InputText
                        v-model="procedureFilters.global.value"
                        placeholder="Pesquisar"
                        class="py-2 px-3 pl-10 h-9 bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-full w-64 focus:ring-2 focus:ring-[var(--p-surface-900)] focus:border-[var(--p-surface-900)] shadow-sm transition-shadow"
                    />
                </IconField>

                <Button
                    icon="pi pi-plus"
                    label="Adicionar"
                    class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center !rounded-lg ml-2 shadow-md"
                    @click="openAddDialog"
                />
            </div>

            <div class="flex-1 flex flex-col overflow-hidden px-2 pb-2">
                <DataTable
                    v-model:filters="procedureFilters"
                    v-model:selection="selectedProcedure"
                    v-model:contextMenuSelection="contextMenuSelection"
                    @rowContextmenu="onRowContextMenu"
                    :value="procedures"
                    :loading="loading"
                    class="app-table flex-1 px-4"
                    scrollable
                    scrollHeight="flex"
                    selectionMode="single"
                    :metaKeySelection="metaKey"
                    dataKey="id"
                    filterDisplay="row"
                    :globalFilterFields="['status', 'displayId', 'description', 'price', 'category']"
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
                                <span class="px-4 py-1.5 rounded-full inline-flex items-center gap-2 bg-[var(--p-surface-0)] text-[var(--p-surface-500)] border border-[var(--p-surface-300)]">
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

                    <Column field="displayId" header="ID Procedimento" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="description" header="Descricao" :showFilterMenu="false">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Descricao" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
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

                    <Column field="category" header="Classificacao" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <Select
                                v-model="filterModel.value"
                                @change="filterCallback()"
                                :options="categories"
                                placeholder="Selecione"
                                class="py-1 px-2 text-sm h-[36px] flex items-center w-full"
                                :showClear="true"
                            />
                        </template>
                    </Column>

                    <Column :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex justify-center gap-2 pr-2">
                                <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                                <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeleteProcedure(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog v-model:visible="addDialogVisible" :style="{ width: '550px' }" header="Adicionar Procedimento" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <div class="app-field">
                <label for="add-description" class="app-field-label">Descricao<span class="app-required-mark">*</span></label>
                <InputText id="add-description" v-model.trim="currentProcedure.description" required="true" autofocus :invalid="submitted && !currentProcedure.description" class="w-full" />
                <small v-if="submitted && !currentProcedure.description" class="app-field-error">A descricao é obrigatoria.</small>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="app-field">
                    <label for="add-price" class="app-field-label">Valor (R$)<span class="app-required-mark">*</span></label>
                    <InputNumber id="add-price" v-model="currentProcedure.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
                    <small v-if="submitted && !currentProcedure.price" class="app-field-error">O preço é obrigatorio.</small>
                </div>
                <div class="app-field">
                    <label for="add-category" class="app-field-label">Classificacao<span class="app-required-mark">*</span></label>
                    <Select id="add-category" v-model="currentProcedure.category" :options="categories" placeholder="Selecione" class="w-full" />
                    <small v-if="submitted && !currentProcedure.category" class="app-field-error">A categoria é obrigatoria.</small>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" @click="saveAddedProcedure" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editDialogVisible" :style="{ width: '550px' }" header="Detalhes do Procedimento" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <div class="app-field">
                <label for="edit-description" class="app-field-label">Descricao<span class="app-required-mark">*</span></label>
                <InputText id="edit-description" v-model.trim="currentProcedure.description" required="true" autofocus :invalid="submitted && !currentProcedure.description" class="w-full" />
                <small v-if="submitted && !currentProcedure.description" class="app-field-error">A descricao e obrigatoria.</small>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="app-field">
                    <label for="add-price" class="app-field-label">Valor (R$)<span class="app-required-mark">*</span></label>
                    <InputNumber id="add-price" v-model="currentProcedure.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
                    <small v-if="submitted && !currentProcedure.price" class="app-field-error">O preço é obrigatorio.</small>
                </div>
                <div class="app-field">
                    <label for="add-category" class="app-field-label">Classificacao<span class="app-required-mark">*</span></label>
                    <Select id="add-category" v-model="currentProcedure.category" :options="categories" placeholder="Selecione" class="w-full" />
                    <small v-if="submitted && !currentProcedure.category" class="app-field-error">A categoria é obrigatoria.</small>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" @click="saveEditedProcedure" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" header="Confirmar Exclusao" :modal="true" class="app-dialog">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" />
            <div class="app-dialog-section">
                <span v-if="currentProcedure">Voce tem certeza que quer inativar <b>{{ currentProcedure.description }}</b>?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Nao" icon="pi pi-times" text @click="deleteDialogVisible = false" />
            <Button label="Sim" icon="pi pi-check" severity="danger" :loading="saving" @click="executeDelete" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
import { useToast } from 'primevue/usetoast';
import AppLayout from '../components/AppLayout.vue';
import { getProcedureServiceErrorMessage, ProcedureService } from '../../infrastructure/services/ProcedureService';
import type { ApiProcedure } from '../../infrastructure/services/ProcedureService';

interface Procedure {
    id: number | null;
    displayId: string;
    status: string;
    description: string;
    price: number;
    category: string;
}

const categories = ref(['Prevencao', 'Dentistica', 'Clareamento', 'Endodontia', 'Periodontia', 'Cirurgia', 'Protese', 'Radiologia', 'Ortodontia', 'Implantes']);
const toast = useToast();
const procedures = ref<Procedure[]>([]);
const loading = ref(false);
const saving = ref(false);
const selectedProcedure = ref<Procedure | null>(null);
const contextMenuSelection = ref<Procedure | null>(null);
const metaKey = ref(true);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);
const currentProcedure = ref<Procedure>({} as Procedure);
const cm = ref();

const procedureFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: 'Ativo', matchMode: FilterMatchMode.EQUALS },
    displayId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    price: { value: null, matchMode: FilterMatchMode.CONTAINS },
    category: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const menuItems = ref([
    {
        label: 'Reativar procedimento',
        icon: 'pi pi-refresh',
        command: () => reactivateProcedure()
    }
]);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const statusFromCode = (statusCode?: number | null) => statusCode === 1 ? 'Inativo' : 'Ativo';
const statusToCode = (status: string) => status === 'Inativo' ? 1 : 0;

const formatDisplayId = (id?: number | null) => id ? `#${id.toString().padStart(7, '0')}` : '';

const toViewProcedure = (procedure: ApiProcedure): Procedure => ({
    id: procedure.id ?? null,
    displayId: formatDisplayId(procedure.id),
    status: statusFromCode(procedure.statusCode),
    description: procedure.name ?? '',
    price: procedure.value ?? 0,
    category: procedure.type ?? ''
});

const toApiProcedure = (procedure: Procedure): ApiProcedure => ({
    id: procedure.id,
    statusCode: statusToCode(procedure.status),
    name: procedure.description,
    value: procedure.price,
    type: procedure.category
});

const updateProcedureInList = (procedure: ApiProcedure) => {
    const index = procedures.value.findIndex(p => p.id === procedure.id);

    if (index !== -1) {
        procedures.value[index] = toViewProcedure(procedure);
    }
};

const showError = (detail: string) => {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
};

const loadProcedures = async () => {
    loading.value = true;

    try {
        const data = await ProcedureService.list();
        procedures.value = data.map(toViewProcedure);
    } catch (error: unknown) {
        showError(getProcedureServiceErrorMessage(error));
    } finally {
        loading.value = false;
    }
};

const openAddDialog = () => {
    currentProcedure.value = {
        id: null,
        displayId: '',
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

const saveAddedProcedure = async () => {
    submitted.value = true;

    if (!currentProcedure.value.description?.trim()) return;

    saving.value = true;

    try {
        const savedProcedure = await ProcedureService.register(toApiProcedure(currentProcedure.value));
        procedures.value.unshift(toViewProcedure(savedProcedure));
        addDialogVisible.value = false;
        currentProcedure.value = {} as Procedure;
        toast.add({ severity: 'success', summary: 'Procedimento salvo', detail: 'Cadastro realizado com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getProcedureServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const openEditDialog = (proc: Procedure) => {
    currentProcedure.value = { ...proc };
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    submitted.value = false;
};

const saveEditedProcedure = async () => {
    submitted.value = true;

    if (!currentProcedure.value.description?.trim()) return;

    saving.value = true;

    try {
        const savedProcedure = await ProcedureService.edit(toApiProcedure(currentProcedure.value));
        updateProcedureInList(savedProcedure);

        editDialogVisible.value = false;
        currentProcedure.value = {} as Procedure;
        toast.add({ severity: 'success', summary: 'Procedimento atualizado', detail: 'Alteracoes salvas com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getProcedureServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const confirmDeleteProcedure = (proc: Procedure) => {
    currentProcedure.value = { ...proc };
    deleteDialogVisible.value = true;
};

const executeDelete = async () => {
    if (!currentProcedure.value.id) return;

    saving.value = true;

    try {
        const inactiveProcedure = { ...currentProcedure.value, status: 'Inativo' };
        const savedProcedure = await ProcedureService.edit(toApiProcedure(inactiveProcedure));
        updateProcedureInList(savedProcedure);

        deleteDialogVisible.value = false;
        currentProcedure.value = {} as Procedure;
        toast.add({ severity: 'success', summary: 'Procedimento inativado', detail: 'Registro atualizado com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getProcedureServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const onRowContextMenu = (event: any) => {
    if (contextMenuSelection.value?.status === 'Inativo') {
        cm.value.show(event.originalEvent);
    }
};

const reactivateProcedure = () => {
    if (!contextMenuSelection.value) return;

    currentProcedure.value = { ...contextMenuSelection.value, status: 'Ativo' };
    void saveEditedProcedure();
    contextMenuSelection.value = null;
};

const rowClass = (data: Procedure) => {
    return [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': data.status === 'Inativo' }];
};

onMounted(loadProcedures);
</script>
