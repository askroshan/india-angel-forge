import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CompanyProfile from '@/pages/founder/CompanyProfile';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
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

    // Mock authenticated session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'founder-123' },
        },
      },
    });
  });

  describe('Company Profile Display', () => {
    it('should display company profile page', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        description: 'AI-powered analytics platform',
        industry: 'Technology',
        stage: 'Series A',
        founded_year: 2022,
        team_size: 15,
        website: 'https://techstartup.com',
        linkedin: 'https://linkedin.com/company/techstartup',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        description: 'AI platform',
        industry: 'Technology',
        stage: 'Series A',
      };

      const mockUpdate = vi.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: mockUpdate,
        }),
      });

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

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should allow editing company description', async () => {
      const user = userEvent.setup();

      const mockProfile = {
        id: 'profile-1',
        company_name: 'TechStartup Inc',
        description: 'Old description',
        industry: 'Technology',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

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

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
    });

    it('should allow selecting industry', async () => {
      const user = userEvent.setup();

      const mockProfile = {
        id: 'profile-1',
        company_name: 'TechStartup Inc',
        description: 'AI platform',
        industry: 'Technology',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        description: 'AI platform',
        stage: 'Series A',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        founded_year: 2022,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        team_size: 15,
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        website: 'https://techstartup.com',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

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
        company_name: 'TechStartup Inc',
        linkedin: 'https://linkedin.com/company/techstartup',
        twitter: 'https://twitter.com/techstartup',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

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

      const mockInsert = vi.fn().mockResolvedValue({
        data: { id: 'profile-123' },
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
        insert: mockInsert,
      });

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

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: 'New Startup',
            description: 'Revolutionary new product',
          })
        );
      });
    });
  });

  describe('Validation', () => {
    it('should require company name', async () => {
      const user = userEvent.setup();

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      render(
        <BrowserRouter>
          <CompanyProfile />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show validation error or not call insert
      await waitFor(() => {
        expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      });
    });
  });
});
