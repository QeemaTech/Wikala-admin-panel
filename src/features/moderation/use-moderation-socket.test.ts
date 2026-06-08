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

  it('unsubscribes on unmount — no memory leak', () => {
    const { unmount } = renderHook(() => useModerationSocket(), { wrapper });
    unmount();
    expect(mockOff).toHaveBeenCalledWith('moderation:new', expect.any(Function));
  });
});
