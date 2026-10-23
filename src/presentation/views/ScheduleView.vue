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
                    size="small"
                    class="!bg-[var(--p-primary-500)] hover:!bg-[var(--p-primary-600)] !border-none !px-3 !py-1.5 !font-semibold !text-[var(--p-surface-0)] transition-all h-9 flex items-center justify-center !rounded-lg shadow-md"
                    :disabled="saving || mutationPending"
                    @click="openAddDialog"
                />
            </div>

            <div class="px-5 pt-3 text-sm" aria-live="polite">
                <span v-if="loading || detailsLoading">Carregando agenda...</span>
                <span v-else-if="loadError" role="alert">{{ loadError }} <Button label="Tentar novamente" text @click="loadAppointments" /></span>
                <span v-else-if="!appointments.length">Nenhum atendimento neste período.</span>
                <span v-else>Atendimentos do período exibido.</span>
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

    <Dialog :draggable="false" v-model:visible="appointmentDialogVisible" :style="{ width: '1180px' }" :header="appointmentDialogTitle" :modal="true" :closable="!saving" :closeOnEscape="!saving" class="app-dialog p-fluid">
        <fieldset :disabled="saving" class="app-dialog-body app-dialog-section border-0 m-0 min-w-0">
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
                                    inputId="appointment-patient"
                                    v-model="selectedPatient"
                                    :suggestions="patientSuggestions"
                                    :loading="patientsLoading"
                                    :emptySearchMessage="patientsLoading ? 'Carregando pacientes...' : patientsError ? 'Não foi possível carregar os pacientes.' : 'Nenhum paciente ativo encontrado.'"
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
                                <small v-if="patientsLoading" role="status">Buscando pacientes cadastrados...</small>
                                <div v-else-if="patientsError" role="alert" class="app-field-error">
                                    {{ patientsError }}
                                    <Button label="Buscar pacientes novamente" text size="small" @click="loadPatients" />
                                </div>
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
                                    inputId="appointment-status"
                                    v-model="currentAppointment.status"
                                    :options="statusOptions"
                                    :invalid="submitted && !currentAppointment.status"
                                    class="w-full"
                                />
                                <small v-if="submitted && !currentAppointment.status" class="app-field-error">O status é obrigatório.</small>
                            </div>
                            <div class="app-field col-span-12">
                                <label for="appointment-notes" class="app-field-label">Observações</label>
                                <textarea id="appointment-notes" v-model="currentAppointment.notes" maxlength="4000" rows="3" class="w-full border rounded-lg p-3" />
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

                    <Column field="description" header="Descricao" style="min-width: 24rem">
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

                    <Column headerClass="app-numeric-cell" bodyClass="app-numeric-cell" field="value" header="Valor" style="width: 10rem">
                        <template #body="{ data }">
                            <span v-if="data.procedureId" class="quotation-procedure-readonly-field">{{ formatCurrency(data.value) }}</span>
                            <InputText v-else v-model.number="data.value" type="number" min="0" max="9999999999.99" step="0.01" aria-label="Valor do procedimento avulso" class="w-full" />
                        </template>
                    </Column>

                    <Column field="classification" header="Classificacao" style="width: 12rem">
                        <template #body="{ data }">
                            <span v-if="data.procedureId" class="quotation-procedure-readonly-field">{{ data.classification }}</span>
                            <InputText v-else v-model="data.classification" maxlength="255" aria-label="Classificação do procedimento avulso" class="w-full" />
                        </template>
                    </Column>

                    <Column headerClass="app-actions-cell" header="Ações" :exportable="false" style="width: 5rem">
                        <template #body="{ data }">
                            <div class="quotation-procedure-action">
                                <Button aria-label="Remover procedimento" title="Remover procedimento" icon="pi pi-trash" variant="outlined" rounded severity="danger" size="small" @click="removeProcedureRow(data)" />
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
        </fieldset>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" :disabled="saving" text @click="closeAppointmentDialog" />
            <Button label="Salvar" icon="pi pi-check" :loading="saving" :disabled="saving || mutationPending" @click="saveAppointment" />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import axios from 'axios';
