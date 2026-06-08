import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post } from '@/lib/api/client';
import { useApproveAd, useRejectAd, useEscalateAd } from './use-moderation-actions';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useApproveAd', () => {
  it('calls POST /admin/moderation/:adId/approve', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useApproveAd(), { wrapper });
    act(() => { result.current.mutate('ad-123'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/moderation/ad-123/approve', {});
  });

  it('invalidates the queue, the SEPARATE tab-count key, the ads catalog and KPIs', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useApproveAd(), { wrapper: localWrapper });
    act(() => { result.current.mutate('ad-123'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidated = spy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidated).toContainEqual(['moderation']);
    expect(invalidated).toContainEqual(['moderation-count']); // not prefix-matched by ['moderation']
    expect(invalidated).toContainEqual(['admin-ads']);
    expect(invalidated).toContainEqual(['dashboard']);
  });
});

describe('useRejectAd', () => {
  it('calls POST /admin/moderation/:adId/reject with reason', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useRejectAd(), { wrapper });
    act(() => { result.current.mutate({ adId: 'ad-456', reason: 'محتوى مخالف' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith(
      '/admin/moderation/ad-456/reject',
      { reason: 'محتوى مخالف' },
    );
  });
});

describe('useEscalateAd', () => {
  it('calls POST /admin/moderation/:adId/escalate with reason', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useEscalateAd(), { wrapper });
    act(() => { result.current.mutate({ adId: 'ad-789', reason: 'يحتاج مشرف' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith(
      '/admin/moderation/ad-789/escalate',
      { reason: 'يحتاج مشرف' },
    );
  });
});
