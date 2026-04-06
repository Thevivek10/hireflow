import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Test component to access auth context
const TestComponent = () => {
  const { user, token, loading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <button onClick={() => login('test-token', { name: 'Test User', role: 'applicant' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    delete axios.defaults.headers.common['Authorization'];
  });

  describe('Initial State', () => {
    it('should render with null user and no token when no token in localStorage', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
    });

    it('should load user when token exists in localStorage', async () => {
      const mockUser = { name: 'John Doe', email: 'john@example.com', role: 'applicant' };
      localStorage.setItem('token', 'stored-token');

      axios.get = vi.fn().mockResolvedValue({ data: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('John Doe');
      expect(screen.getByTestId('token').textContent).toBe('stored-token');
    });

    it('should set axios authorization header when token exists', async () => {
      localStorage.setItem('token', 'auth-token');
      axios.get = vi.fn().mockResolvedValue({ data: { name: 'User' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(axios.defaults.headers.common['Authorization']).toBe('Bearer auth-token');
      });
    });

    it('should logout if token validation fails', async () => {
      localStorage.setItem('token', 'invalid-token');
      axios.get = vi.fn().mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('Login Function', () => {
    it('should update state and localStorage on login', async () => {
      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      const loginButton = getByText('Login');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Test User');
        expect(screen.getByTestId('token').textContent).toBe('test-token');
      });

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(axios.defaults.headers.common['Authorization']).toBe('Bearer test-token');
    });

    it('should set axios authorization header on login', async () => {
      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      getByText('Login').click();

      await waitFor(() => {
        expect(axios.defaults.headers.common['Authorization']).toBe('Bearer test-token');
      });
    });
  });

  describe('Logout Function', () => {
    it('should clear state and localStorage on logout', async () => {
      localStorage.setItem('token', 'existing-token');
      axios.get = vi.fn().mockResolvedValue({
        data: { name: 'Existing User', role: 'applicant' }
      });

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Existing User');
      });

      getByText('Logout').click();

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('null');
        expect(screen.getByTestId('token').textContent).toBe('null');
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should remove axios authorization header on logout', async () => {
      axios.defaults.headers.common['Authorization'] = 'Bearer some-token';

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      getByText('Logout').click();

      await waitFor(() => {
        expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
      });
    });
  });

  describe('Loading State', () => {
    it('should start with loading true and set to false after initialization', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Initially should be loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should set loading to false after token validation', async () => {
      localStorage.setItem('token', 'valid-token');
      axios.get = vi.fn().mockResolvedValue({
        data: { name: 'User', role: 'applicant' }
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should set loading to false even if token validation fails', async () => {
      localStorage.setItem('token', 'invalid-token');
      axios.get = vi.fn().mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading').textContent).toBe('true');

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow();

      console.error = originalError;
    });

    it('should provide all context values', async () => {
      const mockUser = { name: 'Test User', role: 'employer' };
      localStorage.setItem('token', 'test-token');
      axios.get = vi.fn().mockResolvedValue({ data: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('Test User');
      expect(screen.getByTestId('token').textContent).toBe('test-token');
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint in development', async () => {
      process.env.NODE_ENV = 'development';
      localStorage.setItem('token', 'dev-token');
      axios.get = vi.fn().mockResolvedValue({
        data: { name: 'Dev User', role: 'applicant' }
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/api/auth/me');
      });
    });
  });

  describe('Token Persistence', () => {
    it('should persist token across component remounts', async () => {
      const mockUser = { name: 'Persistent User', role: 'applicant' };
      localStorage.setItem('token', 'persistent-token');
      axios.get = vi.fn().mockResolvedValue({ data: mockUser });

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Persistent User');
      });

      unmount();

      // Re-mount
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user').textContent).toBe('Persistent User');
      });

      expect(localStorage.getItem('token')).toBe('persistent-token');
    });
  });
});
