import axios from 'axios';
import { SessionStore } from '../services/SessionStore';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:9090',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});
const publicPaths = new Set(['/user/login', '/user/logout', '/user/create', '/user/recover_password', '/user/password-recovery/request', '/user/password-recovery/reset']);
const requestSessions = new WeakMap<object, string>();
api.interceptors.request.use(config => {
  if (!publicPaths.has(config.url || '')) {
    if (!SessionStore.valid()) throw new axios.CanceledError('Sessão encerrada. Faça login novamente.');
    requestSessions.set(config, SessionStore.read()!.id);
  }
  return config;
});
api.interceptors.response.use(response => {
  const id = requestSessions.get(response.config);
  if (id && (SessionStore.read()?.id !== id || !SessionStore.valid())) throw new axios.CanceledError('Resposta de uma sessão encerrada.');
  return response;
}, error => {
  const id = error.config && requestSessions.get(error.config);
  if (error.response?.status === 401 && id && SessionStore.read()?.id === id) SessionStore.end('expired');
  return Promise.reject(error);
});

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) return 'Sua sessão expirou. Entre novamente.';
    if (status === 403) return 'Você não tem permissão para esta operação.';
    const message = error.response?.data?.error?.message;
    if (typeof message === 'string') return message;
    return error.response ? 'Não foi possível concluir a operação. Tente novamente.' : 'Não foi possível conectar ao servidor. Verifique sua conexão.';
  }
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
};