import { AppointmentService } from '../../infrastructure/services/AppointmentService';
import type { ApiAppointment, ApiAppointmentStatus, AppointmentInput } from '../../infrastructure/services/AppointmentService';
import { getApiErrorMessage } from '../../infrastructure/http/api';
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
import { PatientService } from '../../infrastructure/services/PatientService';
import type { ApiPatient } from '../../infrastructure/services/PatientService';
import { getProcedureServiceErrorMessage, ProcedureService } from '../../infrastructure/services/ProcedureService';
import type { ApiProcedure } from '../../infrastructure/services/ProcedureService';
import AppLayout from '../components/AppLayout.vue';

type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Realizado' | 'Cancelado';
const apiStatuses: Record<AppointmentStatus, ApiAppointmentStatus> = { Pendente: 'PENDENTE', Confirmado: 'CONFIRMADO', Realizado: 'REALIZADO', Cancelado: 'CANCELADO' };
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
    id?: number | null;
    rowKey: string;
    procedureId: number | null;
    procedureIdText: string;
    description: string;
    value: number;
    classification: string;
}

interface Appointment {
    title: string | null;
    professionalUserId: number | null;
    notes: string | null;
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

const statusOptions: AppointmentStatus[] = ['Pendente', 'Confirmado', 'Realizado', 'Cancelado'];
const clinicTimeZone = import.meta.env.VITE_CLINIC_TIMEZONE || 'America/Sao_Paulo';
const toast = useToast();
const appointments = ref<Appointment[]>([]);
const loading = ref(false);
const loadError = ref('');
const saving = ref(false);
const mutationPending = ref(false);
const detailsLoading = ref(false);
let detailsSequence = 0;
let listController: AbortController | undefined;
let visibleRange: { start: string; end: string } | undefined;

const fromApi = (item: ApiAppointment): Appointment => ({
    ...item,
    id: String(item.id),
    patientCpf: item.patientCpf ?? '',
    status: statusOptions.find(status => apiStatuses[status] === item.status) ?? 'Pendente',
    procedures: item.procedures.map((procedure, index) => ({
        ...procedure,
        rowKey: String(item.id) + '-item-' + index,
        procedureIdText: procedure.procedureCode ?? formatDisplayId(procedure.procedureId),
    })),
});
const withSeconds = (value: string) => value.length === 16 ? value + ':00' : value;
const toApi = (item: Appointment): AppointmentInput => ({
    start: withSeconds(item.start), end: withSeconds(item.end), status: apiStatuses[item.status],
    patientId: item.patientId, patientName: item.patientName.trim(), patientCpf: normalizeDigits(item.patientCpf) || null,
    title: item.title, professionalUserId: item.professionalUserId, notes: item.notes || null,
    procedures: item.procedures.map(procedure => procedure.id == null && procedure.procedureId != null
        ? { procedureId: procedure.procedureId }
        : { id: procedure.id, procedureId: procedure.procedureId, description: procedure.description.trim(), value: Number(procedure.value), classification: procedure.classification }),
});
const loadAppointments = async () => {
    if (!visibleRange) return true;
    listController?.abort();
    const controller = new AbortController();
    listController = controller;
    loading.value = true;
    loadError.value = '';
    try {
        const items = await AppointmentService.list(visibleRange.start, visibleRange.end, controller.signal);
        if (!controller.signal.aborted) appointments.value = items.map(fromApi);
        return true;
    } catch (error) {
        if (axios.isCancel(error) || controller.signal.aborted) return true;
        loadError.value = getApiErrorMessage(error);
        return false;
    } finally {
        if (listController === controller) loading.value = false;
    }
};
const afterMutation = async (message: string, item?: ApiAppointment) => {
    if (item) {
        const index = appointments.value.findIndex(existing => existing.id === String(item.id));
        if (index >= 0) appointments.value.splice(index, 1, fromApi(item));
        else appointments.value.push(fromApi(item));
    }
    toast.add({ severity: 'success', summary: 'Agenda atualizada', detail: message, life: 3000 });
    if (!await loadAppointments()) toast.add({ severity: 'warn', summary: 'Alteração salva', detail: 'A atualização da lista falhou. Recarregue a agenda sem repetir a operação.', life: 6000 });
};
const handleMutationError = async (error: unknown) => {
    showError(getApiErrorMessage(error));
    if (axios.isAxiosError(error) && [404, 409].includes(error.response?.status ?? 0)) await loadAppointments();
};

const registeredPatients = ref<PatientOption[]>([]);
const patientsLoading = ref(false);
const patientsError = ref('');
let patientsRequest: Promise<void> | undefined;
let patientSearchQuery = '';
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
    editable: !mutationPending.value && !saving.value,
    classNames: [`schedule-event-${appointment.status.toLowerCase()}`],
    extendedProps: {
        code: appointment.code,
        status: appointment.status
    }
})));

const calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [classicThemePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    locale: ptBrLocale,
    timeZone: clinicTimeZone,
    datesSet: (info) => {
        const nextRange = { start: withSeconds(dateToInputValue(info.start)), end: withSeconds(dateToInputValue(info.end)) };
        if (visibleRange?.start === nextRange.start && visibleRange.end === nextRange.end) return;
        visibleRange = nextRange;
        appointments.value = [];
        void loadAppointments();
    },
    initialView: 'timeGridWeek',
    height: '100%',
    selectable: true,
    editable: true,
    nowIndicator: true,
    allDaySlot: false,
    eventBeforeClass: 'schedule-event-native-marker',
    slotMinTime: '00:00:00',
    slotMaxTime: '24:00:00',
    scrollTime: '07:00:00',
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
        title: null,
        professionalUserId: null,
        notes: null,
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
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: clinicTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value;
    return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
};

const addMinutes = (date: Date, minutes: number) => new Date(date.getTime() + minutes * 60_000);



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
        case 'Realizado': return 'background-color: #15803d;';
        case 'Cancelado': return 'background-color: #b91c1c;';
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

const filterPatientSuggestions = () => {
    const query = patientSearchQuery.trim().toLowerCase();
    const queryDigits = normalizeDigits(query);
    patientSuggestions.value = registeredPatients.value.filter(patient =>
        !query || patient.name.toLowerCase().includes(query) ||
        (!!queryDigits && normalizeDigits(patient.cpf).includes(queryDigits))
    );
};

const loadPatients = (): Promise<void> => {
    if (patientsRequest) return patientsRequest;
    patientsLoading.value = true;
    patientsError.value = '';
    patientsRequest = (async () => {
      try {
        const patients = await PatientService.list();
        registeredPatients.value = patients
            // Older responses omit the default active status, as in patient registration.
            .filter(patient => (patient.statusCode ?? 0) === 0)
            .map(toPatientOption)
            .filter(patient => patient.name);
        filterPatientSuggestions();
      } catch (error: unknown) {
        registeredPatients.value = [];
        patientSuggestions.value = [];
        patientsError.value = getApiErrorMessage(error);
      } finally {
        patientsLoading.value = false;
        patientsRequest = undefined;
      }
    })();
    return patientsRequest;
};

const loadProcedures = async () => {
    try {
        const procedures = await ProcedureService.list();
        registeredProcedures.value = procedures
            .filter(procedure => (procedure.statusCode ?? 0) === 0)
            .map(toProcedureOption)
            .filter(procedure => procedure.id || procedure.description);
        procedureDescriptionSuggestions.value = registeredProcedures.value;
    } catch (error: unknown) {
        showError(getProcedureServiceErrorMessage(error));
    }
};

const searchPatients = async (event: AutocompleteCompleteEvent) => {
    patientSearchQuery = event.query ?? '';
    if (patientsRequest) await patientsRequest;
    filterPatientSuggestions();
};

const applyPatientToAppointment = (patient: PatientOption) => {
    if (currentAppointment.value.patientId !== patient.id) currentAppointment.value.title = patient.name;
    currentAppointment.value.patientId = patient.id;
    currentAppointment.value.patientName = patient.name;
    currentAppointment.value.patientCpf = patient.cpf;
    selectedPatient.value = patient;
};

