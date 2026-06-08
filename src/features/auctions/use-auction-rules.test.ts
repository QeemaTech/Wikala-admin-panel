import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { get, put } from '@/lib/api/client';
import { useAuctionRules, useUpdateAuctionRules } from './use-auction-rules';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

const RAW = {
  default_duration_days: 7,
  max_duration_days: 30,
  min_bid_increment_minor: 50000,
  auto_extend_seconds: 120,
  auto_extend_enabled: true,
  verified_only: false,
  outbid_push_enabled: true,
};

describe('useAuctionRules', () => {
  it('GETs the snake_case auction settings subdocument', async () => {
    vi.mocked(get).mockResolvedValueOnce(RAW);
    const { result } = renderHook(() => useAuctionRules(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith('/admin/settings/auction');
    expect(result.current.data?.min_bid_increment_minor).toBe(50000);
  });
});

describe('useUpdateAuctionRules', () => {
  it('PUTs camelCase using the service param names (autoExtendEnabled/outbidPushEnabled)', async () => {
    vi.mocked(put).mockResolvedValueOnce(RAW);
    const { result } = renderHook(() => useUpdateAuctionRules(), { wrapper });
    act(() => {
      result.current.mutate({
        defaultDurationDays: 7,
        maxDurationDays: 30,
        minBidIncrementMinor: 50000,
        autoExtendEnabled: false,
        verifiedOnly: true,
        outbidPushEnabled: false,
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const [path, body] = vi.mocked(put).mock.calls[0];
    expect(path).toBe('/admin/settings/auction');
    // The two switch fields must use the service's names, not the DTO's.
    expect(body).toHaveProperty('autoExtendEnabled', false);
    expect(body).toHaveProperty('outbidPushEnabled', false);
    expect(body).not.toHaveProperty('autoExtend');
    expect(body).not.toHaveProperty('outbidPush');
  });
});
