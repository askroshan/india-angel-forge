/**
 * Footer Component – Logo & Links
 *
 * As a: Visitor
 * I want to: See the correct logo and useful links in the footer
 * So that: I can navigate the site and identify the brand
 *
 * Acceptance Criteria:
 * - Footer logo uses logo-transparent.png
 * - Footer has LinkedIn and Twitter social links
 * - Footer has links to Terms, Privacy, Code of Conduct
 * - Footer has copyright notice
 *
 * TDD: RED Phase - Writing failing tests first
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '@/components/Footer';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, signOut: vi.fn() }),
}));

const renderFooter = () => {
  return render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  describe('Logo', () => {
    it('should render logo with logo-transparent.png', () => {
      renderFooter();
      const logo = screen.getByAltText('India Angel Forum');
      expect(logo).toHaveAttribute('src', '/logo-transparent.png');
    });
  });

  describe('Social Links', () => {
    it('should have LinkedIn link', () => {
      renderFooter();
      const linkedIn = screen.getByLabelText(/linkedin/i);
      expect(linkedIn).toHaveAttribute('href', expect.stringContaining('linkedin.com'));
    });

    it('should have Twitter link', () => {
      renderFooter();
      const twitter = screen.getByLabelText(/twitter/i);
      expect(twitter).toHaveAttribute('href', expect.stringContaining('twitter.com'));
    });
  });

  describe('Legal Links', () => {
    it('should have Terms link', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /terms/i })).toHaveAttribute('href', '/terms');
    });

    it('should have Privacy Policy link', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute('href', '/privacy');
    });

    it('should have Code of Conduct link', () => {
      renderFooter();
      expect(screen.getByRole('link', { name: /code of conduct/i })).toHaveAttribute('href', '/code-of-conduct');
    });
  });

  describe('Copyright', () => {
    it('should display copyright with current year', () => {
      renderFooter();
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });
  });
});
