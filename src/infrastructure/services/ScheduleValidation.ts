import type { Appointment } from './SchedulingDemo';

// Intervalos adjacentes são permitidos: o fim de um pode ser o início do próximo.
export function findAppointmentConflict(appointments: Appointment[], start: string | Date, end: string | Date, excludeId?: string): Appointment | undefined {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return undefined;
    return appointments.find(appointment => appointment.id !== excludeId
        && startTime < new Date(appointment.end).getTime()
        && endTime > new Date(appointment.start).getTime());
}
