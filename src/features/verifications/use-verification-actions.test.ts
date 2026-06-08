import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ post: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post } from '@/lib/api/client';
import { useVerificationActions } from './use-verification-actions';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useVerificationActions', () => {
  it('approve POSTs to /approve with an empty body', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useVerificationActions(), { wrapper });
    act(() => { result.current.mutate({ id: 'v-1', action: 'approve' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/verifications/v-1/approve', {});
  });

  it('reject POSTs to /reject with the reason', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useVerificationActions(), { wrapper });
    act(() => { result.current.mutate({ id: 'v-2', action: 'reject', reason: 'مستندات غير واضحة' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/verifications/v-2/reject', { reason: 'مستندات غير واضحة' });
  });

  it('return-for-revision POSTs the reason + missingDocs', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const { result } = renderHook(() => useVerificationActions(), { wrapper });
    act(() => {
      result.current.mutate({
        id: 'v-3',
        action: 'return-for-revision',
        reason: 'أعد رفع السجل التجاري',
        missingDocs: ['COMMERCIAL_REG'],
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/verifications/v-3/return-for-revision', {
      reason: 'أعد رفع السجل التجاري',
      missingDocs: ['COMMERCIAL_REG'],
    });
  });

  it('invalidates the cross-feature caches a decision touches', async () => {
    vi.mocked(post).mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const localWrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: qc }, children);

    const { result } = renderHook(() => useVerificationActions(), { wrapper: localWrapper });
    act(() => { result.current.mutate({ id: 'v-9', action: 'approve' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // A verified store/user surfaces outside the verifications feature.
    const invalidated = spy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidated).toContainEqual(['verifications']);
    expect(invalidated).toContainEqual(['stores']);
    expect(invalidated).toContainEqual(['users']);
    expect(invalidated).toContainEqual(['users-count']);
    expect(invalidated).toContainEqual(['dashboard']);
  });
});
