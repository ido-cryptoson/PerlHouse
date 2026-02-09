import { describe, it, expect, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ from: vi.fn() })),
}));

import { createClient } from './supabase';

describe('createClient', () => {
  it('returns a Supabase client instance', () => {
    const client = createClient();
    expect(client).toBeDefined();
    expect(client).toHaveProperty('from');
  });
});
