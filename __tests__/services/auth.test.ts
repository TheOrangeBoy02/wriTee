import { authService } from '@/services/auth';

// Mock Supabase completely
const mockAuthFunctions = {
  getUser: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
};

const mockSupabaseMethods = {
  insert: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: mockAuthFunctions,
    from: jest.fn(() => mockSupabaseMethods),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return user when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockAuthFunctions.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.getCurrentUser();
      expect(result).toEqual(mockUser);
    });

    it('should return null when not authenticated', async () => {
      mockAuthFunctions.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await authService.getCurrentUser();
      expect(result).toBeNull();
    });

    it('should throw error when auth service fails', async () => {
      const mockError = new Error('Auth service error');
      mockAuthFunctions.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(authService.getCurrentUser()).rejects.toThrow('Auth service error');
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockAuthResponse = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      };
      
      mockAuthFunctions.signInWithPassword.mockResolvedValue(mockAuthResponse);

      await authService.signIn('test@example.com', 'password123');
      
      expect(mockAuthFunctions.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error with invalid credentials', async () => {
      const mockError = new Error('Invalid credentials');
      mockAuthFunctions.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(authService.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should create account successfully', async () => {
      const mockAuthResponse = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      };
      
      mockAuthFunctions.signUp.mockResolvedValue(mockAuthResponse);

      await authService.signUp('test@example.com', 'password123', 'Test User', '+1234567890');
      
      expect(mockAuthFunctions.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error when email already exists', async () => {
      const mockError = new Error('User already registered');
      mockAuthFunctions.signUp.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(authService.signUp('existing@example.com', 'password123', 'Test User', '+1234567890'))
        .rejects.toThrow('User already registered');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockAuthFunctions.signOut.mockResolvedValue({ error: null });

      await authService.signOut();
      
      expect(mockAuthFunctions.signOut).toHaveBeenCalled();
    });

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      mockAuthFunctions.signOut.mockResolvedValue({ error: mockError });

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });
});