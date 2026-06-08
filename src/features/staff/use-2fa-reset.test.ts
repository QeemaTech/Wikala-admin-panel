import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ post: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post } from '@/lib/api/client';
import { useReset2FA } from './use-2fa-reset';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useReset2FA', () => {
  it('POSTs to /admin/staff/:id/2fa/reset', async () => {
    vi.mocked(post).mockResolvedValueOnce({ staff: { id: 's1', twoFactorEnabled: false } });
    const { result } = renderHook(() => useReset2FA(), { wrapper });
    act(() => { result.current.mutate('s1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/staff/s1/2fa/reset', {});
  });
});
