import { api } from '../http/api';

import { SessionStore, type EndReason } from './SessionStore';
let revoking: Promise<boolean> | null = null;

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
      if (revoking) await revoking;
      while (Number(localStorage.getItem('smilehub.logout.pending')) > Date.now()) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      const response = await api.post('/user/login', {
        email,
        password: senha
      });

      if (response.data?.error) throw new Error(response.data.error.message || 'Não foi possível autenticar.');
      const expiration = Number(response.data?.data?.expiration);
      if (!Number.isFinite(expiration) || expiration <= 0) throw new Error('Resposta de autenticação inválida.');
      SessionStore.start(expiration);
      return {
        sucesso: true,
        data: undefined
      };
    } catch (error: any) {
      return {
        sucesso: false,
        mensagem: error.response ? getErrorMessage(error) : error.message || getErrorMessage(error)
      };
    }
  },

  revoke() {
    if (!revoking) {
      localStorage.setItem('smilehub.logout.pending', String(Date.now() + 9000));
      revoking = api.post('/user/logout', null, { timeout: 8000 }).then(response => !response.data?.error).catch(error => error.response?.status === 401).finally(() => {
        localStorage.removeItem('smilehub.logout.pending');
        revoking = null;
      });
    }
    return revoking;
  },
  logout(reason: EndReason = 'logout') { SessionStore.end(reason); },
  isAuthenticated() { return SessionStore.valid(); },
  async currentUser() {
    const response = await api.get('/user/me');
    if (response.data?.error || !response.data?.data?.id) {
      throw new Error('Não foi possível validar sua sessão.');
    }
    return response.data.data as { id: number; name: string; email: string };
  },
  async validateSession() {
    if (!SessionStore.valid()) return false;
    const response = await api.get('/user/me');
    if (response.data?.error || !response.data?.data?.id) {
      SessionStore.end('expired');
      return false;
    }
    return SessionStore.valid();
  }
};
