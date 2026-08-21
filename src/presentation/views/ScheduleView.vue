<template>
    <AppLayout title="Agenda">
        <div class="schedule-page bg-[var(--p-surface-0)] rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 border border-[var(--p-surface-200)]">
            <div class="schedule-overview flex flex-col gap-3 p-5 border-b border-[var(--p-surface-200)] lg:flex-row lg:items-center lg:justify-between">
                <div class="flex flex-wrap items-center gap-3">
                    <span
                        v-for="status in statusOptions"
                        :key="status"
                        class="schedule-status-summary"
                    >
                        <span class="schedule-status-dot" :style="getStatusDotStyle(status)" />
                        {{ status }}
                        <strong class="schedule-status-count">{{ countAppointmentsByStatus(status) }}</strong>
                    </span>
                </div>

                <Button
                    icon="pi pi-plus"
                    label="Adicionar atendimento"
                    class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-4 !py-2 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center justify-center !rounded-lg shadow-md"
                    @click="openAddDialog"
                />
            </div>

            <div class="schedule-calendar-wrapper flex-1 min-h-0 p-4">
                <FullCalendar :options="calendarOptions">
                    <template #eventContent="slotProps">
                        <div class="schedule-event-content">
                            <span class="schedule-event-marker" :style="getStatusDotStyle(slotProps.event.extendedProps.status)" />
                            <div class="schedule-event-details">
                                <span class="schedule-event-time">{{ slotProps.timeText }} {{ slotProps.event.extendedProps.status }}</span>
                                <strong>{{ slotProps.event.title }}</strong>
                            </div>
                        </div>
                    </template>
                </FullCalendar>
            </div>
        </div>
    </AppLayout>

    <ContextMenu ref="cm" :model="menuItems" class="!rounded-xl !shadow-lg !border-[var(--p-surface-100)]" />

    <Dialog v-model:visible="appointmentDialogVisible" :style="{ width: '980px' }" :header="appointmentDialogTitle" :modal="true" class="app-dialog p-fluid">
        <div class="app-dialog-body app-dialog-section">
            <Accordion value="0" class="quotation-general-accordion">
                <AccordionPanel value="0">
                    <AccordionHeader>Informações Gerais</AccordionHeader>
                    <AccordionContent>
                        <div class="grid grid-cols-12 gap-4 pt-2">
                            <div class="app-field col-span-12 md:col-span-4">
                                <label for="appointment-cpf" class="app-field-label">CPF</label>
                                <InputMask
                                    id="appointment-cpf"
                                    v-model="currentAppointment.patientCpf"
                                    mask="999.999.999-99"
                                    placeholder="000.000.000-00"
                                    class="w-full"
                                    @update:modelValue="onPatientCpfInput"
                                />
                            </div>

                            <div class="app-field col-span-12 md:col-span-8">
                                <label for="appointment-patient" class="app-field-label">Nome paciente<span class="app-required-mark">*</span></label>
                                <AutoComplete
                                    id="appointment-patient"
                                    v-model="selectedPatient"
                                    :suggestions="patientSuggestions"
                                    optionLabel="name"
                                    placeholder="Buscar paciente cadastrado"
                                    dropdown
                                    completeOnFocus
                                    fluid
                                    :virtualScrollerOptions="patientVirtualScrollerOptions"
                                    :invalid="submitted && !currentAppointment.patientName"
                                    @complete="searchPatients"
                                    @change="syncPatientName"
                                    @item-select="selectPatientFromSearch"
                                />
                                <small v-if="submitted && !currentAppointment.patientName" class="app-field-error">O nome do paciente é obrigatório.</small>
                            </div>

                            <div class="app-field col-span-12 md:col-span-4">
                                <label for="appointment-start" class="app-field-label">Horário início<span class="app-required-mark">*</span></label>
                                <InputText
                                    id="appointment-start"
                                    v-model="currentAppointment.start"
                                    type="datetime-local"
                                    :invalid="submitted && !currentAppointment.start"
                                    class="w-full"
                                />
                                <small v-if="submitted && !currentAppointment.start" class="app-field-error">O horário de início é obrigatório.</small>
                            </div>

                            <div class="app-field col-span-12 md:col-span-4">
                                <label for="appointment-end" class="app-field-label">Horário fim<span class="app-required-mark">*</span></label>
                                <InputText
                                    id="appointment-end"
                                    v-model="currentAppointment.end"
                                    type="datetime-local"
                                    :invalid="submitted && (!currentAppointment.end || !hasValidAppointmentRange)"
                                    class="w-full"
                                />
                                <small v-if="submitted && !currentAppointment.end" class="app-field-error">O horário de fim é obrigatório.</small>
                                <small v-else-if="submitted && !hasValidAppointmentRange" class="app-field-error">O fim deve ser posterior ao início.</small>
                            </div>

                            <div class="app-field col-span-12 md:col-span-4">
                                <label for="appointment-status" class="app-field-label">Status<span class="app-required-mark">*</span></label>
                                <Select
                                    id="appointment-status"
                                    v-model="currentAppointment.status"
                                    :options="statusOptions"
                                    :invalid="submitted && !currentAppointment.status"
                                    class="w-full"
                                />
                                <small v-if="submitted && !currentAppointment.status" class="app-field-error">O status é obrigatório.</small>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>

            <section class="quotation-procedures-section">
                <div class="quotation-procedures-header">
                    <div>
                        <h3 class="text-lg font-bold text-[var(--p-surface-700)] m-0">Procedimentos do Atendimento</h3>
                        <p class="text-sm text-[var(--p-surface-500)] m-0 mt-1">Adicione os procedimentos vinculados a este atendimento.</p>
                    </div>

                    <Button
                        icon="pi pi-plus"
                        label="Adicionar Procedimento"
                        size="small"
                        outlined
                        @click="addProcedureRow"
                    />
                </div>

                <DataTable
                    v-if="currentAppointment.procedures.length"
                    :value="currentAppointment.procedures"
                    class="quotation-procedures-table"
                    dataKey="rowKey"
                    responsiveLayout="scroll"
                >
                    <Column field="procedureIdText" header="ID Procedimento" style="width: 11rem">
                        <template #body="{ data }">
                            <InputText
                                :modelValue="data.procedureIdText"
                                placeholder="#0000000"
                                class="w-full"
                                @update:modelValue="syncProcedureIdInput(data, $event)"
                            />
                        </template>
                    </Column>

                    <Column field="description" header="Descricao" style="min-width: 18rem">
                        <template #body="{ data }">
                            <AutoComplete
                                :modelValue="data.description"
                                :suggestions="procedureDescriptionSuggestions"
                                optionLabel="description"
                                placeholder="Buscar procedimento"
                                dropdown
                                completeOnFocus
                                fluid
                                :virtualScrollerOptions="procedureVirtualScrollerOptions"
                                @complete="searchProcedureDescriptions"
                                @update:modelValue="syncProcedureDescriptionInput(data, $event)"
                                @item-select="applyProcedureToRow(data, $event.value)"
                            />
                        </template>
                    </Column>

                    <Column field="value" header="Valor" style="width: 10rem">
                        <template #body="{ data }">
                            <span class="quotation-procedure-readonly-field">{{ data.procedureId ? formatCurrency(data.value) : '' }}</span>
                        </template>
                    </Column>

                    <Column field="classification" header="Classificacao" style="width: 12rem">
                        <template #body="{ data }">
                            <span class="quotation-procedure-readonly-field">{{ data.classification }}</span>
                        </template>
                    </Column>

                    <Column :exportable="false" style="width: 5rem">
                        <template #body="{ data }">
                            <div class="quotation-procedure-action">
                                <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="removeProcedureRow(data)" />
                            </div>
                        </template>
                    </Column>
                </DataTable>

                <div v-else class="quotation-procedures-empty">
                    <i class="pi pi-list text-2xl text-[var(--p-surface-400)]" />
                    <span>Nenhum procedimento adicionado a este atendimento.</span>
                    <small v-if="submitted" class="app-field-error">Adicione pelo menos um procedimento ao atendimento.</small>
                </div>
            </section>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="closeAppointmentDialog" />
            <Button label="Salvar" icon="pi pi-check" @click="saveAppointment" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, DateSelectInfo, EventClickInfo, EventDropInfo, EventInput, EventResizeDoneInfo } from '@fullcalendar/vue3';
