const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const axios = require('axios');

// Execute the real setup handlers with Vue reactivity and an isolated HTTP adapter.
// This covers transport/payload and failure behavior without a live clinical database.
function harness(handler) {
  const calls = [], messages = [];
  const api = axios.create({ adapter: async config => {
    const body = config.data ? JSON.parse(config.data) : undefined;
    calls.push({ method: config.method, url: config.url, body, params: config.params });
    const data = await handler(config, body);
    return { data: { data, error: null }, status: 200, statusText: 'OK', headers: {}, config };
  } });
  const serviceSource = fs.readFileSync('src/infrastructure/services/AppointmentService.ts', 'utf8');
  const exports = {};
  new Function('require', 'exports', ts.transpileModule(serviceSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(() => ({ api }), exports);
  const patientExports = {};
  const patientSource = fs.readFileSync('src/infrastructure/services/PatientService.ts', 'utf8');
  new Function('require', 'exports', ts.transpileModule(patientSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(id => id === 'axios' ? axios : { api }, patientExports);
  const source = fs.readFileSync('src/presentation/views/ScheduleView.vue', 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
    .replace(/^import .*;\r?\n/gm, '').replace('import.meta.env.VITE_CLINIC_TIMEZONE', "'America/Sao_Paulo'");
  const deps = { ...vue, onMounted: () => {}, onBeforeUnmount: () => {}, axios, PatientService: patientExports.PatientService, AppointmentService: exports.AppointmentService, useToast: () => ({ add: m => messages.push(m) }), getApiErrorMessage: e => e.message,
    classicThemePlugin: {}, dayGridPlugin: {}, timeGridPlugin: {}, interactionPlugin: {}, listPlugin: {}, ptBrLocale: {},
  };
  const exposed = 'loadPatients,searchPatients,patientSuggestions,patientsLoading,patientsError,openAddDialog,fromApi,toApi,currentAppointment,selectedPatient,saveAppointment,appointmentDialogVisible,dialogMode,syncSelectedPatient,applyPatientToAppointment,applyProcedureToRow,updateAppointmentSchedule,appointments,calendarOptions,loadAppointments,loadError,loading,contextMenuSelection,deleteSelectedAppointment,updateSelectedAppointmentStatus,dateToInputValue';
  const setup = new Function(...Object.keys(deps), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + `\nreturn {${exposed}};`)(...Object.values(deps));
  return { ...setup, calls, messages };
}
const fixture = () => ({ id: 42, code: '#0000042', status: 'CONFIRMADO', start: '2026-10-10T09:00:00', end: '2026-10-10T10:00:00', patientId: 12, patientName: 'Paciente de teste', patientCpf: null, title: 'Retorno', professionalUserId: 7, notes: 'Histórico', procedures: [{ id: 1, procedureId: 3, description: 'Descrição histórica', value: 100, classification: 'Prevenção' }] });

test('opening appointment fetches patients again and pending search uses backend results', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; }));
  h.openAddDialog();
  const search = h.searchPatients({ query: 'Ana' });
  assert.equal(h.patientsLoading.value, true);
  assert.equal(h.calls[0].url, '/patient/list');
  resolve([{ id: 1, name: 'Ana', statusCode: 0 }, { id: 2, name: 'Ana Inativa', statusCode: 1 }]);
  await search;
  assert.deepEqual(h.patientSuggestions.value.map(p => p.id), [1]);
  h.openAddDialog();
  assert.equal(h.calls.length, 2);
  resolve([{ id: 3, name: 'Novo cadastro', statusCode: 0 }]);
  await h.loadPatients();
  assert.deepEqual(h.patientSuggestions.value.map(p => p.id), [3]);
});

test('patient request failure is visible and retry populates options', async () => {
  let failed = true;
  const h = harness(() => { if (failed) throw new Error('Backend indisponível'); return [{ id: 1, name: 'Ana', statusCode: 0 }]; });
  await h.loadPatients();
  assert.equal(h.patientsError.value, 'Backend indisponível');
  assert.equal(h.patientsLoading.value, false);
  failed = false;
  await h.loadPatients();
  assert.equal(h.patientsError.value, '');
  assert.equal(h.patientSuggestions.value.length, 1);
});

test('patients with omitted or null status remain selectable while inactive patients are excluded', async () => {
  const h = harness(() => [
    { id: 4, name: 'Paciente sem status', document: '12345678910' },
    { id: 5, name: 'Paciente ativo', statusCode: 0 },
    { id: 6, name: 'Paciente legado', statusCode: null },
    { id: 7, name: 'Paciente inativo', statusCode: 1 },
  ]);
  await h.loadPatients();
  assert.deepEqual(h.patientSuggestions.value.map(p => p.id), [4, 5, 6]);
  await h.searchPatients({ query: 'sem status' });
  assert.deepEqual(h.patientSuggestions.value.map(p => p.id), [4]);
  h.applyPatientToAppointment(h.patientSuggestions.value[0]);
  assert.equal(h.currentAppointment.value.patientId, 4);
  assert.equal(h.currentAppointment.value.patientName, 'Paciente sem status');
  assert.equal(h.currentAppointment.value.patientCpf, '123.456.789-10');
});
function edit(h) {
  h.currentAppointment.value = h.fromApi(fixture());
  h.dialogMode.value = 'edit';
  h.appointmentDialogVisible.value = true;
  h.syncSelectedPatient();
}

test('editing notes preserves inactive patient, professional and historical procedure item', async () => {
  const h = harness((_c, body) => ({ ...fixture(), ...body }));
  edit(h);
  h.currentAppointment.value.notes = 'Nova observação';
  await h.saveAppointment();
  assert.equal(h.calls[0].url, '/appointment/edit');
  const expected = { ...fixture(), notes: 'Nova observação' };
  delete expected.code;
  assert.deepEqual(h.calls[0].body, expected);
});

test('new catalogue items send catalogue ID; selected historical items keep original snapshot', () => {
  const h = harness(() => []);
  const item = h.fromApi(fixture());
  h.applyProcedureToRow(item.procedures[0], { id: 3, description: 'Preço novo', value: 999, classification: 'Novo', displayId: '#3' });
  assert.equal(item.procedures[0].value, 100);
  item.procedures.push({ procedureId: 4, description: 'Catálogo', value: 200, classification: 'Teste' });
  assert.deepEqual(h.toApi(item).procedures[1], { procedureId: 4 });
});

test('switching patient updates derived name, CPF and title', () => {
  const h = harness(() => []); edit(h);
  h.applyPatientToAppointment({ id: 15, name: 'Outro paciente', cpf: '123' });
  assert.equal(h.currentAppointment.value.title, 'Outro paciente');
  assert.equal(h.currentAppointment.value.patientCpf, '123');
  assert.equal(h.currentAppointment.value.patientId, 15);
});

test('creation uses server ID and sends local time without UTC suffix', async () => {
  const h = harness((_c, body) => ({ ...fixture(), ...body })); edit(h);
  h.dialogMode.value = 'add';
  h.currentAppointment.value.start = '2026-10-10T09:00';
  await h.saveAppointment();
  assert.equal(h.calls[0].url, '/appointment/register');
  assert.equal(h.calls[0].body.start, '2026-10-10T09:00:00');
  assert.equal(h.calls[0].body.id, undefined);
  assert.equal(h.appointments.value[0].id, '42');
  assert.equal(h.dateToInputValue(new Date('2026-10-10T12:00:00Z')), '2026-10-10T09:00:00');
});

test('saving twice while pending only creates one request', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; })); edit(h);
  const first = h.saveAppointment();
  await h.saveAppointment();
  assert.equal(h.calls.length, 1);
  resolve(fixture()); await first;
});

