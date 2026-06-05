import { api } from '../http/api';

const TOKEN_STORAGE_KEY = 'auth_token';
const TOKEN_COOKIE_NAME = 'token';

const getTokenFromResponse = (data: any): string | null => {
  return data?.token || data?.accessToken || data?.data?.token || null;
};

const setTokenCookie = (token: string) => {
  document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; SameSite=Lax`;
};

export const AuthService = {
  async login(email: string, senha: string) {
    try {
      const response = await api.post('/user/login', {
        email: email,      
        password: senha     
      });

      const token = getTokenFromResponse(response.data);

      // if (token) {
      //   localStorage.setItem(TOKEN_STORAGE_KEY, token);
      //   setTokenCookie(token);
      // }

      return { 
        sucesso: true,
        token
      };

    } catch (error: any) {

      console.error('=== [ERRO] Falha na Requisição ===', error);
      console.log('Detalhes do Erro (Data):', error.response?.data);
      console.log('Status HTTP:', error.response?.status);

      const mensagemErro = error.response?.data?.error || 'Erro inesperado!';
      
      return { 
        sucesso: false, 
        mensagem: mensagemErro 
      };
    }
  }
};
