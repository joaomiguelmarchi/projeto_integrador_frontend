import { ref } from 'vue';
export interface QuotationProcedure {
    rowKey: string;
    procedureId: number | null;
    procedureIdText: string;
    description: string;
    value: number;
    classification: string;
}

export interface Quotation {
    id: string;
    patientId: number | null;
    status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Inativo';
    generationDate: string;
    patientName: string;
    patientCpf: string;
    totalValue: number;
    procedures: QuotationProcedure[];
}


export const quotationsMock = ref<Quotation[]>([
    {
        id: '#0000001',
        patientId: null,
        status: 'Pendente',
        generationDate: '2026-05-20',
        patientName: 'Joao Silva Oliveira',
        patientCpf: '111.222.333-44',
        totalValue: 1050.00,
        procedures: [
            { rowKey: 'mock-1-p1', procedureId: 1, procedureIdText: '#0000001', description: 'Limpeza Simples', value: 150.00, classification: 'Preventivo' },
            { rowKey: 'mock-1-p2', procedureId: 2, procedureIdText: '#0000002', description: 'Clareamento Dental', value: 900.00, classification: 'Estetico' }
        ]
    },
    { id: '#0000002', patientId: null, status: 'Aprovado', generationDate: '2026-05-18', patientName: 'Maria Santos Souza', patientCpf: '555.666.777-88', totalValue: 2450.00, procedures: [] },
    { id: '#0000003', patientId: null, status: 'Rejeitado', generationDate: '2026-05-15', patientName: 'Lucas Ferreira', patientCpf: '321.654.987-11', totalValue: 600.00, procedures: [] },
    { id: '#0000004', patientId: null, status: 'Inativo', generationDate: '2026-05-10', patientName: 'Ana Costa', patientCpf: '123.456.789-00', totalValue: 1350.00, procedures: [] },
    { id: '#0000005', patientId: null, status: 'Pendente', generationDate: '2026-05-24', patientName: 'Pedro Almeida', patientCpf: '999.888.777-66', totalValue: 450.00, procedures: [] }
]);
