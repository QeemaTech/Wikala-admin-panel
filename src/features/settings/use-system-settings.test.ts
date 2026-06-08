import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { put } from '@/lib/api/client';
import { useUpdateSystemSettings } from './use-system-settings';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useUpdateSystemSettings', () => {
  it('PUTs the partial settings payload to /admin/settings and returns settings', async () => {
    vi.mocked(put).mockResolvedValueOnce({ settings: { localeDefault: 'ar' } });
    const { result } = renderHook(() => useUpdateSystemSettings(), { wrapper });
    act(() => {
      result.current.mutate({ trust: { autoWatermark: false, duplicateDetection: true, chatLinkDetection: true, chatEncryption: true } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(put).toHaveBeenCalledWith('/admin/settings', {
      trust: { autoWatermark: false, duplicateDetection: true, chatLinkDetection: true, chatEncryption: true },
    });
    expect(result.current.data).toMatchObject({ localeDefault: 'ar' });
  });
});