import classicThemePlugin from '@fullcalendar/vue3/themes/classic';
import dayGridPlugin from '@fullcalendar/vue3/daygrid';
import timeGridPlugin from '@fullcalendar/vue3/timegrid';
import interactionPlugin from '@fullcalendar/vue3/interaction';
import listPlugin from '@fullcalendar/vue3/list';
import ptBrLocale from '@fullcalendar/vue3/locales/pt-br';
import '@fullcalendar/vue3/skeleton.css';
import '@fullcalendar/vue3/themes/classic/theme.css';
import '@fullcalendar/vue3/themes/classic/palette.css';
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
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { getPatientServiceErrorMessage, PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';
import { getProcedureServiceErrorMessage, ProcedureService } from '../../infrastructure/services/ProcedureService';
import type { ApiProcedure } from '../../infrastructure/services/ProcedureService';
import AppLayout from '../components/AppLayout.vue';

type AppointmentStatus = 'Pendente' | 'Confirmado';
type DialogMode = 'add' | 'edit';

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

interface AppointmentProcedure {
    rowKey: string;
    procedureId: number | null;
    procedureIdText: string;
    description: string;
    value: number;
    classification: string;
}

interface Appointment {
    id: string;
    code: string;
    status: AppointmentStatus;
    start: string;
    end: string;
    patientId: number | null;
    patientName: string;
    patientCpf: string;
    procedures: AppointmentProcedure[];
}

interface AutocompleteCompleteEvent {
    query: string;
}

interface AutocompleteChangeEvent<T> {
    value: T | string | null;
}

interface AutocompleteSelectEvent<T> {
    value: T;
}

interface ScheduleMenuItem {
    label: string;
    icon: string;
    class?: string;
    command: () => void;
}

const statusOptions: AppointmentStatus[] = ['Pendente', 'Confirmado'];
const toast = useToast();
const appointments = ref<Appointment[]>([
    {
        id: 'appointment-1',
        code: '#0000001',
        status: 'Confirmado',
        start: '2026-08-18T09:00',
        end: '2026-08-18T10:00',
        patientId: null,
        patientName: 'Maria Santos Souza',
        patientCpf: '555.666.777-88',
        procedures: [
            {
                rowKey: 'appointment-1-item-1',
                procedureId: 1,
                procedureIdText: '#0000001',
                description: 'Limpeza Simples',
                value: 150,
                classification: 'Preventivo'
            }
        ]
    },
    {
        id: 'appointment-2',
        code: '#0000002',
        status: 'Pendente',
        start: '2026-08-18T14:30',
        end: '2026-08-18T15:30',
        patientId: null,
        patientName: 'João Silva Oliveira',
        patientCpf: '111.222.333-44',
        procedures: [
            {
                rowKey: 'appointment-2-item-1',
                procedureId: 2,
                procedureIdText: '#0000002',
                description: 'Clareamento Dental',
                value: 900,
                classification: 'Estetico'
            }
        ]
    }
]);
const registeredPatients = ref<PatientOption[]>([]);
const patientSuggestions = ref<PatientOption[]>([]);
const selectedPatient = ref<PatientOption | string | null>(null);
const registeredProcedures = ref<ProcedureOption[]>([]);
const procedureDescriptionSuggestions = ref<ProcedureOption[]>([]);
const appointmentDialogVisible = ref(false);
const dialogMode = ref<DialogMode>('add');
const submitted = ref(false);
const currentAppointment = ref<Appointment>(getEmptyAppointment());
const contextMenuSelection = ref<Appointment | null>(null);
const cm = ref();
const menuItems = ref<ScheduleMenuItem[]>([
    {
        label: 'Confirmar atendimento',
        icon: 'pi pi-check',
        command: () => updateSelectedAppointmentStatus('Confirmado')
    },
    {
        label: 'Marcar como pendente',
        icon: 'pi pi-clock',
        command: () => updateSelectedAppointmentStatus('Pendente')
    }
]);
const patientVirtualScrollerOptions = { itemSize: 44 };
const procedureVirtualScrollerOptions = { itemSize: 44 };

const appointmentDialogTitle = computed(() => dialogMode.value === 'add' ? 'Adicionar Atendimento' : 'Detalhes do Atendimento');

const hasValidAppointmentRange = computed(() => {
    if (!currentAppointment.value.start || !currentAppointment.value.end) return false;
    return new Date(currentAppointment.value.end).getTime() > new Date(currentAppointment.value.start).getTime();
});

const calendarEvents = computed<EventInput[]>(() => appointments.value.map(appointment => ({
    id: appointment.id,
    title: appointment.patientName,
    start: appointment.start,
    end: appointment.end,
    editable: true,
    classNames: [`schedule-event-${appointment.status.toLowerCase()}`],
    extendedProps: {
        code: appointment.code,
        status: appointment.status
    }
})));

const calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [classicThemePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    locale: ptBrLocale,
    initialView: 'timeGridWeek',
    height: '100%',
    selectable: true,
    editable: true,
    nowIndicator: true,
    allDaySlot: false,
    eventBeforeClass: 'schedule-event-native-marker',
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    slotDuration: '00:30:00',
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    buttonText: {
        today: 'Hoje',
        month: 'Mês',
        week: 'Semana',
        day: 'Dia',
        list: 'Lista semanal'
    },
    noEventsText: 'Nenhum atendimento agendado.',
    events: calendarEvents.value,
    eventDidMount: bindAppointmentContextMenu,
    select: openDialogFromCalendarSelection,
    eventClick: openDialogFromCalendarEvent,
    eventDrop: updateAppointmentFromCalendarMove,
    eventResize: updateAppointmentFromCalendarResize
}));

