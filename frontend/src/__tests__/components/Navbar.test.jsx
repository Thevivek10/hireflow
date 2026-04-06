import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { AuthProvider } from '../../context/AuthContext';

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/jobs' })
  };
});

const renderNavbar = (user = null) => {
  const mockAuthContext = {
    user,
    token: user ? 'test-token' : null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn()
  };

  return render(
    <BrowserRouter>
      <AuthProvider value={mockAuthContext}>
        <Navbar />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Brand and Logo', () => {
    it('should render HireFlow brand', () => {
      renderNavbar();
      expect(screen.getByText('HireFlow')).toBeInTheDocument();
      expect(screen.getByText('HF')).toBeInTheDocument();
    });

    it('should render brand subtitle', () => {
      renderNavbar();
      expect(screen.getByText('Job pipeline, without the chaos')).toBeInTheDocument();
    });

    it('should link brand to home page', () => {
      renderNavbar();
      const brandLink = screen.getByText('HireFlow').closest('a');
      expect(brandLink).toHaveAttribute('href', '/');
    });
  });

  describe('Public Navigation Links', () => {
    it('should always show Browse roles link', () => {
      renderNavbar();
      expect(screen.getByText('Browse roles')).toBeInTheDocument();
    });

    it('should link Browse roles to /jobs', () => {
      renderNavbar();
      const jobsLink = screen.getByText('Browse roles');
      expect(jobsLink).toHaveAttribute('href', '/jobs');
    });
  });

  describe('Unauthenticated State', () => {
    it('should show login button when not logged in', () => {
      renderNavbar();
      expect(screen.getByText('Log in')).toBeInTheDocument();
    });

    it('should show create account button when not logged in', () => {
      renderNavbar();
      expect(screen.getByText('Create account')).toBeInTheDocument();
    });

    it('should not show Overview link when not logged in', () => {
      renderNavbar();
      expect(screen.queryByText('Overview')).not.toBeInTheDocument();
    });

    it('should not show Insights link when not logged in', () => {
      renderNavbar();
      expect(screen.queryByText('Insights')).not.toBeInTheDocument();
    });

    it('should not show user name when not logged in', () => {
      renderNavbar();
      expect(screen.queryByText(/nav__user-name/)).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State - Applicant', () => {
    const applicantUser = {
      name: 'John Applicant',
      email: 'john@example.com',
      role: 'applicant'
    };

    it('should show user name when logged in', () => {
      renderNavbar(applicantUser);
      expect(screen.getByText('John Applicant')).toBeInTheDocument();
    });

    it('should show user role when logged in', () => {
      renderNavbar(applicantUser);
      expect(screen.getByText('applicant')).toBeInTheDocument();
    });

    it('should show Overview link', () => {
      renderNavbar(applicantUser);
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should show Insights link', () => {
      renderNavbar(applicantUser);
      expect(screen.getByText('Insights')).toBeInTheDocument();
    });

    it('should show My applications link for applicant', () => {
      renderNavbar(applicantUser);
      expect(screen.getByText('My applications')).toBeInTheDocument();
    });

    it('should not show Post a role link for applicant', () => {
      renderNavbar(applicantUser);
      expect(screen.queryByText('Post a role')).not.toBeInTheDocument();
    });

    it('should show logout button', () => {
      renderNavbar(applicantUser);
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('should not show login/register buttons when logged in', () => {
      renderNavbar(applicantUser);
      expect(screen.queryByText('Log in')).not.toBeInTheDocument();
      expect(screen.queryByText('Create account')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State - Employer', () => {
    const employerUser = {
      name: 'Jane Employer',
      email: 'jane@company.com',
      role: 'employer'
    };

    it('should show user name for employer', () => {
      renderNavbar(employerUser);
      expect(screen.getByText('Jane Employer')).toBeInTheDocument();
    });

    it('should show employer role', () => {
      renderNavbar(employerUser);
      expect(screen.getByText('employer')).toBeInTheDocument();
    });

    it('should show Post a role link for employer', () => {
      renderNavbar(employerUser);
      expect(screen.getByText('Post a role')).toBeInTheDocument();
    });

    it('should not show My applications link for employer', () => {
      renderNavbar(employerUser);
      expect(screen.queryByText('My applications')).not.toBeInTheDocument();
    });

    it('should link Post a role to /create-job', () => {
      renderNavbar(employerUser);
      const createJobLink = screen.getByText('Post a role');
      expect(createJobLink).toHaveAttribute('href', '/create-job');
    });
  });

  describe('Mobile Menu', () => {
    it('should have menu toggle button', () => {
      renderNavbar();
      const toggleButton = screen.getByLabelText('Toggle navigation');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle menu on button click', () => {
      renderNavbar();
      const toggleButton = screen.getByLabelText('Toggle navigation');
      const navLinks = toggleButton.parentElement?.querySelector('.nav__links');

      expect(navLinks).not.toHaveClass('nav__links--open');

      fireEvent.click(toggleButton);
      expect(navLinks).toHaveClass('nav__links--open');

      fireEvent.click(toggleButton);
      expect(navLinks).not.toHaveClass('nav__links--open');
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight active link based on current path', () => {
      renderNavbar();
      const jobsLink = screen.getByText('Browse roles');
      expect(jobsLink).toHaveClass('active');
    });
  });

  describe('Navigation Links', () => {
    const applicantUser = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'applicant'
    };

    it('should link Overview to /dashboard', () => {
      renderNavbar(applicantUser);
      const overviewLink = screen.getByText('Overview');
      expect(overviewLink).toHaveAttribute('href', '/dashboard');
    });

    it('should link Insights to /analytics', () => {
      renderNavbar(applicantUser);
      const insightsLink = screen.getByText('Insights');
      expect(insightsLink).toHaveAttribute('href', '/analytics');
    });

    it('should link My applications to /my-applications', () => {
      renderNavbar(applicantUser);
      const applicationsLink = screen.getByText('My applications');
      expect(applicationsLink).toHaveAttribute('href', '/my-applications');
    });
  });

  describe('Role-Based Rendering', () => {
    it('should render different navigation for different roles', () => {
      const { unmount } = renderNavbar({ name: 'Applicant', role: 'applicant' });
      expect(screen.getByText('My applications')).toBeInTheDocument();
      expect(screen.queryByText('Post a role')).not.toBeInTheDocument();

      unmount();

      renderNavbar({ name: 'Employer', role: 'employer' });
      expect(screen.getByText('Post a role')).toBeInTheDocument();
      expect(screen.queryByText('My applications')).not.toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('should show user indicator dot', () => {
      const user = { name: 'Test', role: 'applicant' };
      renderNavbar(user);
      const userSpan = screen.getByText('Test').closest('.nav__user');
      expect(userSpan?.querySelector('.nav__user-dot')).toBeInTheDocument();
    });
  });
});
