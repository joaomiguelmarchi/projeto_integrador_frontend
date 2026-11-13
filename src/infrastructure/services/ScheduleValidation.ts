export interface SchedulableAppointment {
    id: string;
    status: string;
    start: string;
    end: string;
}

// Intervalos adjacentes são permitidos: o fim de um pode ser o início do próximo.
// Atendimentos cancelados liberam o horário.
export function findAppointmentConflict<T extends SchedulableAppointment>(appointments: T[], start: string | Date, end: string | Date, excludeId?: string): T | undefined {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return undefined;
    return appointments.find(appointment => appointment.id !== excludeId
        && appointment.status !== 'Cancelado'
        && startTime < new Date(appointment.end).getTime()
        && endTime > new Date(appointment.start).getTime());
}
