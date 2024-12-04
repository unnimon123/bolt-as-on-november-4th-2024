import { authService } from '../../services/auth-service';
import { supabase } from '../../services/supabase';

jest.mock('../../services/supabase');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: '1' } },
        error: null
      });

      await expect(authService.signIn(
        mockCredentials.email,
        mockCredentials.password
      )).resolves.not.toThrow();
    });

    it('should handle sign in error', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'wrong'
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('Invalid credentials')
      });

      await expect(authService.signIn(
        mockCredentials.email,
        mockCredentials.password
      )).rejects.toThrow('Invalid credentials');
    });
  });
});