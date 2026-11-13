const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { ref } = require('vue');
function setup(status = 'Confirmado') {
    const appointment = { id: 'a1', status, patientId: 10, patientName: 'Paciente', patientCpf: '', procedures: [{ rowKey: 'p1', description: 'Consulta', value: 150.25 }] };
    const appointments = ref([appointment]);
    const accounts = ref([]);
    const context = { appointments, accounts, Date, crypto: require('node:crypto').webcrypto };
    const source = fs.readFileSync('src/infrastructure/services/AttendanceDemo.ts', 'utf8').replace(/^import .*;$/gm, '').replace('export function', 'function');
    vm.createContext(context);
    vm.runInContext(ts.transpile(source + '\nglobalThis.complete = completeAppointment;', { target: ts.ScriptTarget.ES2022 }), context);
    return { ...context, appointment };
}
test('completion creates a pending account with cents and an independent procedure snapshot', () => {
    const a = setup(); const account = a.complete('a1');
    assert.equal(a.appointment.status, 'Realizado'); assert.equal(account.status, 'Pendente');
    assert.equal(account.attendanceId, 'a1'); assert.equal(account.patientId, '10');
    assert.equal(account.procedures[0].unitAmount, 15025); assert.equal(account.payments[0].amount, 15025);
    a.appointment.procedures[0].value = 1; assert.equal(account.procedures[0].unitAmount, 15025);
});
test('repeated completion does not duplicate a bill, even after bill removal', () => {
    const a = setup(); const first = a.complete('a1'); assert.equal(a.complete('a1').id, first.id); assert.equal(a.accounts.value.length, 1);
    a.accounts.value = []; assert.throws(() => a.complete('a1')); assert.equal(a.accounts.value.length, 0);
});
test('pending and missing appointments cannot generate an account', () => {
    const a = setup('Pendente'); assert.throws(() => a.complete('a1')); assert.throws(() => a.complete('missing'));
    assert.equal(a.accounts.value.length, 0); assert.equal(a.appointment.status, 'Pendente');
});
test('invalid procedure values leave appointment and billing unchanged', () => {
    const a = setup(); a.appointment.procedures[0].value = -1; assert.throws(() => a.complete('a1'));
    assert.equal(a.accounts.value.length, 0); assert.equal(a.appointment.status, 'Confirmado');
});
test('deletion only removes the dialog target and protects completed appointments', () => {
    const source = fs.readFileSync('src/presentation/views/ScheduleView.vue', 'utf8');
    const handler = source.slice(source.indexOf('const deleteSelectedAppointment ='), source.indexOf('const markAppointmentCompleted ='));
    const appointments = ref([{ id: 'a1', status: 'Confirmado' }, { id: 'a2', status: 'Realizado' }]);
    const appointmentToDelete = ref(null);
    const context = { appointments, appointmentToDelete, contextMenuSelection: ref({id:'a2'}), currentAppointment: ref({ id: '' }), closeAppointmentDialog() {}, toast: { add() {} } };
    vm.createContext(context); vm.runInContext(handler + '\nglobalThis.remove = deleteSelectedAppointment;', context);
    context.remove(); assert.equal(appointments.value.length, 2);
    appointmentToDelete.value = {id:'a1'}; context.remove(); assert.equal(appointments.value.length, 1); assert.equal(appointments.value[0].id, 'a2');
    appointmentToDelete.value = {id:'a2'}; context.remove(); assert.equal(appointments.value.length, 1);
});
