import { api } from '../http/api';

export const AuthService = {
  async login(email: string, senha: string) {
    try {
      const response = await api.post('/user/login', {
        email: email,      
        password: senha     
      });

      // Se passou pelo backend sem cair no BadRequest (400), o login foi sucesso
      // O navegador já salvou o cookie automaticamente neste momento!
      return { 
        sucesso: true 
      };

    } catch (error: any) {
      // Pega a mensagem de erro que vem do seu DefaultError (ex: "Credenciais invalidas")
      const mensagemErro = error.response?.data?.error?.message || 'Erro inesperado no servidor.';
      
      return { 
        sucesso: false, 
        mensagem: mensagemErro 
      };
    }
  }
};