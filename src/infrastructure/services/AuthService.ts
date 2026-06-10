import { api } from '../http/api';

const AUTH_STORAGE_KEY = 'usuario_logado';

const getErrorMessage = (error: any) => {
  const data = error.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  return data?.error?.message
    || data?.error
    || data?.message
    || (error.response ? 'Não foi possível realizar o login com os dados informados.' : 'Não foi possível conectar ao servidor.');
};

export const AuthService = {
  async login(email: string, senha: string) {
    try {
      const response = await api.post('/user/login', {
        email,
        password: senha
      });

      return {
        sucesso: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: getErrorMessage(error)
      };
    }
  },

  saveSession(data?: unknown) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data ?? true));
  },

  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  isAuthenticated() {
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  },
  
  getUser() {
  const data = localStorage.getItem(AUTH_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

};