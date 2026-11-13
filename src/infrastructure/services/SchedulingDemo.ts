import { ref } from 'vue';
export type AppointmentStatus = 'Pendente' | 'Confirmado' | 'Realizado';
export interface AppointmentProcedure {
    rowKey: string;
    procedureId: number | null;
    procedureIdText: string;
    description: string;
    value: number;
    classification: string;
}

export interface Appointment {
    id: string;
    code: string;
    quotationId?: string;
    accountId?: string;
    status: AppointmentStatus;
    start: string;
    end: string;
    patientId: number | null;
    patientName: string;
    patientCpf: string;
    procedures: AppointmentProcedure[];
}


export const appointments = ref<Appointment[]>([
    {
        id: 'appointment-1',
        code: '#0000001',
        status: 'Confirmado',
        start: '2026-08-18T09:00',
        end: '2026-08-18T10:00',
        patientId: null,
        patientName: 'Maria Santos Souza',
        patientCpf: '555.666.777-88',
        procedures: [
            {
                rowKey: 'appointment-1-item-1',
                procedureId: 1,
                procedureIdText: '#0000001',
                description: 'Limpeza Simples',
                value: 150,
                classification: 'Preventivo'
            }
        ]
    },
    {
        id: 'appointment-2',
        code: '#0000002',
        status: 'Pendente',
        start: '2026-08-18T14:30',
        end: '2026-08-18T15:30',
        patientId: null,
        patientName: 'João Silva Oliveira',
        patientCpf: '111.222.333-44',
        procedures: [
            {
                rowKey: 'appointment-2-item-1',
                procedureId: 2,
                procedureIdText: '#0000002',
                description: 'Clareamento Dental',
                value: 900,
                classification: 'Estetico'
            }
        ]
    }
]);
