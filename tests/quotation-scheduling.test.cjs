const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { ref, computed, watch } = require('vue');

// Runs the real dialog script with an in-memory AppointmentService (no backend writes).
function setup({ failOnCreate } = {}) {
    const source = fs.readFileSync('src/presentation/components/QuotationScheduleDialog.vue', 'utf8')
        .split('<script setup lang="ts">')[1].split('</script>')[0]
        .replace(/^import .*;\r?$/gm, '').replace(/^export /gm, '');
    const existing = [];
    const created = [];
    const listCalls = [];
    const AppointmentService = {
        async list(start, end) { listCalls.push({ start, end }); return existing.map(a => ({ ...a })); },
        async create(body) {
            if (failOnCreate && created.length === failOnCreate) throw new Error('Conflito no servidor');
            const saved = { ...body, id: 100 + created.length, code: '#' + (100 + created.length) };
            created.push(body);
            return saved;
        },
    };
    const quotation = { id: 7, code: '#0000007', status: 'Pendente', patientName: 'Paciente', patientId: 1, patientCpf: '123.456.789-09',
        procedures: [{ rowKey: 'p1', procedureId: 3, description: 'Procedimento', value: 100, classification: 'Clínico' }, { rowKey: 'p2', procedureId: null, description: 'Avulso', value: 50, classification: 'Outro' }] };
    const events = [];
    const messages = [];
    const context = { ref, computed, watch, Date, crypto: require('node:crypto').webcrypto, AppointmentService,
        useToast: () => ({ add: m => messages.push(m) }), getApiErrorMessage: e => e.message,
        defineProps: () => ({ quotation }), defineEmits: () => (...event) => events.push(event) };
    vm.createContext(context);
    vm.runInContext(ts.transpile(source + '\nglobalThis.api = { firstDate, frequency, count, duration, sessions, generate, availableTimes, confirm, problem, canConfirm, ensureLoaded };', { target: ts.ScriptTarget.ES2022 }), context);
    return { ...context.api, existing, created, listCalls, events, messages };
}
const flush = () => new Promise(setImmediate);

test('monthly recurrence clamps February and returns to original day in March', async () => {
    const a = setup(); a.firstDate.value = '2030-01-31'; a.frequency.value = 'monthly'; await a.generate();
    assert.deepEqual(Array.from(a.sessions.value, s => s.date), ['2030-01-31', '2030-02-28', '2030-03-31']);
});
test('weekly recurrence crosses year boundary', async () => {
    const a = setup(); a.firstDate.value = '2030-12-30'; await a.generate();
    assert.deepEqual(Array.from(a.sessions.value, s => s.date), ['2030-12-30', '2031-01-06', '2031-01-13']);
});
test('busy slots are loaded from the agenda for the planned period', async () => {
    const a = setup(); a.firstDate.value = '2030-01-01'; await a.generate();
    assert.ok(a.listCalls.length >= 1);
    const last = a.listCalls[a.listCalls.length - 1];
    assert.ok(last.end >= '2030-01-16T00:00:00');
});
test('availability excludes overlapping appointments, allows adjacent and cancelled ones', async () => {
    const a = setup();
    a.existing.push({ id: 1, status: 'CONFIRMADO', start: '2030-01-01T08:00:00', end: '2030-01-01T09:00:00' });
    a.existing.push({ id: 2, status: 'CANCELADO', start: '2030-01-01T10:00:00', end: '2030-01-01T11:00:00' });
    a.firstDate.value = '2030-01-01'; await a.generate();
    const times = a.availableTimes(a.sessions.value[0]);
    assert.ok(times.includes('07:00')); assert.ok(!times.includes('07:15')); assert.ok(!times.includes('08:00')); assert.ok(times.includes('09:00'));
    assert.ok(times.includes('10:00'));
});
test('confirmation requires procedures, then creates appointments through the API', async () => {
    const a = setup(); a.firstDate.value = '2030-01-01'; a.frequency.value = 'once'; await a.generate();
    await a.confirm(); assert.equal(a.events.length, 0); assert.equal(a.created.length, 0);
    a.sessions.value[0].procedures = ['p1', 'p2'];
    a.sessions.value[0].time = '09:00';
    await a.confirm();
    assert.deepEqual(a.events[0], ['confirm', 1]);
    const body = a.created[0];
    assert.equal(body.start, '2030-01-01T09:00:00'); assert.equal(body.end, '2030-01-01T10:00:00');
    assert.equal(body.status, 'PENDENTE'); assert.equal(body.patientCpf, '12345678909'); assert.equal(body.patientId, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(body.procedures)), [{ procedureId: 3 }, { procedureId: null, description: 'Avulso', value: 50, classification: 'Outro' }]);
});
test('partial failure keeps only unsaved sessions so a retry does not duplicate', async () => {
    const a = setup({ failOnCreate: 1 }); a.firstDate.value = '2030-01-01'; a.count.value = 2; await a.generate();
    a.sessions.value.forEach(s => { s.procedures = ['p1']; });
    await a.confirm();
    assert.equal(a.created.length, 1); assert.equal(a.sessions.value.length, 1); assert.equal(a.events.length, 0);
    assert.equal(a.messages[0].severity, 'error');
});
test('draft sessions cannot overlap each other', async () => {
    const a = setup(); a.firstDate.value = '2030-01-01'; await a.generate();
    a.sessions.value[1].date = '2030-01-01';
    await flush();
    assert.ok(!a.availableTimes(a.sessions.value[1]).includes(a.sessions.value[0].time));
});
