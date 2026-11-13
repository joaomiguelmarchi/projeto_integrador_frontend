import { api } from '../http/api';

export type ApiAppointmentStatus = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO';
export interface ApiAppointmentProcedure {
  id?: number | null;
  procedureId: number | null;
  procedureCode?: string | null;
  description: string;
  value: number;
  classification: string;
}
export interface ApiAppointment {
  id: number;
  code: string;
  status: ApiAppointmentStatus;
  start: string;
  end: string;
  title: string | null;
  patientId: number | null;
  patientName: string;
  patientCpf: string | null;
  professionalUserId: number | null;
  notes: string | null;
  procedures: ApiAppointmentProcedure[];
}
export type AppointmentInput = Omit<ApiAppointment, 'id' | 'code' | 'procedures'> & {
  procedures: Array<ApiAppointmentProcedure | { procedureId: number }>;
};
interface Envelope<T> { data: T; error?: { message?: string } | null }
function unwrap<T>(response: { data: Envelope<T> }): T {
  if (response.data?.error || response.data?.data == null) {
    throw new Error(response.data?.error?.message || 'Resposta inesperada da API.');
  }
  return response.data.data;
}
export const AppointmentService = {
  async list(start: string, end: string, signal?: AbortSignal) {
    return unwrap(await api.get<Envelope<ApiAppointment[]>>('/appointment/list', { params: { start, end }, signal }));
  },
  async details(id: string) {
    return unwrap(await api.get<Envelope<ApiAppointment>>(`/appointment/details/${id}`));
  },
  async create(body: AppointmentInput) {
    return unwrap(await api.post<Envelope<ApiAppointment>>('/appointment/register', body));
  },
  async edit(id: string, body: AppointmentInput) {
    return unwrap(await api.post<Envelope<ApiAppointment>>('/appointment/edit', { ...body, id: Number(id) }));
  },
  async cancel(id: string) {
    return unwrap(await api.delete<Envelope<boolean>>(`/appointment/delete/${id}`));
  },
  async status(id: string, status: ApiAppointmentStatus) {
    return unwrap(await api.patch<Envelope<ApiAppointment>>(`/appointment/${id}/status`, { status }));
  },
  async schedule(id: string, start: string, end: string) {
    return unwrap(await api.patch<Envelope<ApiAppointment>>(`/appointment/${id}/schedule`, { start, end }));
  },
};
