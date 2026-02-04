import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock API Client
vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(() => Promise.resolve({ data: null, error: null })),
    list: vi.fn(() => Promise.resolve({ data: { data: [], total: 0 }, error: null })),
    create: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    post: vi.fn(() => Promise.resolve({ data: null, error: null })),
  },
  getApiClient: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve({ data: null, error: null })),
    list: vi.fn(() => Promise.resolve({ data: { data: [], total: 0 }, error: null })),
    create: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => Promise.resolve({ data: null, error: null })),
    delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    post: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useParams: vi.fn(() => ({})),
    useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
  };
});
