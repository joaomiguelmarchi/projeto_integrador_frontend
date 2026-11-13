export interface HealthAlertResponse { answer: string; details: string }
export interface ClinicalHealthAlert { key: string; label: string; details: string; source: string }
interface ClinicalHealthRecord {
    adultAnamnesis: { responses: Record<string, HealthAlertResponse> };
    pediatricAnamnesis: { responses: Record<string, HealthAlertResponse> };
}
const adultAlerts = [
    ['diabetes', 'Diabetes'],
    ['epilepsy', 'Disritmia/epilepsia'],
    ['hypertension', 'Hipertensão'],
    ['currentHealthProblem', 'Problema de saúde'],
    ['cardiovascularProblem', 'Problema cardiovascular'],
    ['bloodProblem', 'Problema de sangue'],
    ['allergy', 'Alergia']
] as const;
const pediatricAlerts = [
    ['childHealthProblems', 'Problema de saúde'],
    ['allergy', 'Alergia']
] as const;

// Considera ambos os formulários para que a troca de modelo não oculte alertas registrados.
export function getClinicalHealthAlerts(record: ClinicalHealthRecord | null): ClinicalHealthAlert[] {
    if (!record) return [];
    const collect = (definitions: ReadonlyArray<readonly [string, string]>, responses: Record<string, HealthAlertResponse>, source: string) =>
        definitions.flatMap(([key, label]) => responses[key]?.answer === 'Sim'
            ? [{ key: `${source}-${key}`, label, details: responses[key]?.details ?? '', source }]
            : []);
    return [
        ...collect(adultAlerts, record.adultAnamnesis.responses, 'Adulto'),
        ...collect(pediatricAlerts, record.pediatricAnamnesis.responses, 'Pediátrico')
    ];
}