function getEmptyAppointment(): Appointment {
    return {
        id: '',
        code: '',
        status: 'Pendente',
        start: '',
        end: '',
        patientId: null,
        patientName: '',
        patientCpf: '',
        procedures: []
    };
}

const cloneAppointment = (appointment: Appointment): Appointment => JSON.parse(JSON.stringify(appointment)) as Appointment;

const normalizeDigits = (value?: string | number | null) => String(value ?? '').replace(/\D/g, '');

const formatCpf = (value?: string | null) => {
    const digits = normalizeDigits(value);
    if (digits.length !== 11) return value ?? '';
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatDisplayId = (id?: number | null) => id ? `#${id.toString().padStart(7, '0')}` : '';

const dateToInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);

const getNextAppointmentCode = () => {
    const maxCode = appointments.value.reduce((max, appointment) => {
        const number = Number(normalizeDigits(appointment.code));
        return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0);

    return `#${String(maxCode + 1).padStart(7, '0')}`;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const getAppointmentStatus = (status: unknown): AppointmentStatus => {
    return statusOptions.includes(status as AppointmentStatus) ? status as AppointmentStatus : 'Pendente';
};

const getStatusDotStyle = (status: AppointmentStatus | string) => {
    const normalizedStatus = getAppointmentStatus(status);

    switch (normalizedStatus) {
        case 'Confirmado': return 'background-color: var(--p-primary-1000);';
        case 'Pendente':
        default:
            return 'background-color: var(--p-primary-25);';
    }
};

const countAppointmentsByStatus = (status: AppointmentStatus) => appointments.value.filter(appointment => appointment.status === status).length;

const showError = (detail: string) => {
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 5000 });
};

