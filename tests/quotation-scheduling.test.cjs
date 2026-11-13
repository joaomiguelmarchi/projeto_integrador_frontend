const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { ref, computed } = require('vue');
function setup() {
    const source = fs.readFileSync('src/presentation/components/QuotationScheduleDialog.vue', 'utf8').split('<script setup lang="ts">')[1].split('</script>')[0].replace(/^import .*;$/gm, '');
    const appointments = ref([]);
    const quotation = { id: 'q1', patientName: 'Paciente', patientId: 1, patientCpf: '', procedures: [{ rowKey: 'p1', description: 'Procedimento' }] };
    const events = [];
    const context = { ref, computed, appointments, Date, crypto: require('node:crypto').webcrypto, defineProps: () => ({ quotation }), defineEmits: () => event => events.push(event) };
    vm.createContext(context);
    vm.runInContext(ts.transpile(source + '\nglobalThis.api = { firstDate, frequency, count, duration, sessions, generate, availableTimes, confirm, problem };', { target: ts.ScriptTarget.ES2022 }), context);
    return { ...context.api, appointments, events };
}
test('monthly recurrence clamps February and returns to original day in March', () => {
    const a = setup(); a.firstDate.value = '2030-01-31'; a.frequency.value = 'monthly'; a.generate();
    assert.deepEqual(Array.from(a.sessions.value, s => s.date), ['2030-01-31', '2030-02-28', '2030-03-31']);
});
test('weekly recurrence crosses year boundary', () => {
    const a = setup(); a.firstDate.value = '2030-12-30'; a.generate();
    assert.deepEqual(Array.from(a.sessions.value, s => s.date), ['2030-12-30', '2031-01-06', '2031-01-13']);
});
test('availability excludes overlapping appointments but allows adjacent ones', () => {
    const a = setup(); a.firstDate.value = '2030-01-01'; a.generate();
    a.appointments.value.push({ code: '#0000001', start: '2030-01-01T08:00', end: '2030-01-01T09:00' });
    const times = a.availableTimes(a.sessions.value[0]);
    assert.ok(times.includes('07:00')); assert.ok(!times.includes('07:15')); assert.ok(!times.includes('08:00')); assert.ok(times.includes('09:00'));
});
test('confirmation requires procedures and rechecks conflicts', () => {
    const a = setup(); a.firstDate.value = '2030-01-01'; a.frequency.value = 'once'; a.generate(); a.confirm(); assert.equal(a.events.length, 0);
    a.sessions.value[0].procedures = ['p1'];
    a.appointments.value.push({ code: '#0000001', start: '2030-01-01T07:00', end: '2030-01-01T08:00' });
    a.confirm(); assert.equal(a.events.length, 0);
    a.sessions.value[0].time = '09:00'; a.confirm();
    assert.equal(a.events[0], 'confirm'); assert.equal(a.appointments.value[1].quotationId, 'q1'); assert.equal(a.appointments.value[1].end, '2030-01-01T10:00');
});
test('draft sessions cannot overlap each other', () => {
    const a = setup(); a.firstDate.value = '2030-01-01'; a.generate();
    a.sessions.value[1].date = '2030-01-01';
    assert.ok(!a.availableTimes(a.sessions.value[1]).includes(a.sessions.value[0].time));
});
