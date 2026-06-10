import axios from 'axios';
import { api } from '../http/api';

export interface ApiPatient {
  id?: number | null;
  name?: string | null;
  email?: string | null;
  birthday?: string | null;
  age?: number | null;
  sex?: string | null;
  responsible?: string | null;
  document?: string | null;
  address?: string | null;
  addressesNumber?: string | null;
  homePhoneNumber?: string | null;
  commercialPhoneNumber?: string | null;
  phoneNumber?: string | null;
  occupation?: string | null;
}

interface DefaultError {
  code?: string;
  message?: string;
}

interface DefaultResponse<T> {
  data?: T | null;
  error?: DefaultError | string | null;
}

const getResponseErrorMessage = (error?: DefaultError | string | null) => {
  if (!error) return 'Operacao nao concluida.';
  if (typeof error === 'string') return error;
  return error.message || error.code || 'Operacao nao concluida.';
};

const unwrapResponse = <T>(payload: DefaultResponse<T>) => {
  if (payload.error) {
    throw new Error(getResponseErrorMessage(payload.error));
  }

  return payload.data as T;
};

export const getPatientServiceErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<DefaultResponse<unknown>>(error)) {
    const data = error.response?.data;

    if (typeof data === 'string') {
      return data;
    }

    return getResponseErrorMessage(data?.error) || 'Nao foi possivel conectar ao servidor.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Nao foi possivel conectar ao servidor.';
};

export const PatientService = {
  async list() {
    const response = await api.get<DefaultResponse<ApiPatient[]>>('/patient/list');
    return unwrapResponse(response.data) ?? [];
  },

  async register(patient: ApiPatient) {
    const response = await api.post<DefaultResponse<ApiPatient>>('/patient/register', patient);
    return unwrapResponse(response.data);
  },

  async edit(patient: ApiPatient) {
    const response = await api.post<DefaultResponse<ApiPatient>>('/patient/edit', patient);
    return unwrapResponse(response.data);
  },

  async delete(id: number) {
    const response = await api.delete<DefaultResponse<boolean>>(`/patient/delete/${id}`);
    return unwrapResponse(response.data);
  }
};