const toPatientOption = (patient: ApiPatient): PatientOption => ({
    id: patient.id ?? null,
    name: patient.name ?? '',
    cpf: formatCpf(patient.document)
});

const toProcedureOption = (procedure: ApiProcedure): ProcedureOption => ({
    id: procedure.id ?? null,
    displayId: formatDisplayId(procedure.id),
    description: procedure.name ?? '',
    value: procedure.value ?? 0,
    classification: procedure.type ?? ''
});

const loadPatients = async () => {
    try {
        const patients = await PatientService.list();
        registeredPatients.value = patients
            .filter(patient => patient.statusCode !== 1)
            .map(toPatientOption)
            .filter(patient => patient.name);
        patientSuggestions.value = registeredPatients.value;
    } catch (error: unknown) {
        showError(getPatientServiceErrorMessage(error));
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
        showError(getProcedureServiceErrorMessage(error));
    }
};

const searchPatients = (event: AutocompleteCompleteEvent) => {
    const query = event.query?.trim().toLowerCase() ?? '';
    const queryDigits = normalizeDigits(query);

    patientSuggestions.value = registeredPatients.value.filter(patient => {
        const patientName = patient.name.toLowerCase();
        const patientCpf = normalizeDigits(patient.cpf);

        return !query || patientName.includes(query) || (queryDigits && patientCpf.includes(queryDigits));
    });
};

