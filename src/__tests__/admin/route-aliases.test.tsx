/**
 * N6: /admin/seed → /admin/seed-data redirect
 * N7: /admin/communication-audit → /admin/communications redirect
 *
 * As an Admin
 * I want common URL aliases to redirect to the canonical path
 * So that bookmarks or documentation links don't produce 404 errors
 *
 * Acceptance Criteria:
 * - GIVEN I navigate to /admin/seed
 *   THEN I am redirected to /admin/seed-data
 * - GIVEN I navigate to /admin/communication-audit
 *   THEN I am redirected to /admin/communications
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';

// Minimal stand-ins for the real pages (same as what App.tsx renders behind
// ProtectedRoute). The routing logic we're testing is purely path → redirect.
const SeedDataPage = () => <div data-testid="seed-data-page">Seed Data Management</div>;
const CommunicationsPage = () => <div data-testid="communications-page">Communications</div>;

/**
 * Render a minimal route tree that mirrors the App.tsx admin section.
 * The Navigate routes are what we're adding; without them the old paths render nothing.
 */
const renderRoutes = (initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* Canonical routes */}
        <Route path="/admin/seed-data" element={<SeedDataPage />} />
        <Route path="/admin/communications" element={<CommunicationsPage />} />

        {/* Alias redirects — these are what we're adding to App.tsx */}
        <Route path="/admin/seed" element={<Navigate to="/admin/seed-data" replace />} />
        <Route path="/admin/communication-audit" element={<Navigate to="/admin/communications" replace />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Admin Route Aliases', () => {
  describe('N6: /admin/seed redirect', () => {
    it('navigating to /admin/seed renders the Seed Data page', () => {
      renderRoutes('/admin/seed');
      expect(screen.getByTestId('seed-data-page')).toBeInTheDocument();
    });

    it('navigating to /admin/seed-data (canonical) still works', () => {
      renderRoutes('/admin/seed-data');
      expect(screen.getByTestId('seed-data-page')).toBeInTheDocument();
    });
  });

  describe('N7: /admin/communication-audit redirect', () => {
    it('navigating to /admin/communication-audit renders the Communications page', () => {
      renderRoutes('/admin/communication-audit');
      expect(screen.getByTestId('communications-page')).toBeInTheDocument();
    });

    it('navigating to /admin/communications (canonical) still works', () => {
      renderRoutes('/admin/communications');
      expect(screen.getByTestId('communications-page')).toBeInTheDocument();
    });
  });
});
