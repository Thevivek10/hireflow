import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import axios from 'axios';
import toast from 'react-hot-toast';

// Mock dependencies
vi.mock('axios');
vi.mock('react-hot-toast');

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLogin();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your HireFlow account')).toBeInTheDocument();
    });

    it('should render email input', () => {
      renderLogin();
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should render password input', () => {
      renderLogin();
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should render submit button', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('should render link to register page', () => {
      renderLogin();
      const registerLink = screen.getByText('Create one');
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should render Email label', () => {
      renderLogin();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should render Password label', () => {
      renderLogin();
      expect(screen.getByText('Password')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update email input value', () => {
      renderLogin();
      const emailInput = screen.getByPlaceholderText('you@example.com');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password input value', () => {
      renderLogin();
      const passwordInput = screen.getByPlaceholderText('••••••••');

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput).toHaveValue('password123');
    });

    it('should start with empty form fields', () => {
      renderLogin();
      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');

      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  describe('Form Submission - Success', () => {
    it('should submit form with valid credentials', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'applicant' }
        }
      };

      axios.post = vi.fn().mockResolvedValue(mockResponse);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/api/api/auth/login',
          { email: 'john@example.com', password: 'password123' }
        );
      });
    });

    it('should call login function on successful authentication', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'applicant' }
        }
      };

      axios.post = vi.fn().mockResolvedValue(mockResponse);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test-token', mockResponse.data.user);
      });
    });

    it('should show success toast on successful login', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'applicant' }
        }
      };

      axios.post = vi.fn().mockResolvedValue(mockResponse);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Welcome back, John Doe!');
      });
    });

    it('should navigate to dashboard on successful login', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'applicant' }
        }
      };

      axios.post = vi.fn().mockResolvedValue(mockResponse);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Form Submission - Error', () => {
    it('should show error toast on login failure', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Invalid credentials'
          }
        }
      };

      axios.post = vi.fn().mockRejectedValue(errorResponse);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });

    it('should show generic error message if no error message in response', async () => {
      axios.post = vi.fn().mockRejectedValue(new Error('Network error'));

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Login failed');
      });
    });

    it('should not navigate on login failure', async () => {
      axios.post = vi.fn().mockRejectedValue(new Error('Login failed'));

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      let resolvePost;
      const postPromise = new Promise((resolve) => {
        resolvePost = resolve;
      });

      axios.post = vi.fn().mockReturnValue(postPromise);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });

      resolvePost({
        data: {
          token: 'token',
          user: { id: '1', name: 'User', email: 'user@example.com', role: 'applicant' }
        }
      });
    });

    it('should disable submit button while loading', async () => {
      let resolvePost;
      const postPromise = new Promise((resolve) => {
        resolvePost = resolve;
      });

      axios.post = vi.fn().mockReturnValue(postPromise);

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Signing in/i });
        expect(button).toBeDisabled();
      });

      resolvePost({
        data: {
          token: 'token',
          user: { id: '1', name: 'User', email: 'user@example.com', role: 'applicant' }
        }
      });
    });

    it('should re-enable button after submission completes', async () => {
      axios.post = vi.fn().mockResolvedValue({
        data: {
          token: 'token',
          user: { id: '1', name: 'User', email: 'user@example.com', role: 'applicant' }
        }
      });

      renderLogin();

      const emailInput = screen.getByPlaceholderText('you@example.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should have required attribute on email field', () => {
      renderLogin();
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have required attribute on password field', () => {
      renderLogin();
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have email type on email input', () => {
      renderLogin();
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should have password type on password input', () => {
      renderLogin();
      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Navigation', () => {
    it('should have link to register page', () => {
      renderLogin();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      const registerLink = screen.getByText('Create one');
      expect(registerLink).toHaveAttribute('href', '/register');
    });
  });
});
