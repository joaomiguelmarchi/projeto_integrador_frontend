export type AccountStatus = 'Faturado' | 'Pendente' | 'Inativo'
export interface Payment {
  id: string
  dueDate: string
  amount: number // Centavos para evitar arredondamento financeiro.
  status: 'Pago' | 'Pendente'
}
export interface PatientAccount {
  id: string
  patientId: string
  patientName: string
  phone: string
  attendanceId: string
  generatedAt: string
  status: AccountStatus
  procedures: { id: string; name: string; quantity: number; unitAmount: number }[]
  payments: Payment[]
}
export const accountTotal = (account: PatientAccount) => account.procedures.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0)
export const outstandingTotal = (account: PatientAccount) => account.payments.reduce((sum, payment) => sum + (payment.status === 'Pendente' ? payment.amount : 0), 0)
export const isOverdue = (payment: Payment, today: string) => payment.status === 'Pendente' && payment.dueDate < today
export const overdueTotal = (account: PatientAccount, today: string) => account.payments.reduce((sum, payment) => sum + (isOverdue(payment, today) ? payment.amount : 0), 0)
