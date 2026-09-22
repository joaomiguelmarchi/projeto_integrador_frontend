<template>
    <AppLayout title="Procedimentos">
        <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <AppTableToolbar
                v-model="procedureFilters.global.value"
                placeholder="Pesquisar procedimentos"
                :has-filters="Object.values(procedureFilters).some(filter => !!filter.value)"
                @clear="Object.values(procedureFilters).forEach(filter => filter.value = null)"
            >
                <Button size="small" icon="pi pi-plus" label="Novo procedimento" @click="openAddDialog" />
            </AppTableToolbar>

            <div class="app-table-region flex-1 flex flex-col overflow-hidden px-2 pb-2">
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
                    currentPageReportTemplate="{first}–{last} de {totalRecords} registros"
                >
                    <template #empty><AppEmptyState title="Nenhum procedimento encontrado." /></template>

                    <template #loading>
                        <div class="text-center py-8 text-[var(--p-surface-500)] font-medium flex items-center justify-center gap-3">
                            <i class="pi pi-spin pi-spinner text-xl"></i>
                            Carregando dados...
                        </div>
                    </template>

                    <Column field="status" header="Status" :showFilterMenu="false" style="width: 8rem">
                        <template #body="{ data }">
                            <AppStatusBadge :value="data.status" />
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <Select
                                v-model="filterModel.value"
                                @change="filterCallback()"
                                :options="['Ativo', 'Inativo']"
                                placeholder="Todos" aria-label="Todos"
                                class="w-full h-[36px] text-sm bg-[var(--p-surface-0)] border border-[var(--p-surface-200)] rounded-md flex items-center"
                                :showClear="true"
                            />
                        </template>
                    </Column>

                    <Column field="displayId" header="ID Procedimento" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" aria-label="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="description" header="Descrição" :showFilterMenu="false">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Descrição" aria-label="Buscar Descrição" class="p-column-filter py-1 px-2 text-sm h-[36px]" />
                        </template>
                    </Column>

                    <Column headerClass="app-numeric-cell" bodyClass="app-numeric-cell" field="price" header="Valor" :showFilterMenu="false" style="width: 12rem">
                        <template #body="{ data }">
                            {{ formatCurrency(data.price) }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar Valor" aria-label="Buscar Valor" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
                        </template>
                    </Column>

                    <Column field="category" header="Classificação" :showFilterMenu="false" style="width: 12rem">
                        <template #filter="{ filterModel, filterCallback }">
                            <Select
                                v-model="filterModel.value"
                                @change="filterCallback()"
                                :options="categories"
                                placeholder="Selecione" aria-label="Selecione"
                                class="py-1 px-2 text-sm h-[36px] flex items-center w-full"
                                :showClear="true"
                            />
                        </template>
                    </Column>

                    <Column headerClass="app-actions-cell" header="Ações" :exportable="false" style="min-width: 8rem">
                        <template #body="slotProps">
                            <div class="flex justify-center gap-2 pr-2">
                                <Button aria-label="Editar detalhes" title="Editar detalhes" icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                                <Button aria-label="Inativar registro" title="Inativar registro" icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeleteProcedure(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog :draggable="false" v-model:visible="addDialogVisible" :style="{ width: '680px' }" header="Adicionar Procedimento" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <div class="app-field">
                <label for="add-description" class="app-field-label">Descrição<span class="app-required-mark">*</span></label>
                <InputText id="add-description" v-model.trim="currentProcedure.description" required="true" autofocus :invalid="submitted && !currentProcedure.description" class="w-full" />
                <small v-if="submitted && !currentProcedure.description" class="app-field-error">A descrição é obrigatória.</small>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="app-field">
                    <label for="add-price" class="app-field-label">Valor (R$)<span class="app-required-mark">*</span></label>
                    <InputNumber inputId="add-price" v-model="currentProcedure.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
                    <small v-if="submitted && !currentProcedure.price" class="app-field-error">O preço é obrigatório.</small>
                </div>
                <div class="app-field">
                    <label for="add-category" class="app-field-label">Classificação<span class="app-required-mark">*</span></label>
                    <Select inputId="add-category" v-model="currentProcedure.category" :options="categories" placeholder="Selecione" class="w-full" />
                    <small v-if="submitted && !currentProcedure.category" class="app-field-error">A classificação é obrigatória.</small>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" @click="saveAddedProcedure" />
        </template>
    </Dialog>

    <Dialog :draggable="false" v-model:visible="editDialogVisible" :style="{ width: '680px' }" header="Detalhes do Procedimento" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <div class="app-field">
                <label for="edit-description" class="app-field-label">Descrição<span class="app-required-mark">*</span></label>
                <InputText id="edit-description" v-model.trim="currentProcedure.description" required="true" autofocus :invalid="submitted && !currentProcedure.description" class="w-full" />
                <small v-if="submitted && !currentProcedure.description" class="app-field-error">A descrição é obrigatória.</small>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="app-field">
                    <label for="edit-price" class="app-field-label">Valor (R$)<span class="app-required-mark">*</span></label>
                    <InputNumber inputId="edit-price" v-model="currentProcedure.price" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
                    <small v-if="submitted && !currentProcedure.price" class="app-field-error">O preço é obrigatório.</small>
                </div>
                <div class="app-field">
                    <label for="edit-category" class="app-field-label">Classificação<span class="app-required-mark">*</span></label>
                    <Select inputId="edit-category" v-model="currentProcedure.category" :options="categories" placeholder="Selecione" class="w-full" />
                    <small v-if="submitted && !currentProcedure.category" class="app-field-error">A classificação é obrigatória.</small>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" @click="saveEditedProcedure" />
        </template>
    </Dialog>

    <Dialog :draggable="false" v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" header="Confirmar inativação" :modal="true" class="app-dialog">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" />
            <div class="app-dialog-section">
                <span v-if="currentProcedure">Você tem certeza que deseja inativar <b>{{ currentProcedure.description }}</b>?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="deleteDialogVisible = false" />
            <Button label="Inativar" icon="pi pi-check" severity="danger" :loading="saving" @click="executeDelete" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import AppEmptyState from '../components/AppEmptyState.vue';
import { onMounted, ref } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import ContextMenu from 'primevue/contextmenu';
import { useToast } from 'primevue/usetoast';
import AppTableToolbar from '../components/AppTableToolbar.vue';
import AppStatusBadge from '../components/AppStatusBadge.vue';
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

const categories = ref(['Prevenção', 'Dentística', 'Clareamento', 'Endodontia', 'Periodontia', 'Cirurgia', 'Prótese', 'Radiologia', 'Ortodontia', 'Implantes']);
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
    return [{ 'inactive-row': data.status === 'Inativo' }];
};

onMounted(loadProcedures);
</script>