const applyPatientToAppointment = (patient: PatientOption) => {
    currentAppointment.value.patientId = patient.id;
    currentAppointment.value.patientName = patient.name;
    currentAppointment.value.patientCpf = patient.cpf;
    selectedPatient.value = patient;
};

const clearPatientFields = () => {
    currentAppointment.value.patientId = null;
    currentAppointment.value.patientName = '';
    currentAppointment.value.patientCpf = '';
    selectedPatient.value = null;
};

const findPatientByCpf = (cpf: string) => {
    const digits = normalizeDigits(cpf);
    if (digits.length !== 11) return;

    const patient = registeredPatients.value.find(item => normalizeDigits(item.cpf) === digits);
    if (patient) {
        applyPatientToAppointment(patient);
    }
};

const onPatientCpfInput = (value: string | null | undefined) => {
    const nextValue = value ?? '';
    currentAppointment.value.patientCpf = nextValue;

    if (!normalizeDigits(nextValue)) {
        clearPatientFields();
        return;
    }

    findPatientByCpf(nextValue);
};

const selectPatientFromSearch = (event: AutocompleteSelectEvent<PatientOption>) => {
    applyPatientToAppointment(event.value);
};

const syncPatientName = (event: AutocompleteChangeEvent<PatientOption>) => {
    if (typeof event.value === 'string') {
        if (!event.value.trim()) {
            clearPatientFields();
            return;
        }

        currentAppointment.value.patientId = null;
        currentAppointment.value.patientName = event.value;
        selectedPatient.value = event.value;
        return;
    }

    if (event.value) {
        applyPatientToAppointment(event.value);
        return;
    }

    currentAppointment.value.patientId = null;
    currentAppointment.value.patientName = '';
    currentAppointment.value.patientCpf = '';
    selectedPatient.value = null;
};

const syncSelectedPatient = () => {
    const selected = registeredPatients.value.find(patient => normalizeDigits(patient.cpf) === normalizeDigits(currentAppointment.value.patientCpf))
        ?? registeredPatients.value.find(patient => patient.id === currentAppointment.value.patientId);

    if (selected && !currentAppointment.value.patientCpf) {
        currentAppointment.value.patientCpf = selected.cpf;
    }

    selectedPatient.value = selected ?? currentAppointment.value.patientName;
};

const getStatusMenuLabel = (status: AppointmentStatus) => {
    switch (status) {
        case 'Confirmado': return 'Confirmar atendimento';
        case 'Pendente':
        default:
            return 'Marcar como pendente';
    }
};

const getStatusMenuIcon = (status: AppointmentStatus) => {
    switch (status) {
        case 'Confirmado': return 'pi pi-check';
        case 'Pendente':
        default:
            return 'pi pi-clock';
    }
};

const updateSelectedAppointmentStatus = (status: AppointmentStatus) => {
    if (!contextMenuSelection.value) return;

    const index = appointments.value.findIndex(appointment => appointment.id === contextMenuSelection.value?.id);
    if (index === -1 || !appointments.value[index]) return;

    appointments.value[index].status = status;

    if (currentAppointment.value.id === appointments.value[index].id) {
        currentAppointment.value.status = status;
    }

    toast.add({ severity: 'success', summary: 'Status atualizado', detail: 'Atendimento atualizado com sucesso.', life: 2500 });
    contextMenuSelection.value = null;
};

