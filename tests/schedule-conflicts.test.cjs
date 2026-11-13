const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { ref, computed } = require('vue');
const helper = fs.readFileSync('src/infrastructure/services/ScheduleValidation.ts', 'utf8').replace(/^import .*;$/gm, '').replace('export function', 'function');
const context = { Date };
vm.createContext(context);
vm.runInContext(ts.transpile(helper + '\nglobalThis.find = findAppointmentConflict;', { target: ts.ScriptTarget.ES2022 }), context);
const existing = { id: 'a1', code: '#1', patientName: 'Paciente', status: 'Confirmado', start: '2030-01-01T09:00', end: '2030-01-01T10:00' };
const at = time => `2030-01-01T${time}`;
test('blocks identical, partial, contained and enclosing intervals', () => {
    for (const [start, end] of [['09:00','10:00'], ['08:30','09:30'], ['09:30','10:30'], ['09:15','09:45'], ['08:00','11:00']]) {
        assert.equal(context.find([existing], at(start), at(end))?.id, 'a1');
    }
});
test('allows adjacent slots, separate dates and unchanged editing', () => {
    assert.equal(context.find([existing], at('08:00'), at('09:00')), undefined);
    assert.equal(context.find([existing], at('10:00'), at('11:00')), undefined);
    assert.equal(context.find([existing], '2030-01-02T09:00', '2030-01-02T10:00'), undefined);
    assert.equal(context.find([existing], existing.start, existing.end, 'a1'), undefined);
});
test('detects conflicts across midnight and all appointment statuses', () => {
    for (const status of ['Pendente', 'Confirmado', 'Realizado']) {
        assert.ok(context.find([{...existing, status, start: at('23:00'), end: '2030-01-02T01:00'}], '2030-01-02T00:00', '2030-01-02T02:00'));
    }
});
function setupView() {
    const source = fs.readFileSync('src/presentation/views/ScheduleView.vue', 'utf8');
    const appointments = ref([{...existing}, {...existing, id:'a2', start:at('11:00'), end:at('12:00')}]);
    const currentAppointment = ref({...existing, id:'new', start:at('09:30'), end:at('10:30'), procedures:[]});
    let closed = false;
    const c = { appointments, currentAppointment, submitted:ref(false), selectedPatient:ref(null), dialogMode:ref('add'),
        syncPatientName(){}, isAppointmentValid:()=>true, showError(){}, conflictMessage:()=> 'Conflito',
        findAppointmentConflict:context.find, cloneAppointment: x=>JSON.parse(JSON.stringify(x)), hasProcedureReadyToSave:()=>true,
        closeAppointmentDialog(){closed=true;}, toast:{add(){}}, dateToInputValue: d=>`${d.getFullYear()}-01-01T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` };
    c.appointmentConflict = computed(()=>context.find(appointments.value, currentAppointment.value.start, currentAppointment.value.end, c.dialogMode.value==='edit'?currentAppointment.value.id:undefined));
    vm.createContext(c);
    const handlers = source.slice(source.indexOf('const saveAppointment ='), source.indexOf('onMounted(() =>'));
    vm.runInContext(ts.transpile(handlers+'\nglobalThis.save=saveAppointment; globalThis.move=updateAppointmentFromCalendarMove; globalThis.resize=updateAppointmentFromCalendarResize;', { target:ts.ScriptTarget.ES2022 }), c);
    return {c, closed:()=>closed};
}
test('create and edit keep data and dialog intact on conflicts', () => {
    const {c,closed}=setupView(); c.save(); assert.equal(c.appointments.value.length,2); assert.equal(closed(),false);
    c.dialogMode.value='edit'; c.currentAppointment.value.id='a2'; c.save(); assert.equal(c.appointments.value[1].start,at('11:00')); assert.equal(closed(),false);
});
test('drag and resize revert conflicts without mutating stored dates', () => {
    for (const action of ['move','resize']) {
        const {c}=setupView(); let reverted=false;
        c[action]({event:{id:'a2',start:new Date(at('09:30')),end:new Date(at('11:30'))},revert(){reverted=true;}});
        assert.equal(reverted,true); assert.equal(c.appointments.value[1].start,at('11:00')); assert.equal(c.appointments.value[1].end,at('12:00'));
    }
});
