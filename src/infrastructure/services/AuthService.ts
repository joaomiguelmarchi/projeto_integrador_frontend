import { api } from '../http/api';

export const AuthService = {
  async login(email: string, senha: string) {
    try {
      const response = await api.post('/user/login', {
        email: email,      
        password: senha     
      });

      return { 
        sucesso: true 
      };

    } catch (error: any) {
      const mensagemErro = error.response?.data?.error?.message || 'Erro inesperado no servidor.';
      
      return { 
        sucesso: false, 
        mensagem: mensagemErro 
      };
    }
  }
};