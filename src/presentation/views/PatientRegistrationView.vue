<template>
    <Toast />
    <AppLayout title="Pacientes">
        <div class="bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <div class="flex justify-between items-center p-5 border-b border-[var(--p-surface-200)]">
                <IconField>
                    <InputIcon class="flex items-center">
                        <i class="pi pi-search text-[var(--p-surface-400)]" />
                    </InputIcon>
                    <InputText
                        v-model="patientFilters.global.value"
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
                    v-model:filters="patientFilters"
                    v-model:selection="selectedPatient"
                    :value="patients"
                    :loading="loading"
                    class="app-table flex-1 px-4"
                    scrollable
                    scrollHeight="flex"
                    selectionMode="single"
                    :metaKeySelection="metaKey"
                    dataKey="id"
                    filterDisplay="row"
                    :globalFilterFields="['status', 'displayId', 'name', 'cpf', 'mobilePhone']"
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
                                <span class="px-4 py-1.5 rounded-full inline-flex items-center gap-2 border border-[var(--p-surface-300)] bg-[var(--p-surface-0)] text-[var(--p-surface-500)]">
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

                    <Column field="displayId" header="ID Paciente" :showFilterMenu="false" style="width: 12rem;">
                        <template #filter="{ filterModel, filterCallback }">
                            <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Buscar ID" class="p-column-filter py-1 px-2 text-sm h-[36px] w-full" />
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
                                <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" />
                                <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeletePatient(slotProps.data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <Dialog v-model:visible="addDialogVisible" :style="{ width: '800px' }" header="Adicionar Paciente" :modal="true" class="p-fluid">
        <div class="grid grid-cols-12 gap-4 py-4">
            <PatientFormFields
                :patient="currentPatient"
                :submitted="submitted"
                :genders="genders"
                prefix="add"
            />
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeAddDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" @click="saveAddedPatient" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editDialogVisible" :style="{ width: '800px' }" header="Detalhes do Paciente" :modal="true" class="p-fluid">
        <div class="grid grid-cols-12 gap-4 py-4">
            <PatientFormFields
                :patient="currentPatient"
                :submitted="submitted"
                :genders="genders"
                prefix="edit"
            />
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeEditDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" @click="saveEditedPatient" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" :modal="true">
        <template #header>
            <div class="flex items-center gap-3">
                <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
                <span class="text-xl font-bold">Confirmar Exclusao</span>
            </div>
        </template>
        <div class="py-4">
            <span v-if="currentPatient">Voce tem certeza que quer deletar o paciente <b>{{ currentPatient.name }}</b>?</span>
        </div>
        <template #footer>
            <Button label="Nao" icon="pi pi-times" text @click="deleteDialogVisible = false" />
            <Button label="Sim" icon="pi pi-check" severity="danger" :loading="saving" @click="executeDelete" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import type { PropType } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import AppLayout from '../components/AppLayout.vue';
import { getPatientServiceErrorMessage, PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';

interface Patient {
    id: number | null;
    displayId: string;
    status: string;
    name: string;
    birthDate: string;
    age: number | null;
    gender: string;
    responsibleName: string;
    cpf: string;
    address: string;
    addressNumber: string;
    zipCode: string;
    homePhone: string;
    mobilePhone: string;
    profession: string;
    workMobilePhone: string;
    email: string;
}

const PatientFormFields = defineComponent({
    props: {
        patient: {
            type: Object as PropType<Patient>,
            required: true
        },
        submitted: {
            type: Boolean,
            required: true
        },
        genders: {
            type: Array as PropType<string[]>,
            required: true
        },
        prefix: {
            type: String,
            required: true
        }
    },
    setup(props) {
        const required = computed(() => ({
            name: props.submitted && !props.patient.name,
            cpf: props.submitted && !props.patient.cpf,
            birthDate: props.submitted && !props.patient.birthDate,
            gender: props.submitted && !props.patient.gender,
            responsibleName: props.submitted && !props.patient.responsibleName,
            address: props.submitted && !props.patient.address,
            addressNumber: props.submitted && !props.patient.addressNumber,
            email: props.submitted && !props.patient.email
        }));

        const field = (id: string, label: string, child: ReturnType<typeof h>, error?: string) => h('div', { class: 'col-span-12 md:col-span-4' }, [
            h('label', { for: `${props.prefix}-${id}`, class: 'block font-bold mb-2' }, label),
            child,
            error ? h('small', { class: 'text-red-500' }, error) : null
        ]);

        return () => [
            h('div', { class: 'col-span-12 md:col-span-8' }, [
                h('label', { for: `${props.prefix}-name`, class: 'block font-bold mb-2' }, 'Nome Completo'),
                h(InputText, {
                    id: `${props.prefix}-name`,
                    modelValue: props.patient.name,
                    'onUpdate:modelValue': (value: string) => props.patient.name = value,
                    invalid: required.value.name,
                    autofocus: true,
                    class: 'w-full'
                }),
                required.value.name ? h('small', { class: 'text-red-500' }, 'O nome e obrigatorio.') : null
            ]),
            field('cpf', 'CPF', h(InputText, {
                id: `${props.prefix}-cpf`,
                modelValue: props.patient.cpf,
                'onUpdate:modelValue': (value: string) => props.patient.cpf = value,
                placeholder: '000.000.000-00',
                invalid: required.value.cpf,
                class: 'w-full'
            }), required.value.cpf ? 'O CPF e obrigatorio.' : ''),
            field('birth', 'Data de Nascimento', h(InputText, {
                id: `${props.prefix}-birth`,
                type: 'date',
                modelValue: props.patient.birthDate,
                'onUpdate:modelValue': (value: string) => props.patient.birthDate = value,
                invalid: required.value.birthDate,
                class: 'w-full'
            }), required.value.birthDate ? 'A data de nascimento e obrigatoria.' : ''),
            field('gender', 'Sexo', h(Select, {
                id: `${props.prefix}-gender`,
                modelValue: props.patient.gender,
                'onUpdate:modelValue': (value: string) => props.patient.gender = value,
                options: props.genders,
                placeholder: 'Selecione',
                invalid: required.value.gender,
                class: 'w-full'
            }), required.value.gender ? 'O sexo e obrigatorio.' : ''),
            h('div', { class: 'col-span-12' }, [
                h('label', { for: `${props.prefix}-responsible`, class: 'block font-bold mb-2' }, 'Nome do Responsavel'),
                h(InputText, {
                    id: `${props.prefix}-responsible`,
                    modelValue: props.patient.responsibleName,
                    'onUpdate:modelValue': (value: string) => props.patient.responsibleName = value,
                    invalid: required.value.responsibleName,
                    class: 'w-full'
                }),
                required.value.responsibleName ? h('small', { class: 'text-red-500' }, 'O responsavel e obrigatorio para o cadastro no backend.') : null
            ]),
            field('zip', 'CEP', h(InputText, {
                id: `${props.prefix}-zip`,
                modelValue: props.patient.zipCode,
                'onUpdate:modelValue': (value: string) => props.patient.zipCode = value,
                placeholder: '00000-000',
                class: 'w-full'
            })),
            h('div', { class: 'col-span-12 md:col-span-6' }, [
                h('label', { for: `${props.prefix}-address`, class: 'block font-bold mb-2' }, 'Endereco Completo'),
                h(InputText, {
                    id: `${props.prefix}-address`,
                    modelValue: props.patient.address,
                    'onUpdate:modelValue': (value: string) => props.patient.address = value,
                    invalid: required.value.address,
                    class: 'w-full'
                }),
                required.value.address ? h('small', { class: 'text-red-500' }, 'O endereco e obrigatorio.') : null
            ]),
            field('address-number', 'Numero', h(InputText, {
                id: `${props.prefix}-address-number`,
                modelValue: props.patient.addressNumber,
                'onUpdate:modelValue': (value: string) => props.patient.addressNumber = value,
                invalid: required.value.addressNumber,
                class: 'w-full'
            }), required.value.addressNumber ? 'O numero e obrigatorio.' : ''),
            field('home-phone', 'Telefone Residencial', h(InputText, {
                id: `${props.prefix}-home-phone`,
                modelValue: props.patient.homePhone,
                'onUpdate:modelValue': (value: string) => props.patient.homePhone = value,
                placeholder: '(00) 0000-0000',
                class: 'w-full'
            })),
            field('mobile-phone', 'Celular Pessoal', h(InputText, {
                id: `${props.prefix}-mobile-phone`,
                modelValue: props.patient.mobilePhone,
                'onUpdate:modelValue': (value: string) => props.patient.mobilePhone = value,
                placeholder: '(00) 90000-0000',
                class: 'w-full'
            })),
            field('work-phone', 'Celular Comercial', h(InputText, {
                id: `${props.prefix}-work-phone`,
                modelValue: props.patient.workMobilePhone,
                'onUpdate:modelValue': (value: string) => props.patient.workMobilePhone = value,
                placeholder: '(00) 90000-0000',
                class: 'w-full'
            })),
            h('div', { class: 'col-span-12 md:col-span-6' }, [
                h('label', { for: `${props.prefix}-email`, class: 'block font-bold mb-2' }, 'E-mail'),
                h(InputText, {
                    id: `${props.prefix}-email`,
                    type: 'email',
                    modelValue: props.patient.email,
                    'onUpdate:modelValue': (value: string) => props.patient.email = value,
                    placeholder: 'paciente@exemplo.com',
                    invalid: required.value.email,
                    class: 'w-full'
                }),
                required.value.email ? h('small', { class: 'text-red-500' }, 'O e-mail e obrigatorio.') : null
            ]),
            h('div', { class: 'col-span-12 md:col-span-6' }, [
                h('label', { for: `${props.prefix}-profession`, class: 'block font-bold mb-2' }, 'Profissao'),
                h(InputText, {
                    id: `${props.prefix}-profession`,
                    modelValue: props.patient.profession,
                    'onUpdate:modelValue': (value: string) => props.patient.profession = value,
                    class: 'w-full'
                })
            ])
        ];
    }
});

const genders = ref(['Masculino', 'Feminino', 'Outro']);
const toast = useToast();
const patients = ref<Patient[]>([]);
const loading = ref(false);
const saving = ref(false);
const selectedPatient = ref<Patient | null>(null);
const metaKey = ref(true);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);
const currentPatient = ref<Patient>(getEmptyPatient());

const patientFilters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: 'Ativo', matchMode: FilterMatchMode.EQUALS },
    displayId: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    cpf: { value: null, matchMode: FilterMatchMode.CONTAINS },
    mobilePhone: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

