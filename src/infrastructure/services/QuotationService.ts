import { api } from '../http/api';

export type QuotationStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'INATIVO';
export interface QuotationItem {
  id?: number;
  procedureId: number | null;
  procedureCode?: string | null;
  description: string;
  value: number;
  classification: string;
}
export interface QuotationInput {
  patientId: number | null;
  patientName: string;
  patientCpf: string | null;
  status: QuotationStatus;
  generationDate: string;
  totalValue: number;
  procedures: QuotationItem[];
}
export interface ApiQuotation extends QuotationInput {
  id: number;
  code: string;
}

interface Envelope<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}
function unwrap<T>(body: Envelope<T>): T {
  if (body?.error) throw new Error(body.error.message);
  if (body?.data == null) throw new Error('Resposta inesperada da API de orçamentos.');
  return body.data;
}

export const QuotationService = {
  async list() {
    const result = unwrap((await api.get<Envelope<ApiQuotation[]>>('/quotation/list')).data);
    if (!Array.isArray(result)) throw new Error('Resposta inesperada ao listar orçamentos.');
    return result;
  },
  async details(id: number) {
    return unwrap((await api.get<Envelope<ApiQuotation>>(`/quotation/details/${id}`)).data);
  },
  async create(body: QuotationInput) {
    return unwrap((await api.post<Envelope<ApiQuotation>>('/quotation/register', body)).data);
  },
  async edit(body: QuotationInput & { id: number }) {
    return unwrap((await api.post<Envelope<ApiQuotation>>('/quotation/edit', body)).data);
  },
  async changeStatus(id: number, status: QuotationStatus) {
    return unwrap((await api.patch<Envelope<ApiQuotation>>(`/quotation/${id}/status`, { status })).data);
  },
  async inactivate(id: number) {
    const result = unwrap((await api.delete<Envelope<boolean>>(`/quotation/delete/${id}`)).data);
    if (result !== true) throw new Error('A inativação não foi confirmada pelo servidor.');
    return result;
  }
};
