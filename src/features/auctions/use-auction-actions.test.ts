import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ post: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post } from '@/lib/api/client';
import { useForceCloseAuction, useApproveAuction } from './use-auction-actions';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useForceCloseAuction', () => {
  it('POSTs to /force-close with the reason', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useForceCloseAuction(), { wrapper });
    act(() => { result.current.mutate({ auctionId: 'auc-1', reason: 'مخالفة' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/auctions/auc-1/force-close', { reason: 'مخالفة' });
  });

  it('POSTs an empty body when no reason given', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useForceCloseAuction(), { wrapper });
    act(() => { result.current.mutate({ auctionId: 'auc-2' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/auctions/auc-2/force-close', {});
  });
});

describe('useApproveAuction', () => {
  it('POSTs to /approve with the chosen durationDays', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useApproveAuction(), { wrapper });
    act(() => { result.current.mutate({ auctionId: 'auc-3', durationDays: 14 }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/auctions/auc-3/approve', { durationDays: 14 });
  });
});
