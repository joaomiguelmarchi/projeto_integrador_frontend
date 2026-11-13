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
test('selecting a patient opens relevant alerts and clears the previous patient alert', () => {
    const r = record(); r.adultAnamnesis.responses.allergy = { answer: 'Sim', details: 'Produto informado' };
    const records = ref({ flagged: r, clear: record() });
    const selectedPatient = ref(null);
    const c = { selectedPatient, healthAlertVisible: ref(false), patientDialogVisible: ref(true), activeTab: ref('anamnesis'), ensureClinicalRecord() {} };
    c.patientHealthAlerts = computed(() => context.alerts(records.value[selectedPatient.value?.recordKey] || null));
    const view = fs.readFileSync('src/presentation/views/PatientRecordView.vue','utf8');
    const selection = view.slice(view.indexOf('const selectPatient ='),view.indexOf('const confirmPatientSelection ='));
    vm.createContext(c);
    vm.runInContext(ts.transpile(selection + '\nglobalThis.select = selectPatient;', { target:ts.ScriptTarget.ES2022 }), c);
    c.select({ recordKey:'flagged' }); assert.equal(c.healthAlertVisible.value,true); assert.equal(c.patientDialogVisible.value,false);
    c.healthAlertVisible.value=false; c.select({recordKey:'flagged'}); assert.equal(c.healthAlertVisible.value,true);
    c.select({recordKey:'clear'}); assert.equal(c.healthAlertVisible.value,false); assert.equal(c.patientHealthAlerts.value.length,0);
    c.select({recordKey:'flagged'}); records.value.flagged.adultAnamnesis.responses.allergy.answer='Não'; assert.equal(c.patientHealthAlerts.value.length,0);
});
