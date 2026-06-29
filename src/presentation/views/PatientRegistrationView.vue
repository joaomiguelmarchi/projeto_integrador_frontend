<template>
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
                    v-model:contextMenuSelection="contextMenuSelection"
                    @rowContextmenu="onRowContextMenu"
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
                        <template #body="{ data }">
                            {{ formatCpf(data.cpf) }}
                        </template>
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
                                <Button icon="pi pi-bars" variant="outlined" rounded size="small" @click="openEditDialog(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                                <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="confirmDeletePatient(slotProps.data)" :disabled="slotProps.data.status === 'Inativo'" />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog v-model:visible="addDialogVisible" :style="{ width: '800px' }" header="Adicionar Paciente" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-form-grid">
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

    <Dialog v-model:visible="editDialogVisible" :style="{ width: '800px' }" header="Detalhes do Paciente" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-form-grid">
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

    <Dialog v-model:visible="deleteDialogVisible" :style="{ width: '450px' }" header="Confirmar Exclusão" :modal="true" class="app-dialog">
        <div class="app-confirm-body">
            <i class="pi pi-exclamation-triangle app-confirm-icon" />
            <div class="app-dialog-section">
                <span v-if="currentPatient">Você tem certeza que deseja inativar o paciente <b>{{ currentPatient.name }}</b>?</span>
            </div>
        </div>
        <template #footer>
            <Button label="Não" icon="pi pi-times" text @click="deleteDialogVisible = false" />
            <Button label="Sim" icon="pi pi-check" severity="danger" :loading="saving" @click="executeDelete" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import type { PropType } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import ContextMenu from 'primevue/contextmenu';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputMask from 'primevue/inputmask';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';
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

interface PatientValidationErrors {
    cpf: string;
    zipCode: string;
    email: string;
}

interface ViaCepResponse {
    cep?: string;
    logradouro?: string;
    erro?: boolean;
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
        const invalid = computed(() => ({
            cpf: required.value.cpf || !!patientValidationErrors.value.cpf,
            zipCode: !!patientValidationErrors.value.zipCode,
            email: required.value.email || !!patientValidationErrors.value.email
        }));

        const label = (id: string, text: string, required = false) => h('label', { for: `${props.prefix}-${id}`, class: 'app-field-label' }, [
            text,
            required ? h('span', { class: 'app-required-mark' }, '*') : null
        ]);

        const field = (id: string, text: string, child: ReturnType<typeof h>, error?: string, isRequired = false) => h('div', { class: 'app-field col-span-12 md:col-span-4' }, [
            label(id, text, isRequired),
            child,
            error ? h('small', { class: 'app-field-error' }, error) : null
        ]);

