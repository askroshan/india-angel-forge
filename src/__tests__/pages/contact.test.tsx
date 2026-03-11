/**
 * Contact Page – CompanyHub Form with reCAPTCHA v3
 *
 * As a: Visitor
 * I want to: Submit a contact form on the contact page
 * So that: I can reach the India Angel Forum team
 *
 * Acceptance Criteria:
 * - Page renders with Navigation and Footer
 * - Page has a "Get in Touch" heading
 * - CompanyHub form script is loaded
 * - reCAPTCHA v3 script is loaded (google recaptcha)
 * - Contact information cards are displayed (Operating Entity, Office, Response Time)
 * - Form container is rendered with loading state
 * - Fallback link to open form directly if script fails
 *
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Contact from '@/pages/Contact';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signOut: vi.fn(),
  }),
}));

const renderContact = () => {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <Contact />
      </BrowserRouter>
    </HelmetProvider>
  );
};

describe('Contact Page', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    appendChildSpy = vi.spyOn(document.body, 'appendChild');
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
  });

  describe('Page Layout', () => {
    it('should render the hero heading "Get in Touch"', () => {
      renderContact();
      expect(screen.getByRole('heading', { name: /get in touch/i })).toBeInTheDocument();
    });

    it('should render "Send Us a Message" heading for the form section', () => {
      renderContact();
      expect(screen.getByRole('heading', { name: /send us a message/i })).toBeInTheDocument();
    });

    it('should render "Let\'s Connect" heading for contact info', () => {
      renderContact();
      expect(screen.getByRole('heading', { name: /let.*connect/i })).toBeInTheDocument();
    });
  });

  describe('Contact Information Cards', () => {
    it('should display Operating Entity info', () => {
      renderContact();
      expect(screen.getByText(/operating entity/i)).toBeInTheDocument();
      const matches = screen.getAllByText(/kosansh solutions/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should display Registered Office address', () => {
      renderContact();
      expect(screen.getByText(/registered office/i)).toBeInTheDocument();
      expect(screen.getByText(/1320 pepperhill/i)).toBeInTheDocument();
    });

    it('should display Response Time info', () => {
      renderContact();
      expect(screen.getByText(/response time/i)).toBeInTheDocument();
      expect(screen.getByText(/2-3 business days/i)).toBeInTheDocument();
    });
  });

  describe('CompanyHub Form Integration', () => {
    it('should embed the CompanyHub form via iframe', () => {
      renderContact();
      const iframe = document.querySelector('iframe[title="Contact India Angel Forum"]') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe?.src).toContain('companyhub.com/webtolead/renderform');
    });

    it('should render the iframe with correct sandbox attributes', () => {
      renderContact();
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe?.getAttribute('sandbox')).toContain('allow-forms');
      expect(iframe?.getAttribute('sandbox')).toContain('allow-scripts');
    });

    it('should use lazy loading on the iframe', () => {
      renderContact();
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      expect(iframe?.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('Fallback for Form Loading Failure', () => {
    it('should display a direct link to open the form if the embedded form does not load', () => {
      renderContact();
      const fallbackLink = screen.getByRole('link', { name: /open.*form.*directly/i });
      expect(fallbackLink).toHaveAttribute('href', expect.stringContaining('companyhub.com'));
    });
  });

  describe('How We Can Help Section', () => {
    it('should list help options for Founders', () => {
      renderContact();
      // "Founders" appears in nav, footer, and "How We Can Help" section
      expect(screen.getByText(/funding applications, pitch preparation/i)).toBeInTheDocument();
    });

    it('should list help options for Investors', () => {
      renderContact();
      expect(screen.getByText(/membership inquiries, deal flow/i)).toBeInTheDocument();
    });

    it('should list help options for Family Offices', () => {
      renderContact();
      expect(screen.getByText(/custom engagement/i)).toBeInTheDocument();
    });

    it('should list help options for Partners', () => {
      renderContact();
      expect(screen.getByText(/ecosystem collaboration/i)).toBeInTheDocument();
    });
  });
});
