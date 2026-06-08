import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const mockOn = vi.fn();
const mockOff = vi.fn();
vi.mock('@/lib/socket/admin-socket', () => ({
  getAdminSocket: () => ({ on: mockOn, off: mockOff, connected: true }),
}));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { useAuctionMonitorSocket, type AuctionLiveMonitorEvent } from './use-auction-socket';

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
function wrapper({ children }: { children: React.ReactNode }) {
  return createElement(QueryClientProvider, { client: qc }, children);
}

function lastHandler(): (e: AuctionLiveMonitorEvent) => void {
  const call = mockOn.mock.calls.find((c) => c[0] === 'auction:live-monitor');
  return call![1];
}

describe('useAuctionMonitorSocket', () => {
  beforeEach(() => {
    mockOn.mockClear();
    mockOff.mockClear();
    qc.clear();
  });

  it('subscribes to auction:live-monitor and unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useAuctionMonitorSocket(), { wrapper });
    expect(mockOn).toHaveBeenCalledWith('auction:live-monitor', expect.any(Function));
    unmount();
    expect(mockOff).toHaveBeenCalledWith('auction:live-monitor', expect.any(Function));
  });

  it('patches the matching row price / bidCount / endTime in cached pages', () => {
    qc.setQueryData(['auctions', { tab: 'ACTIVE' }], {
      items: [
        { id: 'a1', currentPriceMinor: 100, bidCount: 1, endTime: null },
        { id: 'a2', currentPriceMinor: 200, bidCount: 2, endTime: null },
      ],
      meta: { total: 2 },
    });

    renderHook(() => useAuctionMonitorSocket(), { wrapper });
    act(() => {
      lastHandler()({ auctionId: 'a1', currentPriceMinor: 999, bidCount: 5, endTime: '2030-01-01T00:00:00.000Z' });
    });

    const data = qc.getQueryData(['auctions', { tab: 'ACTIVE' }]) as { items: Array<Record<string, unknown>> };
    expect(data.items[0]).toMatchObject({ currentPriceMinor: 999, bidCount: 5, endTime: '2030-01-01T00:00:00.000Z' });
    // Untouched row stays the same.
    expect(data.items[1]).toMatchObject({ currentPriceMinor: 200, bidCount: 2 });
  });

  it('leaves non-list cache entries (kpi/bids) under the same prefix untouched', () => {
    qc.setQueryData(['auctions', 'kpi'], { active: 3 });
    renderHook(() => useAuctionMonitorSocket(), { wrapper });
    act(() => {
      lastHandler()({ auctionId: 'a1', currentPriceMinor: 1, bidCount: 1, endTime: null });
    });
    expect(qc.getQueryData(['auctions', 'kpi'])).toEqual({ active: 3 });
  });
});
