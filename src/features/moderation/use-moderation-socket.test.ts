import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

const mockOn = vi.fn();
const mockOff = vi.fn();
const mockSocket = { on: mockOn, off: mockOff, connected: true };

vi.mock('@/lib/socket/admin-socket', () => ({
  getAdminSocket: () => mockSocket,
}));

vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { useModerationSocket } from './use-moderation-socket';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useModerationSocket', () => {
  beforeEach(() => {
    mockOn.mockClear();
    mockOff.mockClear();
  });

  it('subscribes to moderation:new on mount', () => {
    renderHook(() => useModerationSocket(), { wrapper });
    expect(mockOn).toHaveBeenCalledWith('moderation:new', expect.any(Function));
  });

  it('subscribes to moderation:resolved too — departures, not just arrivals', () => {
    // Without this, an ad another moderator already approved stayed on your
    // screen, and clicking Approve on it answered "not in queue" — the row was
    // gone and only this list still believed otherwise.
    renderHook(() => useModerationSocket(), { wrapper });
    expect(mockOn).toHaveBeenCalledWith('moderation:resolved', expect.any(Function));
  });

  it('refreshes the queue when someone else decides on an ad', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const spy = vi.spyOn(qc, 'invalidateQueries');

    renderHook(() => useModerationSocket(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: qc }, children),
    });

    const handler = mockOn.mock.calls.find((c) => c[0] === 'moderation:resolved')?.[1];
    expect(handler).toBeTypeOf('function');
    handler({ adId: 'a1', decision: 'APPROVE', reviewerId: 's1' });

    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    // The queue itself, the tab badges (a separate key that ['moderation']
    // does not prefix-match), and the catalogue the ad has just joined.
    expect(keys).toContain('["moderation"]');
    expect(keys).toContain('["moderation-count"]');
    expect(keys).toContain('["admin-ads"]');
  });

  it('unsubscribes from both events on unmount — no memory leak', () => {
    const { unmount } = renderHook(() => useModerationSocket(), { wrapper });
    unmount();
    expect(mockOff).toHaveBeenCalledWith('moderation:new', expect.any(Function));
    expect(mockOff).toHaveBeenCalledWith('moderation:resolved', expect.any(Function));
  });
});
