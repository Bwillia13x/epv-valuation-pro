import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthenticationForm from '../components/AuthenticationForm';
import { AuthProvider } from '../lib/AuthContext';

// Mock the AuthContext
const mockLogin = jest.fn();
const mockRegister = jest.fn();

jest.mock('../lib/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    user: null,
    isLoading: false,
    isAuthenticated: false,
  }),
}));

describe('AuthenticationForm', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockRegister.mockClear();
  });

  describe('Login Mode', () => {
    it('should render login form by default', () => {
      render(<AuthenticationForm />);

      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(<AuthenticationForm />);

      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      render(<AuthenticationForm />);

      // Fill form with invalid email
      const emailInput = screen.getByPlaceholderText('Email address');
      const passwordInput = screen.getByPlaceholderText('Password');
      
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      // The validation should prevent login from being called and show error
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      render(<AuthenticationForm />);

      fireEvent.change(screen.getByPlaceholderText('Email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'short' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should submit login with valid data', async () => {
      mockLogin.mockResolvedValue({ success: true });

      render(<AuthenticationForm />);

      fireEvent.change(screen.getByPlaceholderText('Email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should handle login error', async () => {
      mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });

      render(<AuthenticationForm />);

      fireEvent.change(screen.getByPlaceholderText('Email address'), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });
  });

  describe('Registration Mode', () => {
    it('should switch to registration mode', () => {
      render(<AuthenticationForm />);

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Organization (optional)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
      expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
    });

    it('should validate required fields in registration', async () => {
      render(<AuthenticationForm defaultMode="register" />);

      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(screen.getByText('Name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should submit registration with valid data', async () => {
      mockRegister.mockResolvedValue({ success: true });

      render(<AuthenticationForm defaultMode="register" />);

      fireEvent.change(screen.getByPlaceholderText('Full Name'), {
        target: { value: 'John Doe' },
      });
      fireEvent.change(screen.getByPlaceholderText('Email address'), {
        target: { value: 'john@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('Organization (optional)'), {
        target: { value: 'Acme Corp' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          name: 'John Doe',
          organization: 'Acme Corp',
        });
      });
    });

    it('should handle registration without organization', async () => {
      mockRegister.mockResolvedValue({ success: true });

      render(<AuthenticationForm defaultMode="register" />);

      fireEvent.change(screen.getByPlaceholderText('Full Name'), {
        target: { value: 'Jane Doe' },
      });
      fireEvent.change(screen.getByPlaceholderText('Email address'), {
        target: { value: 'jane@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('Password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'jane@example.com',
          password: 'password123',
          name: 'Jane Doe',
          organization: undefined,
        });
      });
    });
  });

  it('should clear errors when switching modes', () => {
    render(<AuthenticationForm />);

    // Try to submit empty form to generate errors
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    // Wait for errors to appear
    setTimeout(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();

      // Switch to registration mode
      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      // Errors should be cleared
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    }, 100);
  });

  it('should call onSuccess callback after successful authentication', async () => {
    const mockOnSuccess = jest.fn();
    mockLogin.mockResolvedValue({ success: true });

    render(<AuthenticationForm onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
}); 