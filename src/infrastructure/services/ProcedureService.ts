import axios from 'axios';
import { api } from '../http/api';

export interface ApiProcedure {
  id?: number | null;
  statusCode?: number | null;
  name?: string | null;
  value?: number | null;
  type?: string | null;
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

export const getProcedureServiceErrorMessage = (error: unknown) => {
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

export const ProcedureService = {
  async list() {
    const response = await api.get<DefaultResponse<ApiProcedure[]>>('/procedure/list');
    return unwrapResponse(response.data) ?? [];
  },

  async register(procedure: ApiProcedure) {
    const response = await api.post<DefaultResponse<ApiProcedure>>('/procedure/register', procedure);
    return unwrapResponse(response.data);
  },

  async edit(procedure: ApiProcedure) {
    const response = await api.post<DefaultResponse<ApiProcedure>>('/procedure/edit', procedure);
    return unwrapResponse(response.data);
  },

  async delete(id: number) {
    const response = await api.delete<DefaultResponse<boolean>>(`/procedure/delete/${id}`);
    return unwrapResponse(response.data);
  }
};