const deleteSelectedAppointment = () => {
    if (!contextMenuSelection.value) return;

    const selectedId = contextMenuSelection.value.id;
    appointments.value = appointments.value.filter(appointment => appointment.id !== selectedId);

    if (currentAppointment.value.id === selectedId) {
        closeAppointmentDialog();
    }

    toast.add({ severity: 'success', summary: 'Atendimento excluído', detail: 'Registro removido da agenda.', life: 2500 });
    contextMenuSelection.value = null;
};

const openAppointmentContextMenu = (mouseEvent: MouseEvent, appointmentId: string) => {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

    const appointment = appointments.value.find(item => item.id === appointmentId);
    if (!appointment) return;

    contextMenuSelection.value = appointment;
    const statusMenuItems = statusOptions
        .filter(status => status !== appointment.status)
        .map(status => ({
            label: getStatusMenuLabel(status),
            icon: getStatusMenuIcon(status),
            command: () => updateSelectedAppointmentStatus(status)
        }));

    menuItems.value = [
        ...statusMenuItems,
        {
            label: 'Excluir atendimento',
            icon: 'pi pi-trash',
            class: 'text-[var(--p-primary-1010)]',
            command: () => deleteSelectedAppointment()
        }
    ];

    cm.value?.show(mouseEvent);
};

const bindAppointmentContextMenu = (info: { el: HTMLElement; event: { id: string } }) => {
    info.el.oncontextmenu = (event: MouseEvent) => openAppointmentContextMenu(event, info.event.id);
};

const searchProcedureDescriptions = (event: AutocompleteCompleteEvent) => {
    const query = event.query?.trim().toLowerCase() ?? '';
    const queryId = normalizeDigits(query);

    procedureDescriptionSuggestions.value = registeredProcedures.value.filter(procedure => {
        const procedureDescription = procedure.description.toLowerCase();
        const procedureId = normalizeDigits(procedure.displayId);

        return !query || procedureDescription.includes(query) || (queryId && procedureId.includes(queryId));
    });
};

