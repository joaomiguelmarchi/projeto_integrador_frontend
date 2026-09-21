import type { PatientAccount } from '../../core/entities/Billing'

// Substituir pela consulta de contas geradas por atendimentos concluídos quando a API existir.
// Exemplos isolados: nenhuma alteração é enviada ao servidor ou salva como dado real.
export function createDemoAccounts(): PatientAccount[] {
  const date = (offset: number) => {
    const value = new Date()
    value.setDate(value.getDate() + offset)
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  }
  return [
    { id: 'CTA-001', patientId: 'DEMO-01', patientName: 'Maria Oliveira (exemplo)', phone: '(00) 00000-0000', attendanceId: 'ATD-001', generatedAt: date(-40), status: 'Faturado', procedures: [{ id: 'P1', name: 'Restauração', quantity: 2, unitAmount: 15000 }, { id: 'P2', name: 'Limpeza', quantity: 1, unitAmount: 15000 }], payments: [{ id: '1', dueDate: date(-40), amount: 15000, status: 'Pago' }, { id: '2', dueDate: date(-10), amount: 15000, status: 'Pendente' }, { id: '3', dueDate: date(20), amount: 15000, status: 'Pendente' }] },
    { id: 'CTA-002', patientId: 'DEMO-02', patientName: 'João Santos (exemplo)', phone: '(00) 00000-0000', attendanceId: 'ATD-002', generatedAt: date(-15), status: 'Faturado', procedures: [{ id: 'P3', name: 'Consulta odontológica', quantity: 1, unitAmount: 12000 }], payments: [{ id: '1', dueDate: date(-15), amount: 12000, status: 'Pendente' }] },
    { id: 'CTA-003', patientId: 'DEMO-03', patientName: 'Ana Costa (exemplo)', phone: '(00) 00000-0000', attendanceId: 'ATD-003', generatedAt: date(-2), status: 'Pendente', procedures: [{ id: 'P2', name: 'Limpeza', quantity: 1, unitAmount: 15000 }], payments: [{ id: '1', dueDate: date(7), amount: 15000, status: 'Pendente' }] },
    { id: 'CTA-004', patientId: 'DEMO-01', patientName: 'Maria Oliveira (exemplo)', phone: '(00) 00000-0000', attendanceId: 'ATD-004', generatedAt: date(-60), status: 'Faturado', procedures: [{ id: 'P3', name: 'Consulta odontológica', quantity: 1, unitAmount: 12000 }], payments: [{ id: '1', dueDate: date(-60), amount: 12000, status: 'Pago' }] },
    { id: 'CTA-005', patientId: 'DEMO-04', patientName: 'Pedro Lima (exemplo)', phone: '(00) 00000-0000', attendanceId: 'ATD-005', generatedAt: date(-20), status: 'Inativo', procedures: [{ id: 'P3', name: 'Consulta odontológica', quantity: 1, unitAmount: 12000 }], payments: [{ id: '1', dueDate: date(-20), amount: 12000, status: 'Pendente' }] },
  ]
}
