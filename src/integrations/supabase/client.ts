/**
 * Supabase client stub for migration
 * This file provides a placeholder for components still using supabase
 * while migration to fetch API is in progress
 */

// Placeholder supabase client - to be replaced with real implementation or removed after migration
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: unknown) => ({
        eq: (column2: string, value2: unknown) => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        order: (column: string, options?: { ascending?: boolean }) => Promise.resolve({ data: [], error: null }),
      }),
      order: (column: string, options?: { ascending?: boolean }) => Promise.resolve({ data: [], error: null }),
    }),
    insert: (data: Record<string, unknown>) => Promise.resolve({ data: null, error: null }),
    update: (data: Record<string, unknown>) => ({
      eq: (column: string, value: unknown) => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: (column: string, value: unknown) => Promise.resolve({ data: null, error: null }),
    }),
  }),
  storage: {
    from: (bucket: string) => ({
      createSignedUrl: (path: string, expiresIn: number) => 
        Promise.resolve({ data: { signedUrl: '' }, error: null }),
    }),
  },
};