const clearPatientFields = () => {
    currentAppointment.value.title = null;
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

        if (event.value !== currentAppointment.value.patientName) {
            currentAppointment.value.patientId = null;
            currentAppointment.value.patientCpf = '';
            currentAppointment.value.title = event.value;
        }
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
    const item = currentAppointment.value;
    selectedPatient.value = item.patientId == null ? item.patientName : { id: item.patientId, name: item.patientName, cpf: item.patientCpf };
};

const getStatusMenuLabel = (status: AppointmentStatus) => {
    switch (status) {
        case 'Confirmado': return 'Confirmar atendimento';
        case 'Realizado': return 'Marcar como realizado';
        case 'Cancelado': return 'Cancelar atendimento';
        case 'Pendente':
        default:
            return 'Marcar como pendente';
    }
};

const getStatusMenuIcon = (status: AppointmentStatus) => {
    switch (status) {
        case 'Confirmado': return 'pi pi-check';
        case 'Realizado': return 'pi pi-check-circle';
        case 'Cancelado': return 'pi pi-times';
        case 'Pendente':
        default:
            return 'pi pi-clock';
    }
};

const updateSelectedAppointmentStatus = async (status: AppointmentStatus) => {
    const selected = contextMenuSelection.value;
    if (!selected || mutationPending.value || saving.value) return;
    mutationPending.value = true;
    try {
        const item = await AppointmentService.status(selected.id, apiStatuses[status]);
        await afterMutation('Status atualizado.', item);
    } catch (error) { await handleMutationError(error); }
    finally { mutationPending.value = false; contextMenuSelection.value = null; }
};
const deleteSelectedAppointment = async () => {
    const selected = contextMenuSelection.value;
    if (!selected || mutationPending.value || saving.value) return;
    mutationPending.value = true;
    try {
        await AppointmentService.cancel(selected.id);
        selected.status = 'Cancelado';
        await afterMutation('Atendimento cancelado.');
    } catch (error) { await handleMutationError(error); }
    finally { mutationPending.value = false; contextMenuSelection.value = null; }
};

