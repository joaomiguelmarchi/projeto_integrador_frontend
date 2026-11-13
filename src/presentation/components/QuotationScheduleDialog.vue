<template>
    <Dialog :visible="true" modal :draggable="false" :closable="!creating" :closeOnEscape="!creating" :header="quotation.status === 'Aprovado' ? 'Marcar agendamentos' : 'Aprovar orçamento e marcar agendamentos'" class="app-dialog" :style="{ width: '1050px', maxWidth: '95vw' }" @update:visible="close">
        <fieldset :disabled="creating" class="app-dialog-body app-dialog-section border-0 p-0 m-0 min-w-0">
            <AppDetailSummary :label="'Orçamento ' + quotation.code" :title="quotation.patientName" icon="pi-calendar" />
            <AppDetailSection title="Gerar recorrência" icon="pi-calendar-plus">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="app-field"><label for="plan-date" class="app-field-label">Primeira data</label><InputText id="plan-date" type="date" v-model="firstDate" :min="today" /></div>
                    <div class="app-field"><label for="plan-frequency" class="app-field-label">Frequência</label><Select inputId="plan-frequency" v-model="frequency" :options="frequencies" optionLabel="label" optionValue="value" /></div>
                    <div class="app-field"><label for="plan-count" class="app-field-label">Quantidade de agendamentos</label><InputNumber inputId="plan-count" v-model="count" :min="1" :max="52" :disabled="frequency === 'once'" /></div>
                    <div class="app-field"><label for="plan-duration" class="app-field-label">Duração por atendimento (min)</label><InputNumber inputId="plan-duration" v-model="duration" :min="15" :max="240" :step="15" /></div>
                </div>
                <Button class="mt-3" label="Gerar recorrência" icon="pi pi-calendar" outlined @click="generate" :disabled="!validSettings || loadingExisting" />
            </AppDetailSection>
            <AppDetailSection title="Revisar agendamentos" icon="pi-list">
                <p v-if="loadingExisting" class="text-sm" role="status">Consultando horários ocupados na agenda...</p>
                <p v-else-if="loadError" class="text-sm text-red-600" role="alert">{{ loadError }} <Button label="Tentar novamente" text size="small" @click="ensureLoaded" /></p>
                <p v-if="!sessions.length" class="text-sm">Gere uma recorrência ou adicione um agendamento avulso para começar.</p>
                <div v-for="(session, index) in sessions" :key="session.id" class="border border-[var(--p-surface-200)] rounded-xl p-4 mb-3">
                    <div class="flex items-center justify-between mb-3"><strong class="font-medium">Agendamento {{ index + 1 }}</strong><Button icon="pi pi-trash" severity="danger" text :aria-label="'Remover sessão ' + (index + 1)" @click="sessions.splice(index, 1)" /></div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="app-field"><label :for="session.id + '-date'" class="app-field-label">Data</label><InputText :id="session.id + '-date'" type="date" v-model="session.date" :min="today" @update:modelValue="session.time = ''" /></div>
                        <div class="app-field"><label :for="session.id + '-duration'" class="app-field-label">Duração (min)</label><InputNumber :inputId="session.id + '-duration'" v-model="session.duration" :min="15" :max="240" @update:modelValue="session.time = ''" /></div>
                        <div class="app-field"><label :for="session.id + '-time'" class="app-field-label">Horários disponíveis</label><Select :inputId="session.id + '-time'" v-model="session.time" :options="availableTimes(session)" placeholder="Selecione um horário" emptyMessage="Sem horários nesta data" /></div>
                    </div>
                    <div class="app-field mt-3"><label :for="session.id + '-procedures'" class="app-field-label">Procedimentos previstos</label><MultiSelect :inputId="session.id + '-procedures'" v-model="session.procedures" :options="quotation.procedures" optionLabel="description" optionValue="rowKey" placeholder="Selecione os procedimentos" display="chip" /></div>
                    <p v-if="problem(session)" class="text-sm text-red-600 mt-2" role="status">{{ problem(session) }}</p>
                </div>
                <Button label="Adicionar agendamento avulso" icon="pi pi-plus" text @click="addSession" :disabled="sessions.length >= 52" />
                <p v-if="unplanned.length" class="text-sm mt-3">Procedimentos sem agendamento: {{ unplanned.map(p => p.description).join(', ') }}.</p>
                <p v-if="!quotation.procedures.length" class="text-sm text-red-600">Adicione procedimentos ao orçamento antes de planejar as sessões.</p>
            </AppDetailSection>
        </fieldset>
        <template #footer><Button label="Cancelar" text :disabled="creating" @click="close" /><Button :label="quotation.status === 'Aprovado' ? 'Adicionar à agenda' : 'Aprovar e agendar'" icon="pi pi-check" :loading="creating" :disabled="!canConfirm || creating" @click="confirm" /></template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import { useToast } from 'primevue/usetoast';
