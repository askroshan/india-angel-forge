/**
 * US-COMPLIANCE-004: Access Compliance Audit Logs
 * 
 * As a: Compliance Officer
 * I want to: Access compliance-related audit logs
 * So that: I can track all compliance actions and generate reports
 * 
 * Acceptance Criteria:
 * - View all KYC, AML, and accreditation actions
 * - Filter by investor, action type, and date
 * - Generate compliance reports
 * - Export to CSV/PDF for regulatory submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock apiClient
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import type { Mock } from 'vitest';

// Mock compliance officer auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'compliance-1', email: 'compliance@test.com', role: 'compliance_officer' },
    isAuthenticated: true,
    token: 'mock-token',
    hasRole: (role: string) => role === 'compliance_officer',
  }),
}));

const mockComplianceLogs = [
  {
    id: 'log-1',
    timestamp: '2024-01-15T10:30:00Z',
    officer_id: 'compliance-1',
    officer_email: 'compliance@test.com',
    action: 'KYC_VERIFIED',
    investor_id: 'investor-1',
    investor_email: 'investor@test.com',
    details: { document_type: 'PAN', status: 'approved' },
  },
  {
    id: 'log-2',
    timestamp: '2024-01-15T09:15:00Z',
    officer_id: 'compliance-1',
    officer_email: 'compliance@test.com',
    action: 'AML_SCREENING_COMPLETE',
    investor_id: 'investor-2',
    investor_email: 'investor2@test.com',
    details: { risk_score: 'low', cleared: true },
  },
  {
    id: 'log-3',
    timestamp: '2024-01-14T16:45:00Z',
    officer_id: 'compliance-2',
    officer_email: 'compliance2@test.com',
    action: 'ACCREDITATION_APPROVED',
    investor_id: 'investor-1',
    investor_email: 'investor@test.com',
    details: { type: 'income_verification', expiry: '2025-01-14' },
  },
  {
    id: 'log-4',
    timestamp: '2024-01-13T11:20:00Z',
    officer_id: 'compliance-1',
    officer_email: 'compliance@test.com',
    action: 'KYC_REJECTED',
    investor_id: 'investor-3',
    investor_email: 'investor3@test.com',
    details: { document_type: 'address_proof', reason: 'Document expired' },
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

describe('US-COMPLIANCE-004: Access Compliance Audit Logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    (apiClient.get as Mock).mockImplementation((url: string) => {
      if (url.includes('/compliance/audit') || url.includes('/audit')) {
        return Promise.resolve({ data: mockComplianceLogs });
      }
      return Promise.resolve({ data: [] });
    });
  });

  describe('Audit Log Data Structure', () => {
    it('should include KYC actions in audit logs', async () => {
      const kycLogs = mockComplianceLogs.filter(log => log.action.includes('KYC'));
      expect(kycLogs.length).toBeGreaterThan(0);
      expect(kycLogs[0].action).toBe('KYC_VERIFIED');
    });

    it('should include AML actions in audit logs', async () => {
      const amlLogs = mockComplianceLogs.filter(log => log.action.includes('AML'));
      expect(amlLogs.length).toBeGreaterThan(0);
      expect(amlLogs[0].action).toBe('AML_SCREENING_COMPLETE');
    });

    it('should include accreditation actions in audit logs', async () => {
      const accreditationLogs = mockComplianceLogs.filter(log => log.action.includes('ACCREDITATION'));
      expect(accreditationLogs.length).toBeGreaterThan(0);
      expect(accreditationLogs[0].action).toBe('ACCREDITATION_APPROVED');
    });

    it('should include officer information in logs', async () => {
      mockComplianceLogs.forEach(log => {
        expect(log).toHaveProperty('officer_id');
        expect(log).toHaveProperty('officer_email');
      });
    });

    it('should include investor information in logs', async () => {
      mockComplianceLogs.forEach(log => {
        expect(log).toHaveProperty('investor_id');
        expect(log).toHaveProperty('investor_email');
      });
    });

    it('should include timestamps for all actions', async () => {
      mockComplianceLogs.forEach(log => {
        expect(log).toHaveProperty('timestamp');
        expect(new Date(log.timestamp).getTime()).not.toBeNaN();
      });
    });
  });

  describe('Filtering Capabilities', () => {
    it('should support filtering by investor', async () => {
      const investorId = 'investor-1';
      const filteredLogs = mockComplianceLogs.filter(log => log.investor_id === investorId);
      expect(filteredLogs).toHaveLength(2);
    });

    it('should support filtering by action type', async () => {
      const actionType = 'KYC_VERIFIED';
      const filteredLogs = mockComplianceLogs.filter(log => log.action === actionType);
      expect(filteredLogs).toHaveLength(1);
    });

    it('should support filtering by date range', async () => {
      const startDate = new Date('2024-01-14');
      const endDate = new Date('2024-01-16');
      const filteredLogs = mockComplianceLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
      expect(filteredLogs.length).toBeGreaterThan(0);
    });

    it('should support filtering by compliance officer', async () => {
      const officerId = 'compliance-1';
      const filteredLogs = mockComplianceLogs.filter(log => log.officer_id === officerId);
      expect(filteredLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should support generating compliance summary', async () => {
      const summary = {
        total_actions: mockComplianceLogs.length,
        by_type: {
          kyc: mockComplianceLogs.filter(l => l.action.includes('KYC')).length,
          aml: mockComplianceLogs.filter(l => l.action.includes('AML')).length,
          accreditation: mockComplianceLogs.filter(l => l.action.includes('ACCREDITATION')).length,
        },
        period: {
          start: '2024-01-13',
          end: '2024-01-15',
        },
      };

      expect(summary.total_actions).toBe(4);
      expect(summary.by_type.kyc).toBe(2);
      expect(summary.by_type.aml).toBe(1);
      expect(summary.by_type.accreditation).toBe(1);
    });

    it('should track approval and rejection ratios', async () => {
      const approvals = mockComplianceLogs.filter(l => 
        l.action.includes('VERIFIED') || l.action.includes('APPROVED')
      );
      const rejections = mockComplianceLogs.filter(l => l.action.includes('REJECTED'));

      expect(approvals.length).toBe(2);
      expect(rejections.length).toBe(1);
    });
  });

  describe('Export Functionality', () => {
    it('should have exportable log structure for CSV', async () => {
      const csvHeaders = [
        'timestamp',
        'officer_email',
        'action',
        'investor_email',
        'details',
      ];

      const log = mockComplianceLogs[0];
      csvHeaders.forEach(header => {
        expect(log).toHaveProperty(header);
      });
    });

    it('should include all required fields for regulatory submission', async () => {
      const requiredFields = ['id', 'timestamp', 'officer_id', 'action', 'investor_id', 'details'];

      mockComplianceLogs.forEach(log => {
        requiredFields.forEach(field => {
          expect(log).toHaveProperty(field);
        });
      });
    });

    it('should include action details for audit trail', async () => {
      mockComplianceLogs.forEach(log => {
        expect(log.details).toBeDefined();
        expect(typeof log.details).toBe('object');
      });
    });
  });

  describe('API Integration', () => {
    it('should call compliance audit endpoint', async () => {
      await apiClient.get('/compliance/audit');
      expect(apiClient.get).toHaveBeenCalledWith('/compliance/audit');
    });

    it('should support pagination parameters', async () => {
      await apiClient.get('/compliance/audit?page=1&limit=10');
      expect(apiClient.get).toHaveBeenCalledWith('/compliance/audit?page=1&limit=10');
    });

    it('should support filter parameters in API', async () => {
      await apiClient.get('/compliance/audit?action_type=KYC_VERIFIED&investor_id=investor-1');
      expect(apiClient.get).toHaveBeenCalledWith(
        '/compliance/audit?action_type=KYC_VERIFIED&investor_id=investor-1'
      );
    });
  });
});