const openAppointmentContextMenu = (mouseEvent: MouseEvent, appointmentId: string) => {
    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();

    const appointment = appointments.value.find(item => item.id === appointmentId);
    if (!appointment) return;

    contextMenuSelection.value = appointment;
    const statusMenuItems = statusOptions
        .filter(status => status !== appointment.status && status !== 'Cancelado')
        .map(status => ({
            label: getStatusMenuLabel(status),
            icon: getStatusMenuIcon(status),
            command: () => updateSelectedAppointmentStatus(status)
        }));

    menuItems.value = [
        ...statusMenuItems,
        ...(appointment.status === 'Cancelado' ? [] : [{
            label: 'Cancelar atendimento',
            icon: 'pi pi-trash',
            class: 'text-[var(--p-primary-1010)]',
            command: () => deleteSelectedAppointment()
        }])
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
    if (row.procedureId === procedure.id) return;
    row.id = undefined;
    row.procedureId = procedure.id;
    row.procedureIdText = procedure.displayId;
    row.description = procedure.description;
    row.value = procedure.value;
    row.classification = procedure.classification;
};

const clearProcedureRow = (row: AppointmentProcedure) => {
    row.id = undefined;
    row.procedureId = null;
    row.procedureIdText = '';
    row.description = '';
    row.value = 0;
    row.classification = '';
};

const syncProcedureIdInput = (row: AppointmentProcedure, value: string | null | undefined) => {
    const nextValue = value ?? '';
    if (nextValue === row.procedureIdText) return;
    row.id = undefined;
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
    if (nextValue === row.description) return;
    row.id = undefined;
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
    patientSearchQuery = '';
    void loadPatients();
    patientSuggestions.value = registeredPatients.value;
    procedureDescriptionSuggestions.value = registeredProcedures.value;
};

const openAddDialog = () => {
    if (saving.value || mutationPending.value) return;
    detailsSequence++;
    detailsLoading.value = false;
    dialogMode.value = 'add';
    currentAppointment.value = {
        ...getEmptyAppointment(),
        start: dateToInputValue(new Date()),
        end: dateToInputValue(addMinutes(new Date(), 60)),
        procedures: []
    };
    selectedPatient.value = null;
    resetAppointmentDialogState();
    appointmentDialogVisible.value = true;
};

const openDialogFromCalendarSelection = (selection: DateSelectInfo) => {
    if (saving.value || mutationPending.value) return;
    detailsSequence++;
    detailsLoading.value = false;
    dialogMode.value = 'add';
    currentAppointment.value = {
        ...getEmptyAppointment(),
        start: dateToInputValue(selection.start),
        end: dateToInputValue(selection.end || addMinutes(selection.start, 60)),
        procedures: []
    };
    selectedPatient.value = null;
    resetAppointmentDialogState();
    appointmentDialogVisible.value = true;
};

const openDialogFromCalendarEvent = async (info: EventClickInfo) => {
    if (saving.value || mutationPending.value) return;
    const sequence = ++detailsSequence;
    detailsLoading.value = true;
    try {
        const item = await AppointmentService.details(info.event.id);
        if (sequence !== detailsSequence) return;
        dialogMode.value = 'edit';
        currentAppointment.value = fromApi(item);
        syncSelectedPatient();
        resetAppointmentDialogState();
        appointmentDialogVisible.value = true;
    } catch (error) { if (sequence === detailsSequence) await handleMutationError(error); }
    finally { if (sequence === detailsSequence) detailsLoading.value = false; }
};

const closeAppointmentDialog = () => {
    if (saving.value) return;
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

const saveAppointment = async () => {
    if (saving.value || mutationPending.value) return;
    submitted.value = true;
    syncPatientName({ value: selectedPatient.value });
    if (!isAppointmentValid()) { showError('Preencha o paciente, os horários e pelo menos um procedimento.'); return; }
    const item = cloneAppointment(currentAppointment.value);
    if (item.patientName.length > 150 || (item.title?.length ?? 0) > 150 || (item.notes?.length ?? 0) > 4000 || item.procedures.length > 200 || item.procedures.some(procedure => !procedure.description.trim() || procedure.description.length > 255 || procedure.classification.length > 255 || !Number.isFinite(Number(procedure.value)) || Number(procedure.value) < 0 || Number(procedure.value) > 9999999999.99 || Math.abs(Number(procedure.value) * 100 - Math.round(Number(procedure.value) * 100)) > 0.0001)) {
        showError('Verifique os limites: nome de 150 caracteres, observações de 4000, até 200 procedimentos com descrição/classificação de 255 e valor válido com até duas casas decimais.');
        return;
    }
    saving.value = true;
    try {
        const saved = dialogMode.value === 'add' ? await AppointmentService.create(toApi(item)) : await AppointmentService.edit(item.id, toApi(item));
        appointmentDialogVisible.value = false;
        await afterMutation('Atendimento salvo.', saved);
    } catch (error) { await handleMutationError(error); }
    finally { saving.value = false; }
};
const updateAppointmentSchedule = async (info: EventDropInfo | EventResizeDoneInfo) => {
    if (mutationPending.value || saving.value || !info.event.start || !info.event.end) { info.revert(); return; }
    mutationPending.value = true;
    try {
        const saved = await AppointmentService.schedule(info.event.id, withSeconds(dateToInputValue(info.event.start)), withSeconds(dateToInputValue(info.event.end)));
        await afterMutation('Horário atualizado.', saved);
    } catch (error) { info.revert(); await handleMutationError(error); }
    finally { mutationPending.value = false; }
};
const updateAppointmentFromCalendarMove = (info: EventDropInfo) => { void updateAppointmentSchedule(info); };
const updateAppointmentFromCalendarResize = (info: EventResizeDoneInfo) => { void updateAppointmentSchedule(info); };

onBeforeUnmount(() => { listController?.abort(); detailsSequence++; });

onMounted(() => {
    void loadPatients();
    void loadProcedures();
});
</script>