function getEmptyPatient(): Patient {
    return {
        id: null,
        displayId: '',
        status: 'Ativo',
        name: '',
        birthDate: '',
        age: null,
        gender: '',
        responsibleName: '',
        cpf: '',
        address: '',
        addressNumber: '',
        zipCode: '',
        homePhone: '',
        mobilePhone: '',
        profession: '',
        workMobilePhone: '',
        email: ''
    };
}

const formatDisplayId = (id?: number | null) => id ? `#${id.toString().padStart(7, '0')}` : '';
const onlyDigits = (value: string) => value.replace(/\D/g, '');

const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;

    const today = new Date();
    const birth = new Date(`${birthDate}T00:00:00`);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }

    return age;
};

const toViewPatient = (patient: ApiPatient, fallback?: Patient): Patient => ({
    id: patient.id ?? fallback?.id ?? null,
    displayId: formatDisplayId(patient.id ?? fallback?.id),
    status: 'Ativo',
    name: patient.name ?? fallback?.name ?? '',
    birthDate: patient.birthday ?? fallback?.birthDate ?? '',
    age: patient.age ?? fallback?.age ?? null,
    gender: patient.sex ?? fallback?.gender ?? '',
    responsibleName: patient.responsible ?? fallback?.responsibleName ?? '',
    cpf: patient.document ?? fallback?.cpf ?? '',
    address: patient.address ?? fallback?.address ?? '',
    addressNumber: patient.addressesNumber ?? fallback?.addressNumber ?? '',
    zipCode: fallback?.zipCode ?? '',
    homePhone: patient.homePhoneNumber ?? fallback?.homePhone ?? '',
    mobilePhone: patient.phoneNumber ?? fallback?.mobilePhone ?? '',
    profession: patient.occupation ?? fallback?.profession ?? '',
    workMobilePhone: patient.commercialPhoneNumber ?? fallback?.workMobilePhone ?? '',
    email: patient.email ?? fallback?.email ?? ''
});

