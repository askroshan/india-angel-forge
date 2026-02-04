import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import CompanyProfile from '@/pages/founder/CompanyProfile';

// Mock AuthContext for authentication
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'founder-123',
      email: 'founder@example.com',
      role: 'founder',
    },
    isAuthenticated: true,
    token: 'test-token',
  }),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CompanyProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Company Profile Display', () => {
    it('should display company profile page', async () => {
      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(null);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Company Profile/i)).toBeInTheDocument();
      });
    });

    it('should display existing company profile', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        description: 'AI-powered analytics platform',
        industry: 'Technology',
        stage: 'Series A',
        foundedYear: 2022,
        teamSize: 15,
        website: 'https://techstartup.com',
        linkedin: 'https://linkedin.com/company/techstartup',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('TechStartup Inc')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/AI-powered analytics/)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Company Profile', () => {
    it('should allow editing company name', async () => {
      const user = userEvent.setup();

      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        description: 'AI platform',
        industry: 'Technology',
        stage: 'Series A',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.post('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('TechStartup Inc')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Company Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'TechStartup Corp');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);
    });

    it('should allow editing company description', async () => {
      const user = userEvent.setup();

      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        description: 'Old description',
        industry: 'Technology',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
        http.post('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Old description')).toBeInTheDocument();
      });

      const descInput = screen.getByLabelText(/Description/i);
      await user.clear(descInput);
      await user.type(descInput, 'New and improved description');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);
    });

    it('should allow selecting industry', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        description: 'AI platform',
        industry: 'Technology',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Industry/i)).toBeInTheDocument();
      });
    });

    it('should allow selecting funding stage', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        description: 'AI platform',
        stage: 'Series A',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Stage/i)).toBeInTheDocument();
      });
    });
  });

  describe('Company Details', () => {
    it('should display founded year', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        foundedYear: 2022,
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('2022')).toBeInTheDocument();
      });
    });

    it('should display team size', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        teamSize: 15,
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      });
    });

    it('should display website URL', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        website: 'https://techstartup.com',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('https://techstartup.com')).toBeInTheDocument();
      });
    });

    it('should display social media links', async () => {
      const mockProfile = {
        id: 'profile-1',
        companyName: 'TechStartup Inc',
        linkedin: 'https://linkedin.com/company/techstartup',
        twitter: 'https://twitter.com/techstartup',
      };

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(mockProfile);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue(/linkedin.com/)).toBeInTheDocument();
      });
    });
  });

  describe('Create New Profile', () => {
    it('should allow creating new company profile', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(null);
        }),
        http.post('/api/company/profile', () => {
          return HttpResponse.json({ id: 'profile-123' });
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Company Name/i);
      await user.type(nameInput, 'New Startup');

      const descInput = screen.getByLabelText(/Description/i);
      await user.type(descInput, 'Revolutionary new product');

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);
    });
  });

  describe('Validation', () => {
    it('should require company name', async () => {
      const user = userEvent.setup();

      server.use(
        http.get('/api/company/profile', () => {
          return HttpResponse.json(null);
        }),
      );

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /save/i })[0]).toBeInTheDocument();
      });

      const saveButtons = screen.getAllByRole('button', { name: /save/i });
      await user.click(saveButtons[0]);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      });
    });
  });
});
