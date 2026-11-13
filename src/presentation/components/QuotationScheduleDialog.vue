<template>
    <Dialog :visible="true" modal :draggable="false" :header="quotation.status === 'Aprovado' ? 'Marcar agendamentos' : 'Aprovar orçamento e marcar agendamentos'" class="app-dialog" :style="{ width: '1050px', maxWidth: '95vw' }" @update:visible="emit('close')">
        <div class="app-dialog-body app-dialog-section">
            <AppDetailSummary :label="'Orçamento ' + quotation.id" :title="quotation.patientName" icon="pi-calendar" />
            <AppDetailSection title="Gerar recorrência" icon="pi-calendar-plus">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="app-field"><label for="plan-date" class="app-field-label">Primeira data</label><InputText id="plan-date" type="date" v-model="firstDate" :min="today" /></div>
                    <div class="app-field"><label for="plan-frequency" class="app-field-label">Frequência</label><Select inputId="plan-frequency" v-model="frequency" :options="frequencies" optionLabel="label" optionValue="value" /></div>
                    <div class="app-field"><label for="plan-count" class="app-field-label">Quantidade de agendamentos</label><InputNumber inputId="plan-count" v-model="count" :min="1" :max="52" :disabled="frequency === 'once'" /></div>
                    <div class="app-field"><label for="plan-duration" class="app-field-label">Duração por atendimento (min)</label><InputNumber inputId="plan-duration" v-model="duration" :min="15" :max="240" :step="15" /></div>
                </div>
                <Button class="mt-3" label="Gerar recorrência" icon="pi pi-calendar" outlined @click="generate" :disabled="!validSettings" />
            </AppDetailSection>
            <AppDetailSection title="Revisar agendamentos" icon="pi-list">
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
        </div>
        <template #footer><Button label="Cancelar" text @click="emit('close')" /><Button :label="quotation.status === 'Aprovado' ? 'Adicionar à agenda' : 'Aprovar e agendar'" icon="pi pi-check" :disabled="!canConfirm" @click="confirm" /></template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import AppDetailSummary from './AppDetailSummary.vue';
import AppDetailSection from './AppDetailSection.vue';
import type { Quotation } from '../../infrastructure/services/QuotationDemo';
import { appointments } from '../../infrastructure/services/SchedulingDemo';
const props = defineProps<{ quotation: Quotation }>();
const emit = defineEmits<{ close: []; confirm: [] }>();
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = localDate(new Date());
const firstDate = ref(today);
const frequency = ref('weekly');
const count = ref<number | null>(3);
const duration = ref<number | null>(60);
const frequencies = [{ label: 'Avulsa', value: 'once' }, { label: 'Semanal', value: 'weekly' }, { label: 'Mensal', value: 'monthly' }];
interface Session { id: string; date: string; time: string; duration: number | null; procedures: string[] }
const sessions = ref<Session[]>([]);
const validDuration = (value: number | null) => value !== null && Number.isInteger(value) && value >= 15 && value <= 240;
const validSettings = computed(() => firstDate.value >= today && validDuration(duration.value) && (frequency.value === 'once' || (count.value !== null && Number.isInteger(count.value) && count.value >= 1 && count.value <= 52)));
const range = (session: Session, time = session.time) => {
    const start = new Date(`${session.date}T${time}`).getTime();
    return { start, end: start + (session.duration || 0) * 60000 };
};
const availableTimes = (session: Session) => {
    if (!session.date || !validDuration(session.duration)) return [];
    const options: string[] = [];
    for (let minute = 7 * 60; minute + session.duration! <= 20 * 60; minute += 15) {
        const time = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
        const candidate = range(session, time);
        const overlaps = (start: number, end: number) => candidate.start < end && candidate.end > start;
        if (candidate.start <= Date.now()) continue;
        if (appointments.value.some(a => overlaps(new Date(a.start).getTime(), new Date(a.end).getTime()))) continue;
        if (sessions.value.some(s => s.id !== session.id && s.time && overlaps(range(s).start, range(s).end))) continue;
        options.push(time);
    }
    return options;
};
const problem = (session: Session) => {
    if (!session.time || !availableTimes(session).includes(session.time)) return 'Selecione um horário disponível. Ajuste a data ou a duração se necessário.';
    if (!session.procedures.length) return 'Selecione ao menos um procedimento para esta sessão.';
    return '';
};
const canConfirm = computed(() => sessions.value.length > 0 && sessions.value.every(s => !problem(s)));
const unplanned = computed(() => props.quotation.procedures.filter(p => !sessions.value.some(s => s.procedures.includes(p.rowKey))));
const createSession = (date: string): Session => ({ id: crypto.randomUUID(), date, time: '', duration: duration.value, procedures: [] });
const addSession = () => sessions.value.push(createSession(firstDate.value || today));
const generate = () => {
    if (!validSettings.value) return;
    sessions.value = [];
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
        const session = createSession(localDate(date));
        session.time = availableTimes(session)[0] || '';
        sessions.value.push(session);
    }
};
const confirm = () => {
    if (!sessions.value.length || sessions.value.some(s => problem(s))) return;
    let code = appointments.value.reduce((max, a) => Math.max(max, Number(a.code.replace(/\D/g, '')) || 0), 0);
    const created = sessions.value.map(session => {
        const end = new Date(range(session).end);
        return { id: crypto.randomUUID(), code: '#' + String(++code).padStart(7, '0'), quotationId: props.quotation.id,
            status: 'Pendente' as const, start: `${session.date}T${session.time}`, end: `${localDate(end)}T${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
            patientId: props.quotation.patientId, patientName: props.quotation.patientName, patientCpf: props.quotation.patientCpf,
            procedures: props.quotation.procedures.filter(p => session.procedures.includes(p.rowKey)).map(p => ({ ...p })) };
    });
    appointments.value.push(...created);
    emit('confirm');
};
</script>