const toApiPatient = (patient: Patient): ApiPatient => ({
    id: patient.id,
    name: patient.name,
    email: patient.email,
    birthday: patient.birthDate,
    age: patient.age ?? calculateAge(patient.birthDate),
    sex: patient.gender,
    responsible: patient.responsibleName,
    document: onlyDigits(patient.cpf),
    address: patient.address,
    addressesNumber: patient.addressNumber,
    homePhoneNumber: patient.homePhone || null,
    commercialPhoneNumber: patient.workMobilePhone || null,
    phoneNumber: patient.mobilePhone || null,
    occupation: patient.profession || null
});

const isPatientValid = (patient: Patient) => {
    return !!(
        patient.name?.trim() &&
        patient.email?.trim() &&
        patient.birthDate &&
        patient.gender &&
        patient.responsibleName?.trim() &&
        patient.cpf?.trim() &&
        patient.address?.trim() &&
        patient.addressNumber?.trim()
    );
};

const showError = (detail: string) => {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
};

const loadPatients = async () => {
    loading.value = true;

    try {
        const data = await PatientService.list();
        patients.value = data.map(patient => toViewPatient(patient));
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        loading.value = false;
    }
};

const openAddDialog = () => {
    currentPatient.value = getEmptyPatient();
    submitted.value = false;
    addDialogVisible.value = true;
};

