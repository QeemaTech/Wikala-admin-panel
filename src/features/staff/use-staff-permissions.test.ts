import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ patch: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { patch } from '@/lib/api/client';
import { useUpdateStaffPermissions } from './use-staff-permissions';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useUpdateStaffPermissions', () => {
  it('PATCHes the permission set to /admin/staff/:id', async () => {
    vi.mocked(patch).mockResolvedValueOnce({ staff: { id: 's1', permissions: ['MODERATION'] } });
    const { result } = renderHook(() => useUpdateStaffPermissions(), { wrapper });
    act(() => {
      result.current.mutate({ id: 's1', permissions: ['MODERATION', 'REPORTS'] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith('/admin/staff/s1', { permissions: ['MODERATION', 'REPORTS'] });
  });
});