import AppDetailSummary from './AppDetailSummary.vue';
import AppDetailSection from './AppDetailSection.vue';
import { AppointmentService } from '../../infrastructure/services/AppointmentService';
import type { ApiAppointment, AppointmentInput } from '../../infrastructure/services/AppointmentService';
import { getApiErrorMessage } from '../../infrastructure/http/api';

export interface SchedulableQuotation {
    id: number | null;
    code: string;
    status: string;
    patientId: number | null;
    patientName: string;
    patientCpf: string;
    procedures: Array<{ rowKey: string; procedureId: number | null; description: string; value: number; classification: string }>;
}
const props = defineProps<{ quotation: SchedulableQuotation }>();
const emit = defineEmits<{ close: []; confirm: [created: number] }>();
const toast = useToast();
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDays = (date: string, days: number) => { const d = new Date(`${date}T12:00`); d.setDate(d.getDate() + days); return localDate(d); };
const today = localDate(new Date());
const firstDate = ref(today);
const frequency = ref('weekly');
const count = ref<number | null>(3);
const duration = ref<number | null>(60);
const frequencies = [{ label: 'Avulsa', value: 'once' }, { label: 'Semanal', value: 'weekly' }, { label: 'Mensal', value: 'monthly' }];
interface Session { id: string; date: string; time: string; duration: number | null; procedures: string[] }
const sessions = ref<Session[]>([]);
const creating = ref(false);

// Horários já ocupados na agenda (backend), carregados sob demanda para o período das sessões.
const existing = ref<ApiAppointment[]>([]);
const loadedRange = ref<{ start: string; end: string } | null>(null);
const loadingExisting = ref(false);
const loadError = ref('');
let pendingLoad: Promise<void> | null = null;
const ensureLoaded = async (): Promise<void> => {
    if (pendingLoad) { await pendingLoad; return ensureLoaded(); }
    pendingLoad = loadRange().finally(() => { pendingLoad = null; });
    return pendingLoad;
};
const loadRange = async () => {
    const dates = sessions.value.map(s => s.date).filter(Boolean).sort();
    if (!dates.length) return;
    const start = dates[0]! < today ? dates[0]! : today;
    const end = addDays(dates[dates.length - 1]!, 1);
    const loaded = loadedRange.value;
    if (loaded && loaded.start <= start && loaded.end >= end) return;
    const range = { start: loaded && loaded.start < start ? loaded.start : start, end: loaded && loaded.end > end ? loaded.end : end };
    loadingExisting.value = true;
    loadError.value = '';
    try {
        existing.value = await AppointmentService.list(`${range.start}T00:00:00`, `${range.end}T00:00:00`);
        loadedRange.value = range;
    } catch (error) {
        loadError.value = 'Não foi possível consultar a agenda: ' + getApiErrorMessage(error);
    } finally {
        loadingExisting.value = false;
    }
};
watch(() => sessions.value.map(s => s.date).join(','), () => { void ensureLoaded(); });
const isLoaded = (date: string) => !!loadedRange.value && date >= loadedRange.value.start && date < loadedRange.value.end;