const closeAddDialog = () => {
    addDialogVisible.value = false;
    submitted.value = false;
};

const saveAddedPatient = async () => {
    submitted.value = true;

    if (!isPatientValid(currentPatient.value)) return;

    saving.value = true;

    try {
        const savedPatient = await PatientService.register(toApiPatient(currentPatient.value));
        patients.value.unshift(toViewPatient(savedPatient, currentPatient.value));
        addDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
        toast.add({ severity: 'success', summary: 'Paciente salvo', detail: 'Cadastro realizado com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const openEditDialog = (patient: Patient) => {
    currentPatient.value = { ...patient };
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    submitted.value = false;
};

const saveEditedPatient = async () => {
    submitted.value = true;

    if (!isPatientValid(currentPatient.value)) return;

    saving.value = true;

    try {
        const savedPatient = await PatientService.edit(toApiPatient(currentPatient.value));
        const index = patients.value.findIndex(p => p.id === savedPatient.id);

        if (index !== -1) {
            patients.value[index] = toViewPatient(savedPatient, currentPatient.value);
        }

        editDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
        toast.add({ severity: 'success', summary: 'Paciente atualizado', detail: 'Alteracoes salvas com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const confirmDeletePatient = (patient: Patient) => {
    currentPatient.value = { ...patient };
    deleteDialogVisible.value = true;
};

const executeDelete = async () => {
    if (!currentPatient.value.id) return;

    saving.value = true;

    try {
        await PatientService.delete(currentPatient.value.id);
        patients.value = patients.value.filter(patient => patient.id !== currentPatient.value.id);
        deleteDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
        toast.add({ severity: 'success', summary: 'Paciente excluido', detail: 'Registro removido com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const rowClass = (data: Patient) => {
    return [{ 'inactive-row opacity-60 grayscale-[0.5] bg-[var(--p-surface-50)]/50': data.status === 'Inativo' }];
};

onMounted(loadPatients);
</script>