const getEmptyAppointmentProcedure = (): AppointmentProcedure => ({
    rowKey: `appointment-procedure-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    procedureId: null,
    procedureIdText: '',
    description: '',
    value: 0,
    classification: ''
});

const addProcedureRow = () => {
    currentAppointment.value.procedures.push(getEmptyAppointmentProcedure());
};

const removeProcedureRow = (procedure: AppointmentProcedure) => {
    currentAppointment.value.procedures = currentAppointment.value.procedures.filter(item => item.rowKey !== procedure.rowKey);
};

const findProcedureById = (value: string) => {
    const digits = normalizeDigits(value);
    if (!digits) return null;

    return registeredProcedures.value.find(procedure => normalizeDigits(procedure.displayId) === digits || String(procedure.id ?? '') === digits) ?? null;
};

const findProcedureByDescription = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return null;

    return registeredProcedures.value.find(procedure => procedure.description.toLowerCase() === query) ?? null;
};

const applyProcedureToRow = (row: AppointmentProcedure, procedure: ProcedureOption) => {
    row.procedureId = procedure.id;
    row.procedureIdText = procedure.displayId;
    row.description = procedure.description;
    row.value = procedure.value;
    row.classification = procedure.classification;
};

const clearProcedureRow = (row: AppointmentProcedure) => {
    row.procedureId = null;
    row.procedureIdText = '';
    row.description = '';
    row.value = 0;
    row.classification = '';
};

const syncProcedureIdInput = (row: AppointmentProcedure, value: string | null | undefined) => {
    const nextValue = value ?? '';
    row.procedureIdText = nextValue;

    if (!normalizeDigits(nextValue)) {
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
};

const syncProcedureDescriptionInput = (row: AppointmentProcedure, value: ProcedureOption | string | null | undefined) => {
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
};

const resetAppointmentDialogState = () => {
    submitted.value = false;
    patientSuggestions.value = registeredPatients.value;
    procedureDescriptionSuggestions.value = registeredProcedures.value;
};

const openAddDialog = () => {
    dialogMode.value = 'add';
    currentAppointment.value = {
        ...getEmptyAppointment(),
        id: `appointment-${Date.now()}`,
        code: getNextAppointmentCode(),
        start: dateToInputValue(new Date()),
        end: dateToInputValue(addMinutes(new Date(), 60)),
        procedures: []
    };
    selectedPatient.value = null;
    resetAppointmentDialogState();
    appointmentDialogVisible.value = true;
};

const openDialogFromCalendarSelection = (selection: DateSelectInfo) => {
    dialogMode.value = 'add';
    currentAppointment.value = {
        ...getEmptyAppointment(),
        id: `appointment-${Date.now()}`,
        code: getNextAppointmentCode(),
        start: dateToInputValue(selection.start),
        end: dateToInputValue(selection.end || addMinutes(selection.start, 60)),
        procedures: []
    };
    selectedPatient.value = null;
    resetAppointmentDialogState();
    appointmentDialogVisible.value = true;
};

const openDialogFromCalendarEvent = (info: EventClickInfo) => {
    const appointment = appointments.value.find(item => item.id === info.event.id);
    if (!appointment) return;

    dialogMode.value = 'edit';
    currentAppointment.value = cloneAppointment(appointment);
    syncSelectedPatient();
    resetAppointmentDialogState();
    appointmentDialogVisible.value = true;
};

const closeAppointmentDialog = () => {
    appointmentDialogVisible.value = false;
    submitted.value = false;
    currentAppointment.value = getEmptyAppointment();
    selectedPatient.value = null;
};

const hasProcedureReadyToSave = (procedure: AppointmentProcedure) => {
    return !!procedure.description?.trim();
};

const isAppointmentValid = () => {
    return !!(
        currentAppointment.value.status &&
        currentAppointment.value.patientName?.trim() &&
        currentAppointment.value.start &&
        currentAppointment.value.end &&
        hasValidAppointmentRange.value &&
        currentAppointment.value.procedures.some(hasProcedureReadyToSave)
    );
};

const saveAppointment = () => {
    submitted.value = true;
    syncPatientName({ value: selectedPatient.value });

    if (!isAppointmentValid()) return;

    const appointmentToSave = cloneAppointment({
        ...currentAppointment.value,
        procedures: currentAppointment.value.procedures.filter(hasProcedureReadyToSave)
    });

    if (dialogMode.value === 'add') {
        appointments.value.unshift(appointmentToSave);
        toast.add({ severity: 'success', summary: 'Atendimento criado', detail: 'Atendimento adicionado à agenda.', life: 3000 });
    } else {
        const index = appointments.value.findIndex(appointment => appointment.id === appointmentToSave.id);
        if (index !== -1) {
            appointments.value.splice(index, 1, appointmentToSave);
            toast.add({ severity: 'success', summary: 'Atendimento atualizado', detail: 'Alterações salvas com sucesso.', life: 3000 });
        }
    }

    closeAppointmentDialog();
};

const updateAppointmentSchedule = (id: string, start: Date | null, end: Date | null) => {
    if (!start || !end) return;

    const appointment = appointments.value.find(item => item.id === id);
    if (!appointment) return;

    appointment.start = dateToInputValue(start);
    appointment.end = dateToInputValue(end);
    toast.add({ severity: 'success', summary: 'Agenda atualizada', detail: 'Horário do atendimento ajustado.', life: 2500 });
};

const updateAppointmentFromCalendarMove = (info: EventDropInfo) => {
    updateAppointmentSchedule(info.event.id, info.event.start, info.event.end);
};

const updateAppointmentFromCalendarResize = (info: EventResizeDoneInfo) => {
    updateAppointmentSchedule(info.event.id, info.event.start, info.event.end);
};

onMounted(() => {
    void loadPatients();
    void loadProcedures();
});
</script>
