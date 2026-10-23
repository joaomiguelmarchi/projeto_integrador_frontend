const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vue = require('vue');
const axios = require('axios');

// Exercise the real Vue handlers and HTTP service, with no writes to the clinical database.
function harness(handler) {
  const calls = [], messages = [];
  const api = axios.create({ adapter: async config => {
    const body = config.data ? JSON.parse(config.data) : undefined;
    calls.push({ method: config.method, url: config.url, body });
    const data = await handler(config, body);
    return { data: { data, error: null }, status: 200, statusText: 'OK', headers: {}, config };
  } });
  const exports = {};
  const service = fs.readFileSync('src/infrastructure/services/QuotationService.ts', 'utf8');
  new Function('require', 'exports', ts.transpileModule(service, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(() => ({ api }), exports);
  const source = fs.readFileSync('src/presentation/views/QuotationView.vue', 'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1].replace(/^import .*;\r?\n/gm, '');
  const deps = { ...vue, onMounted: () => {}, axios, QuotationService: exports.QuotationService,
    PatientService: { list: async () => [] }, ProcedureService: { list: async () => [] },
    useToast: () => ({ add: message => messages.push(message) }), getApiErrorMessage: error => error.message,
    FilterMatchMode: { CONTAINS: 'contains', EQUALS: 'equals' }
  };
  const exposed = 'quotations,loadQuotations,listError,loading,busy,openAddDialog,openEditDialog,currentQuotation,selectedPatient,saveAddedQuotation,saveEditedQuotation,totalMode,quotationPayload,fromApi,syncSelectedPatient,applyProcedureToRow,syncProcedureDescriptionInput,removeProcedureRow,contextMenuSelection,changeQuotationStatus,confirmDeleteQuotation,executeDelete,editDialogVisible,deleteDialogVisible,addDialogVisible,formatDate,validCpf';
  const setup = new Function(...Object.keys(deps), ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText + `\nreturn {${exposed}};`)(...Object.values(deps));
  return { ...setup, calls, messages };
}
const fixture = () => ({ id: 42, code: '#0000042', patientId: 12, patientName: 'Paciente histórico', patientCpf: null, status: 'APROVADO', generationDate: '2026-10-06', totalValue: 75, procedures: [{ id: 1, procedureId: 3, procedureCode: '#0000003', description: 'Consulta histórica', value: 100, classification: 'Prevenção' }] });

test('list loads persisted numeric IDs, codes, status and civil date; failure is distinct from empty', async () => {
  let failed = false;
  const h = harness(() => { if (failed) throw new Error('Sem conexão'); return [fixture()]; });
  await h.loadQuotations();
  assert.equal(h.calls[0].url, '/quotation/list');
  assert.equal(h.quotations.value[0].id, 42);
  assert.equal(h.quotations.value[0].code, '#0000042');
  assert.equal(h.quotations.value[0].status, 'Aprovado');
  assert.equal(h.formatDate(h.quotations.value[0].generationDate), '06/10/2026');
  failed = true;
  await h.loadQuotations();
  assert.equal(h.listError.value, 'Sem conexão');
  assert.equal(h.loading.value, false);
  assert.equal(h.quotations.value.length, 1);
});

test('edit fetches details and preserves linked patient, historical item IDs and manual total', async () => {
  const h = harness((_config, body) => ({ ...fixture(), ...body }));
  await h.openEditDialog(h.fromApi(fixture()));
  assert.equal(h.calls[0].url, '/quotation/details/42');
  h.applyProcedureToRow(h.currentQuotation.value.procedures[0], { id: 3, description: 'Novo catálogo', value: 999, classification: 'Atual' });
  await h.saveEditedQuotation();
  const call = h.calls[1];
  assert.equal(call.url, '/quotation/edit');
  assert.equal(call.method, 'post');
  const expected = fixture();
  delete expected.code;
  delete expected.procedures[0].procedureCode;
  assert.deepEqual(call.body, expected);
  assert.equal(h.editDialogVisible.value, false);
});

test('explicit recalculation sends zero, manual total survives procedure removal', async () => {
  const h = harness(() => fixture());
  await h.openEditDialog(h.fromApi(fixture()));
  h.totalMode.value = 'automatic';
  assert.equal(h.quotationPayload().totalValue, 0);
  h.totalMode.value = 'manual';
  h.removeProcedureRow(h.currentQuotation.value.procedures[0]);
  assert.equal(h.quotationPayload().totalValue, 75);
  assert.deepEqual(h.quotationPayload().procedures, []);
});

test('create sends avulso data and uses saved server code and total', async () => {
  const h = harness((_config, body) => ({ ...fixture(), ...body, totalValue: 10.3 }));
  h.openAddDialog();
  h.selectedPatient.value = 'Visitante';
  h.currentQuotation.value.procedures = [{ rowKey: 'new', procedureId: null, procedureIdText: '', description: 'Avulso', value: 10.3, classification: 'Prevenção' }];
  await h.saveAddedQuotation();
  assert.equal(h.calls[0].url, '/quotation/register');
  assert.equal(h.calls[0].body.totalValue, 0);
  assert.equal(h.calls[0].body.patientId, null);
  assert.equal(h.calls[0].body.status, 'PENDENTE');
  assert.equal(h.calls[0].body.procedures[0].classification, 'Prevenção');
  assert.equal(h.calls[0].body.id, undefined);
  assert.equal(h.quotations.value[0].code, '#0000042');
  assert.equal(h.quotations.value[0].totalValue, 10.3);
});

test('zero total without items and incomplete avulso fail before HTTP request', async () => {
  const h = harness(() => fixture());
  h.openAddDialog();
  h.selectedPatient.value = 'Visitante';
  await h.saveAddedQuotation();
  assert.equal(h.calls.length, 0);
  assert.equal(h.addDialogVisible.value, true);
  h.currentQuotation.value.procedures = [{ rowKey: 'new', procedureId: null, procedureIdText: '', description: 'Avulso', value: 10, classification: '' }];
  await h.saveAddedQuotation();
  assert.equal(h.calls.length, 0);
  assert.equal(h.validCpf('11111111111'), false);
  assert.equal(h.validCpf('52998224725'), true);
});

test('double click creates one request; transport failure keeps form open without automatic retry', async () => {
  let reject;
  const h = harness(() => new Promise((_resolve, r) => { reject = r; }));
  h.openAddDialog();
  h.selectedPatient.value = 'Visitante';
  h.totalMode.value = 'manual';
  h.currentQuotation.value.totalValue = 50;
  const pending = h.saveAddedQuotation();
  await h.saveAddedQuotation();
  assert.equal(h.calls.length, 1);
  reject(new Error('Falha de rede'));
  await pending;
  assert.equal(h.calls.length, 1);
  assert.equal(h.busy.value, false);
  assert.equal(h.addDialogVisible.value, true);
  assert.equal(h.quotations.value.length, 0);
});

test('status PATCH and soft DELETE update only after confirmed success', async () => {
  const h = harness((config, body) => config.method === 'delete' ? true : { ...fixture(), status: body.status });
  h.quotations.value = [h.fromApi(fixture())];
  h.contextMenuSelection.value = h.quotations.value[0];
  await h.changeQuotationStatus('Pendente');
  assert.deepEqual(h.calls[0], { method: 'patch', url: '/quotation/42/status', body: { status: 'PENDENTE' } });
  h.confirmDeleteQuotation(h.quotations.value[0]);
  await h.executeDelete();
  assert.equal(h.calls[1].url, '/quotation/delete/42');
  assert.equal(h.calls[1].method, 'delete');
  assert.equal(h.quotations.value[0].status, 'Inativo');
  assert.equal(h.quotations.value.length, 1);
});

test('409 closes stale edit and reloads list before another attempt', async () => {
  const h = harness(config => {
    if (config.url === '/quotation/edit') throw new axios.AxiosError('Conflito', 'ERR_BAD_REQUEST', config, null, { status: 409 });
    return config.url === '/quotation/list' ? [fixture()] : fixture();
  });
  await h.openEditDialog(h.fromApi(fixture()));
  await h.saveEditedQuotation();
  assert.equal(h.editDialogVisible.value, false);
  assert.equal(h.calls.at(-1).url, '/quotation/list');
  assert.equal(h.busy.value, false);
});