const validDuration = (value: number | null) => value !== null && Number.isInteger(value) && value >= 15 && value <= 240;
const validSettings = computed(() => firstDate.value >= today && validDuration(duration.value) && (frequency.value === 'once' || (count.value !== null && Number.isInteger(count.value) && count.value >= 1 && count.value <= 52)));
const range = (session: Session, time = session.time) => {
    const start = new Date(`${session.date}T${time}`).getTime();
    return { start, end: start + (session.duration || 0) * 60000 };
};
const availableTimes = (session: Session) => {
    if (!session.date || !validDuration(session.duration) || !isLoaded(session.date)) return [];
    const options: string[] = [];
    for (let minute = 7 * 60; minute + session.duration! <= 20 * 60; minute += 15) {
        const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
        const candidate = range(session, time);
        const overlaps = (start: number, end: number) => candidate.start < end && candidate.end > start;
        if (candidate.start <= Date.now()) continue;
        if (existing.value.some(a => a.status !== 'CANCELADO' && overlaps(new Date(a.start).getTime(), new Date(a.end).getTime()))) continue;
        if (sessions.value.some(s => s.id !== session.id && s.time && overlaps(range(s).start, range(s).end))) continue;
        options.push(time);
    }
    return options;
};
const problem = (session: Session) => {
    if (!isLoaded(session.date)) return loadingExisting.value ? '' : 'Não foi possível verificar a disponibilidade desta data.';
    if (!session.time || !availableTimes(session).includes(session.time)) return 'Selecione um horário disponível. Ajuste a data ou a duração se necessário.';
    if (!session.procedures.length) return 'Selecione ao menos um procedimento para esta sessão.';
    return '';
};
const canConfirm = computed(() => props.quotation.id != null && !loadingExisting.value && !loadError.value && sessions.value.length > 0 && sessions.value.every(s => isLoaded(s.date) && !problem(s)));
const unplanned = computed(() => props.quotation.procedures.filter(p => !sessions.value.some(s => s.procedures.includes(p.rowKey))));
const createSession = (date: string): Session => ({ id: crypto.randomUUID(), date, time: '', duration: duration.value, procedures: [] });
const addSession = () => sessions.value.push(createSession(firstDate.value || today));
const generate = async () => {
    if (!validSettings.value) return;
    const created: Session[] = [];
    const base = new Date(`${firstDate.value}T12:00`);
    for (let i = 0; i < (frequency.value === 'once' ? 1 : count.value!); i++) {
        const date = new Date(base);
        if (frequency.value === 'weekly') date.setDate(base.getDate() + i * 7);
        if (frequency.value === 'monthly') {
            date.setDate(1);
            date.setMonth(base.getMonth() + i);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            date.setDate(Math.min(base.getDate(), lastDay));
        }
        created.push(createSession(localDate(date)));
    }
    sessions.value = created;
    await ensureLoaded();
    // Preenche em sequência para que cada sessão respeite os horários escolhidos para as anteriores.
    for (const session of sessions.value) session.time = availableTimes(session)[0] || '';
};
const timeOf = (ms: number) => { const d = new Date(ms); return `${localDate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`; };
const toInput = (session: Session): AppointmentInput => {
    const q = props.quotation;
    const r = range(session);
    return {
        start: timeOf(r.start), end: timeOf(r.end), status: 'PENDENTE',
        title: q.patientName, patientId: q.patientId, patientName: q.patientName.trim(), patientCpf: q.patientCpf.replace(/\D/g, '') || null,
        professionalUserId: null, notes: `Agendamento gerado a partir do orçamento ${q.code}.`,
        procedures: q.procedures.filter(p => session.procedures.includes(p.rowKey)).map(p => p.procedureId != null
            ? { procedureId: p.procedureId }
            : { procedureId: null, description: p.description, value: p.value, classification: p.classification }),
    };
};
const close = () => { if (!creating.value) emit('close'); };
const confirm = async () => {
    if (!canConfirm.value || creating.value) return;
    creating.value = true;
    let created = 0;
    try {
        // Cria um por vez; sessões já salvas saem da lista para que uma nova tentativa não as duplique.
        while (sessions.value.length) {
            const session = sessions.value[0]!;
            const saved = await AppointmentService.create(toInput(session));
            existing.value.push(saved);
            sessions.value.shift();
            created++;
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Agendamento não concluído', detail: (created ? `${created} agendamento(s) criado(s); os demais não foram salvos. ` : '') + getApiErrorMessage(error), life: 7000 });
        return;
    } finally {
        creating.value = false;
    }
    emit('confirm', created);
};
</script>
