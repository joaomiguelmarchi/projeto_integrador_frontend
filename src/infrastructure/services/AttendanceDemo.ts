import { accounts } from './BillingDemo';
import { appointments } from './SchedulingDemo';
import type { PatientAccount } from '../../core/entities/Billing';

// Integração demonstrativa em memória; substituir por uma operação atômica da API.
export function completeAppointment(id: string): PatientAccount {
    const appointment = appointments.value.find(item => item.id === id);
    if (!appointment) throw new Error('Agendamento não encontrado.');
    const existing = accounts.value.find(account => account.id === appointment.accountId || account.attendanceId === appointment.id);
    if (existing) return existing;
    if (appointment.status !== 'Confirmado' || appointment.accountId) {
        throw new Error('Somente agendamentos confirmados podem ser realizados.');
    }
    if (!appointment.patientName.trim() || !appointment.procedures.length || appointment.procedures.some(p => !p.description.trim() || !Number.isFinite(p.value) || p.value < 0)) {
        throw new Error('Revise o paciente, os procedimentos e os valores do agendamento antes de realizar o atendimento.');
    }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const procedures = appointment.procedures.map(p => ({ id: p.rowKey, name: p.description, quantity: 1, unitAmount: Math.round(p.value * 100) }));
    const total = procedures.reduce((sum, p) => sum + p.unitAmount, 0);
    const account: PatientAccount = {
        id: `CTA-${crypto.randomUUID()}`,
        patientId: appointment.patientId !== null ? String(appointment.patientId) : appointment.patientCpf.replace(/\D/g, '') || `PAC-${appointment.id}`,
        patientName: appointment.patientName,
        phone: '',
        attendanceId: appointment.id,
        generatedAt: today,
        status: 'Pendente',
        procedures,
        payments: [{ id: crypto.randomUUID(), dueDate: today, amount: total, status: 'Pendente' }]
    };
    accounts.value.unshift(account);
    appointment.accountId = account.id;
    appointment.status = 'Realizado';
    return account;
}
