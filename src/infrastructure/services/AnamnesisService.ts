import { api } from '../http/api';

export type ApiAnamnesisType = 'ADULTO' | 'PEDIATRICO';
export type ApiHealthAnswer = 'SIM' | 'NAO' | 'NAO_SEI' | 'POUCO' | 'PEITO' | 'MAMADEIRA';
export interface ApiQuestionResponse { answer: ApiHealthAnswer | null; details: string }
export type ApiResponses = Record<string, ApiQuestionResponse>;

export interface ApiAdultAnamnesis {
  mainComplaint: string;
  brushingFrequency: string;
  flossUse: string;
  responses: ApiResponses;
}
export interface ApiPediatricAnamnesis {
  mainComplaint: string;
  siblingsCount: string;
  mainCaregiver: string;
  preferredActivity: string;
  attends: { school: boolean; daycare: boolean; afterSchool: boolean };
  schoolPeriod: string;
  brushing: string;
  brushingFrequency: string;
  flossUse: string;
  schoolServices: { medicalCare: boolean; dentalCare: boolean; food: boolean };
  firstDentistVisit: 'SIM' | 'NAO' | null;
  lastDentistVisit: string;
  responses: ApiResponses;
}
export interface ApiAnamnesis {
  id: number | null;
  patientId: number;
  selectedType: ApiAnamnesisType;
  updatedAt: string | null;
  updatedByName: string | null;
  adult: ApiAdultAnamnesis;
  pediatric: ApiPediatricAnamnesis;
}
/** Corpo do save: estado COMPLETO dos dois modelos (o save substitui a anamnese inteira). */
export type AnamnesisInput = Omit<ApiAnamnesis, 'id' | 'updatedAt' | 'updatedByName'>;

interface Envelope<T> { data: T; error?: { message?: string } | null }
function unwrap<T>(response: { data: Envelope<T> }): T {
  if (response.data?.error || response.data?.data == null) {
    throw new Error(response.data?.error?.message || 'Resposta inesperada da API.');
  }
  return response.data.data;
}

export const AnamnesisService = {
  async details(patientId: number, signal?: AbortSignal) {
    return unwrap(await api.get<Envelope<ApiAnamnesis>>(`/anamnesis/details/${patientId}`, { signal }));
  },
  async save(body: AnamnesisInput) {
    return unwrap(await api.post<Envelope<ApiAnamnesis>>('/anamnesis/save', body));
  },
};
