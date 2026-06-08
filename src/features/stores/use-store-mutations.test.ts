import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post, patch } from '@/lib/api/client';
import { useInviteStore, useUpdateStore } from './use-store-mutations';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useInviteStore', () => {
  it('POSTs the invite payload to /admin/stores/invite', async () => {
    vi.mocked(post).mockResolvedValueOnce({ inviteToken: 'tok' });
    const { result } = renderHook(() => useInviteStore(), { wrapper });
    act(() => {
      result.current.mutate({ phoneE164: '+201234567890', suggestedName: 'Elite', categories: ['c1'] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/stores/invite', {
      phoneE164: '+201234567890',
      suggestedName: 'Elite',
      categories: ['c1'],
    });
  });
});

describe('useUpdateStore', () => {
  it('PATCHes the store settings to /admin/stores/:id', async () => {
    vi.mocked(patch).mockResolvedValueOnce({ id: 'st-1' });
    const { result } = renderHook(() => useUpdateStore(), { wrapper });
    act(() => {
      result.current.mutate({ id: 'st-1', payload: { name: 'New Name', categories: ['c1', 'c2'], featured: true } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith('/admin/stores/st-1', {
      name: 'New Name',
      categories: ['c1', 'c2'],
      featured: true,
    });
  });
});
