const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { ref, computed } = require('vue');
const source = fs.readFileSync('src/infrastructure/services/ClinicalHealthAlerts.ts', 'utf8').replaceAll('export ', '');
const context = {};
vm.createContext(context);
vm.runInContext(ts.transpile(source + '\nglobalThis.alerts = getClinicalHealthAlerts;', { target: ts.ScriptTarget.ES2022 }), context);
const record = () => ({ adultAnamnesis: { responses: {} }, pediatricAnamnesis: { responses: {} } });
test('each of the seven requested positive conditions creates an alert', () => {
    for (const key of ['diabetes','epilepsy','hypertension','currentHealthProblem','cardiovascularProblem','bloodProblem','allergy']) {
        const r = record(); r.adultAnamnesis.responses[key] = { answer: 'Sim', details: 'Observação\ncompleta' };
        const alerts = context.alerts(r); assert.equal(alerts.length, 1); assert.equal(alerts[0].details, 'Observação\ncompleta');
    }
});
test('negative, unknown, empty and unrelated answers do not trigger alerts', () => {
    for (const answer of ['Não','Não sei','']) {
        const r = record(); r.adultAnamnesis.responses.diabetes = { answer, details: 'Sim no texto não é resposta positiva' };
        r.adultAnamnesis.responses.smoker = { answer: 'Sim', details: '' };
        assert.equal(context.alerts(r).length, 0);
    }
    assert.equal(context.alerts(null).length, 0);
});
test('pediatric allergy and health problems remain visible alongside adult records', () => {
    const r = record();
    r.adultAnamnesis.responses.diabetes = { answer: 'Sim', details: '' };
    for (const key of ['allergy','childHealthProblems']) r.pediatricAnamnesis.responses[key] = { answer: 'Sim', details: '' };
    assert.equal(context.alerts(r).length, 3);
});
const viewSource = fs.readFileSync('src/presentation/views/PatientRecordView.vue', 'utf8');
const extract = (start, end) => viewSource.slice(viewSource.indexOf(start), viewSource.indexOf(end));

test('selecting a patient closes the previous alert and loads the record from the API', () => {
    const loaded = [];
    const c = { selectedPatient: ref(null), healthAlertVisible: ref(true), patientDialogVisible: ref(true), activeTab: ref('anamnesis'), loadPatientRecord: patient => { loaded.push(patient); return Promise.resolve(); } };
    vm.createContext(c);
    vm.runInContext(ts.transpile(extract('const selectPatient =', 'const confirmPatientSelection =') + '\nglobalThis.select = selectPatient;', { target: ts.ScriptTarget.ES2022 }), c);
    const patient = { id: 1, recordKey: 'patient-1' };
    c.select(patient);
    assert.equal(c.healthAlertVisible.value, false);
    assert.equal(c.patientDialogVisible.value, false);
    assert.equal(c.activeTab.value, 'personal');
    assert.deepEqual(c.selectedPatient.value, patient);
    assert.deepEqual(loaded, [patient]);
});

test('loaded anamnesis opens alerts only for the still-selected patient', async () => {
    const flagged = record(); flagged.adultAnamnesis.responses.allergy = { answer: 'Sim', details: 'Produto informado' };
    const anamneses = { 1: flagged, 2: record() };
    const current = ref(null);
    const selectedPatient = ref(null);
    const c = {
        anamnesisLoading: ref(false), anamnesisError: ref(''), healthAlertVisible: ref(false), selectedPatient,
        AnamnesisService: { details: async id => anamneses[id] },
        applyAnamnesis: value => { current.value = value; },
        isSelected: patient => selectedPatient.value?.recordKey === patient.recordKey,
        getApiErrorCode: () => undefined, getApiErrorMessage: error => error.message, handlePatientNotFound: () => {}
    };
    c.patientHealthAlerts = computed(() => context.alerts(current.value));
    vm.createContext(c);
    vm.runInContext(ts.transpile(extract('const loadAnamnesis =', 'const loadExams =') + '\nglobalThis.load = loadAnamnesis;', { target: ts.ScriptTarget.ES2022 }), c);

    const one = { id: 1, recordKey: 'patient-1' }, two = { id: 2, recordKey: 'patient-2' };
    selectedPatient.value = one;
    await c.load(one, new AbortController().signal);
    assert.equal(c.healthAlertVisible.value, true);
    assert.equal(c.anamnesisLoading.value, false);

    c.healthAlertVisible.value = false;
    selectedPatient.value = two;
    await c.load(two, new AbortController().signal);
    assert.equal(c.healthAlertVisible.value, false);

    // Resposta atrasada de um paciente que não está mais selecionado é descartada.
    await c.load(one, new AbortController().signal);
    assert.equal(c.healthAlertVisible.value, false);
    assert.equal(c.patientHealthAlerts.value.length, 0);
});
