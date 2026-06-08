import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ post: vi.fn(), patch: vi.fn(), del: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post, patch, del } from '@/lib/api/client';
import { useCreateStaff, useUpdateStaff, useSuspendStaff, useDeleteStaff } from './use-staff-mutations';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCreateStaff', () => {
  it('POSTs name/email/role/permissions to /admin/staff and returns the staff', async () => {
    vi.mocked(post).mockResolvedValueOnce({ staff: { id: 's1', tempPassword: 'pw' } });
    const { result } = renderHook(() => useCreateStaff(), { wrapper });
    act(() => {
      result.current.mutate({ email: 'a@wikala.app', name: 'Amir', role: 'SUPPORT', permissions: ['USERS', 'REPORTS'] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/staff', {
      email: 'a@wikala.app',
      name: 'Amir',
      role: 'SUPPORT',
      permissions: ['USERS', 'REPORTS'],
    });
    expect(result.current.data).toMatchObject({ id: 's1', tempPassword: 'pw' });
  });
});

describe('useUpdateStaff', () => {
  it('PATCHes the partial payload to /admin/staff/:id', async () => {
    vi.mocked(patch).mockResolvedValueOnce({ staff: { id: 's1' } });
    const { result } = renderHook(() => useUpdateStaff(), { wrapper });
    act(() => {
      result.current.mutate({ id: 's1', payload: { name: 'New', role: 'ADMIN' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith('/admin/staff/s1', { name: 'New', role: 'ADMIN' });
  });
});

describe('useSuspendStaff', () => {
  it('POSTs to /admin/staff/:id/suspend', async () => {
    vi.mocked(post).mockResolvedValueOnce({ staff: { id: 's1' } });
    const { result } = renderHook(() => useSuspendStaff(), { wrapper });
    act(() => { result.current.mutate('s1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/staff/s1/suspend', {});
  });
});

describe('useDeleteStaff', () => {
  it('DELETEs /admin/staff/:id', async () => {
    vi.mocked(del).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteStaff(), { wrapper });
    act(() => { result.current.mutate('s1'); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(del).toHaveBeenCalledWith('/admin/staff/s1');
  });
});
