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
    // The cookie is the credential; do not persist the login token.
    void data;
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
  },

  async currentUser() {
    const response = await api.get('/user/me');
    if (response.data?.error || !response.data?.data?.id) {
      throw new Error('Não foi possível validar sua sessão.');
    }
    return response.data.data as { id: number; name: string; email: string };
  },

  async logout() {
    try {
      await api.post('/user/logout');
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(AUTH_STORAGE_KEY);
  }
};