test('save failure leaves form open and does not report success', async () => {
  const h = harness(() => { throw new Error('Falha de rede'); }); edit(h);
  await h.saveAppointment();
  assert.equal(h.appointmentDialogVisible.value, true);
  assert.equal(h.messages.some(m => m.severity === 'success'), false);
});

test('rejected reschedule reverts the event', async () => {
  const h = harness(() => { throw new axios.AxiosError('Conflito', 'ERR_BAD_REQUEST', {}, {}, { status: 409 }); });
  let reverted = false;
  await h.updateAppointmentSchedule({ event: { id: '42', start: new Date('2026-10-10T12:00Z'), end: new Date('2026-10-10T13:00Z') }, revert: () => { reverted = true; } });
  assert.equal(reverted, true);
  assert.equal(h.calls[0].url, '/appointment/42/schedule');
  assert.deepEqual(h.calls[0].body, { start: '2026-10-10T09:00:00', end: '2026-10-10T10:00:00' });
});

test('cancel keeps appointment in list with cancelled status', async () => {
  const h = harness(() => true);
  h.appointments.value = [h.fromApi(fixture())];
  h.contextMenuSelection.value = h.appointments.value[0];
  await h.deleteSelectedAppointment();
  assert.equal(h.calls[0].method, 'delete');
  assert.equal(h.appointments.value.length, 1);
  assert.equal(h.appointments.value[0].status, 'Cancelado');
});

test('status action sends uppercase enum through PATCH', async () => {
  const h = harness((_c, body) => ({ ...fixture(), ...body }));
  h.contextMenuSelection.value = h.fromApi(fixture());
  await h.updateSelectedAppointmentStatus('Realizado');
  assert.equal(h.calls[0].method, 'patch');
  assert.deepEqual(h.calls[0].body, { status: 'REALIZADO' });
});

test('period navigation ignores stale response and includes visible boundaries', async () => {
  const pending = [];
  const h = harness(() => new Promise(r => pending.push(r)));
  h.calendarOptions.value.datesSet({ start: new Date('2026-10-01T03:00Z'), end: new Date('2026-11-01T03:00Z') });
  h.calendarOptions.value.datesSet({ start: new Date('2026-11-01T03:00Z'), end: new Date('2026-12-01T03:00Z') });
  assert.deepEqual(h.calls[1].params, { start: '2026-11-01T00:00:00', end: '2026-12-01T00:00:00' });
  pending[1]([]); await new Promise(setImmediate);
  pending[0]([fixture()]); await new Promise(setImmediate);
  assert.deepEqual(h.appointments.value, []);
  assert.equal(h.loadError.value, '');
});

test('successful save followed by failed list reload reports saved and never retries create', async () => {
  let failing = false;
  const h = harness((config, body) => {
    if (config.method === 'get') { if (failing) throw new Error('Lista indisponível'); return []; }
    failing = true; return { ...fixture(), ...body };
  });
  h.calendarOptions.value.datesSet({ start: new Date('2026-10-01T03:00Z'), end: new Date('2026-11-01T03:00Z') });
  await new Promise(setImmediate); edit(h); h.dialogMode.value = 'add';
  await h.saveAppointment();
  assert.equal(h.calls.filter(c => c.method === 'post').length, 1);
  assert.equal(h.appointmentDialogVisible.value, false);
  assert.equal(h.messages.some(m => m.severity === 'warn'), true);
});
