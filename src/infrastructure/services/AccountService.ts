import { api } from '../http/api';

export type AccountApiStatus = 'PENDENTE' | 'FATURADO' | 'INATIVO';
export interface ApiAccountProcedure {
  id: number;
  procedureId: number | null;
  description: string;
  quantity: number;
  unitValue: number;
}
export interface ApiAccountPayment {
  id: number;
  installmentNumber: number;
  dueDate: string;
  value: number;
  status: 'PENDENTE' | 'PAGO';
  paidAt: string | null;
}
export interface ApiAccount {
  id: number;
  code: string;
  status: AccountApiStatus;
  generatedAt: string;
  invoicedAt: string | null;
  patientId: number | null;
  patientName: string;
  patientPhone: string | null;
  appointmentId: number | null;
  appointmentCode: string | null;
  totalValue: number;
  paidValue: number;
  openValue: number;
  overdueValue: number;
  procedures: ApiAccountProcedure[];
  payments: ApiAccountPayment[];
}
export interface InvoiceInput {
  installments?: number;
  firstDueDate?: string;
}

interface Envelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}
function unwrap<T>(body: Envelope<T>): T {
  if (body?.error) throw new Error(body.error.message);
  if (body?.data == null) throw new Error('Resposta inesperada da API de faturamento.');
  return body.data;
}

export const AccountService = {
  async list(params: { status?: AccountApiStatus; patientId?: number } = {}) {
    const result = unwrap((await api.get<Envelope<ApiAccount[]>>('/account/list', { params })).data);
    if (!Array.isArray(result)) throw new Error('Resposta inesperada ao listar contas.');
    return result;
  },
  async details(id: number) {
    return unwrap((await api.get<Envelope<ApiAccount>>(`/account/details/${id}`)).data);
  },
  async invoice(id: number, body?: InvoiceInput) {
    return unwrap((await api.patch<Envelope<ApiAccount>>(`/account/${id}/invoice`, body)).data);
  },
  async pay(id: number, paymentId: number, paidAt?: string) {
    return unwrap((await api.patch<Envelope<ApiAccount>>(`/account/${id}/payments/${paymentId}/pay`, paidAt ? { paidAt } : undefined)).data);
  },
  async inactivate(id: number) {
    const result = unwrap((await api.delete<Envelope<boolean>>(`/account/delete/${id}`)).data);
    if (result !== true) throw new Error('A inativação não foi confirmada pelo servidor.');
    return result;
  }
};
