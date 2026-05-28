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