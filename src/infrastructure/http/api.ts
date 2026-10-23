import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:9090',
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && error.config?.url !== '/user/login') {
    localStorage.removeItem('usuario_logado');
    if (error.config?.url !== '/user/me') window.dispatchEvent(new Event('session-expired'));
  }
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