        return () => [
            h('div', { class: 'app-field col-span-12 md:col-span-8' }, [
                label('name', 'Nome Completo', true),
                h(InputText, {
                    id: `${props.prefix}-name`,
                    modelValue: props.patient.name,
                    'onUpdate:modelValue': (value: string) => props.patient.name = value,
                    invalid: required.value.name,
                    autofocus: true,
                    class: 'w-full'
                }),
                required.value.name ? h('small', { class: 'app-field-error' }, 'O nome é obrigatório.') : null
            ]),
            field('cpf', 'CPF', h(InputMask, {
                id: `${props.prefix}-cpf`,
                modelValue: props.patient.cpf,
                'onUpdate:modelValue': (value: string) => {
                    props.patient.cpf = value;
                    patientValidationErrors.value.cpf = '';
                },
                mask: '999.999.999-99',
                placeholder: '000.000.000-00',
                invalid: invalid.value.cpf,
                class: 'w-full'
            }), required.value.cpf ? 'O CPF é obrigatório.' : patientValidationErrors.value.cpf, true),
            field('birth', 'Data de Nascimento', h(InputText, {
                id: `${props.prefix}-birth`,
                type: 'date',
                modelValue: props.patient.birthDate,
                'onUpdate:modelValue': (value: string) => props.patient.birthDate = value,
                invalid: required.value.birthDate,
                class: 'w-full'
            }), required.value.birthDate ? 'A data de nascimento é obrigatória.' : '', true),
            field('gender', 'Sexo', h(Select, {
                id: `${props.prefix}-gender`,
                modelValue: props.patient.gender,
                'onUpdate:modelValue': (value: string) => props.patient.gender = value,
                options: props.genders,
                placeholder: 'Selecione',
                invalid: required.value.gender,
                class: 'w-full'
            }), required.value.gender ? 'O sexo é obrigatório.' : '', true),
            h('div', { class: 'app-field col-span-12' }, [
                label('responsible', 'Nome do Responsavel'),
                h(InputText, {
                    id: `${props.prefix}-responsible`,
                    modelValue: props.patient.responsibleName,
                    'onUpdate:modelValue': (value: string) => props.patient.responsibleName = value,
                    class: 'w-full'
                })
            ]),
            field('zip', 'CEP', h(InputMask, {
                id: `${props.prefix}-zip`,
                modelValue: props.patient.zipCode,
                'onUpdate:modelValue': (value: string) => {
                    props.patient.zipCode = value;
                    patientValidationErrors.value.zipCode = '';
                },
                onBlur: () => {
                    void validateAndFillZipCode(props.patient);
                },
                mask: '99999-999',
                placeholder: '00000-000',
                invalid: invalid.value.zipCode,
                class: 'w-full'
            }), patientValidationErrors.value.zipCode),
            h('div', { class: 'app-field col-span-12 md:col-span-6' }, [
                label('address', 'Endereço Completo', true),
                h(InputText, {
                    id: `${props.prefix}-address`,
                    modelValue: props.patient.address,
                    'onUpdate:modelValue': (value: string) => props.patient.address = value,
                    invalid: required.value.address,
                    class: 'w-full'
                }),
                required.value.address ? h('small', { class: 'app-field-error' }, 'O endereço é obrigatório.') : null
            ]),
            field('address-number', 'Número', h(InputText, {
                id: `${props.prefix}-address-number`,
                modelValue: props.patient.addressNumber,
                'onUpdate:modelValue': (value: string) => props.patient.addressNumber = value,
                invalid: required.value.addressNumber,
                class: 'w-full'
            }), required.value.addressNumber ? 'O número é obrigatório.' : '', true),
            field('home-phone', 'Telefone Residencial', h(InputMask, {
                id: `${props.prefix}-home-phone`,
                modelValue: props.patient.homePhone,
                'onUpdate:modelValue': (value: string) => props.patient.homePhone = value,
                mask: '(99) 9999-9999',
                placeholder: '(00) 0000-0000',
                class: 'w-full'
            })),
            field('mobile-phone', 'Celular Pessoal', h(InputMask, {
                id: `${props.prefix}-mobile-phone`,
                modelValue: props.patient.mobilePhone,
                'onUpdate:modelValue': (value: string) => props.patient.mobilePhone = value,
                mask: '(99) 99999-9999',
                placeholder: '(00) 90000-0000',
                class: 'w-full'
            })),
            field('work-phone', 'Celular Comercial', h(InputMask, {
                id: `${props.prefix}-work-phone`,
                modelValue: props.patient.workMobilePhone,
                'onUpdate:modelValue': (value: string) => props.patient.workMobilePhone = value,
                mask: '(99) 99999-9999',
                placeholder: '(00) 90000-0000',
                class: 'w-full'
            })),
            h('div', { class: 'app-field col-span-12 md:col-span-6' }, [
                label('email', 'E-mail', true),
                h(InputText, {
                    id: `${props.prefix}-email`,
                    type: 'email',
                    modelValue: props.patient.email,
                    'onUpdate:modelValue': (value: string) => {
                        props.patient.email = value;
                        patientValidationErrors.value.email = '';
                    },
                    placeholder: 'paciente@exemplo.com',
                    invalid: invalid.value.email,
                    class: 'w-full'
                }),
                required.value.email || patientValidationErrors.value.email
                    ? h('small', { class: 'app-field-error' }, required.value.email ? 'O e-mail é obrigatório.' : patientValidationErrors.value.email)
                    : null
            ]),
            h('div', { class: 'app-field col-span-12 md:col-span-6' }, [
                label('profession', 'Profissão'),
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
const contextMenuSelection = ref<Patient | null>(null);
const metaKey = ref(true);
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const submitted = ref(false);
const currentPatient = ref<Patient>(getEmptyPatient());
const patientValidationErrors = ref<PatientValidationErrors>({
    cpf: '',
    zipCode: '',
    email: ''
});
const cm = ref();

const menuItems = ref([
    {
        label: 'Reativar paciente',
        icon: 'pi pi-refresh',
        command: () => reactivatePatient()
    }
]);

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
const formatCpf = (value?: string | null) => {
    const digits = onlyDigits(value ?? '');
    if (digits.length !== 11) return value ?? '';

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};
const statusFromCode = (statusCode?: number | null) => statusCode === 1 ? 'Inativo' : 'Ativo';
const statusToCode = (status: string) => status === 'Inativo' ? 1 : 0;

const clearPatientValidationErrors = () => {
    patientValidationErrors.value = {
        cpf: '',
        zipCode: '',
        email: ''
    };
};

const isValidCpf = (value: string) => {
    const digits = onlyDigits(value);

    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    const calculateDigit = (base: string, factor: number) => {
        const total = base.split('').reduce((acc, digit) => {
            acc.sum += Number(digit) * acc.factor;
            acc.factor -= 1;
            return acc;
        }, { sum: 0, factor });
        const rest = (total.sum * 10) % 11;

        return rest === 10 ? 0 : rest;
    };

    const firstDigit = calculateDigit(digits.slice(0, 9), 10);
    const secondDigit = calculateDigit(digits.slice(0, 10), 11);

    return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]);
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

const validateAndFillZipCode = async (patient: Patient) => {
    const zipCode = onlyDigits(patient.zipCode);
    patientValidationErrors.value.zipCode = '';

    if (!zipCode) return true;

    if (zipCode.length !== 8) {
        patientValidationErrors.value.zipCode = 'O CEP deve conter 8 digitos.';
        return false;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
        if (!response.ok) throw new Error('CEP lookup failed.');

        const data = await response.json() as ViaCepResponse;
        if (data.erro) {
            patientValidationErrors.value.zipCode = 'CEP nao encontrado.';
            return false;
        }

        patient.zipCode = data.cep ?? patient.zipCode;
        if (data.logradouro) {
            patient.address = data.logradouro;
        }

        return true;
    } catch {
        patientValidationErrors.value.zipCode = 'Nao foi possivel validar o CEP.';
        return false;
    }
};

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
    status: patient.statusCode == null ? fallback?.status ?? 'Ativo' : statusFromCode(patient.statusCode),
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
    statusCode: statusToCode(patient.status),
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

const updatePatientInList = (patient: ApiPatient, fallback?: Patient) => {
    const index = patients.value.findIndex(p => p.id === patient.id);

    if (index !== -1) {
        patients.value[index] = toViewPatient(patient, fallback);
    }
};

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

const validatePatient = async (patient: Patient) => {
    clearPatientValidationErrors();

    if (patient.cpf?.trim() && !isValidCpf(patient.cpf)) {
        patientValidationErrors.value.cpf = 'O CPF informado e invalido.';
    }

    if (patient.email?.trim() && !isValidEmail(patient.email)) {
        patientValidationErrors.value.email = 'Informe um e-mail valido.';
    }

    const hasValidZipCode = await validateAndFillZipCode(patient);
    const hasRequiredFields = isPatientValid(patient);

    return hasRequiredFields &&
        !patientValidationErrors.value.cpf &&
        !patientValidationErrors.value.email &&
        hasValidZipCode;
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
    clearPatientValidationErrors();
    submitted.value = false;
    addDialogVisible.value = true;
};

const closeAddDialog = () => {
    addDialogVisible.value = false;
    clearPatientValidationErrors();
    submitted.value = false;
};

const saveAddedPatient = async () => {
    submitted.value = true;

    if (!(await validatePatient(currentPatient.value))) return;

    saving.value = true;

    try {
        const savedPatient = await PatientService.register(toApiPatient(currentPatient.value));
        patients.value.unshift(toViewPatient(savedPatient, currentPatient.value));
        addDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
        clearPatientValidationErrors();
        toast.add({ severity: 'success', summary: 'Paciente salvo', detail: 'Cadastro realizado com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const openEditDialog = (patient: Patient) => {
    currentPatient.value = { ...patient };
    clearPatientValidationErrors();
    submitted.value = false;
    editDialogVisible.value = true;
};

const closeEditDialog = () => {
    editDialogVisible.value = false;
    clearPatientValidationErrors();
    submitted.value = false;
};

const saveEditedPatient = async () => {
    submitted.value = true;

    if (!(await validatePatient(currentPatient.value))) return;

    saving.value = true;

    try {
        const savedPatient = await PatientService.edit(toApiPatient(currentPatient.value));
        updatePatientInList(savedPatient, currentPatient.value);

        editDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
        clearPatientValidationErrors();
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
        const inactivePatient = { ...currentPatient.value, status: 'Inativo' };
        const savedPatient = await PatientService.edit(toApiPatient(inactivePatient));
        updatePatientInList(savedPatient, inactivePatient);

        deleteDialogVisible.value = false;
        currentPatient.value = getEmptyPatient();
        toast.add({ severity: 'success', summary: 'Paciente inativado', detail: 'Registro atualizado com sucesso.', life: 3000 });
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
    } finally {
        saving.value = false;
    }
};

const onRowContextMenu = (event: any) => {
    if (contextMenuSelection.value?.status === 'Inativo') {
        cm.value.show(event.originalEvent);
    }
};

const reactivatePatient = async () => {
    if (!contextMenuSelection.value) return;

    saving.value = true;

    try {
        const activePatient = { ...contextMenuSelection.value, status: 'Ativo' };
        const savedPatient = await PatientService.edit(toApiPatient(activePatient));
        updatePatientInList(savedPatient, activePatient);
        contextMenuSelection.value = null;
        toast.add({ severity: 'success', summary: 'Paciente reativado', detail: 'Registro atualizado com sucesso.', life: 3000 });
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
