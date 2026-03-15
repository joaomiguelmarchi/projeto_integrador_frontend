import type { User } from '../../core/entities/User';

export const AuthService = {
  async login(user: string, senha: string): Promise<User> {

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (user === 'admin' && senha === '123') {
          resolve({
            id: '1',
            name: 'Dentista Admin',
            token: 'simulacao-jwt-token-12345'
          });
        } else {
          reject(new Error('Usuário ou senha incorretos!'));
        }
      }, 1500); 
    });
  }
};