import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/api/client', () => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock('@/features/auth/auth-store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'test-token' }) },
}));

import { post, patch } from '@/lib/api/client';
import { useCreateCurrency, useUpdateCurrency } from './use-currencies';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCreateCurrency', () => {
  it('POSTs a new currency to /admin/currencies', async () => {
    vi.mocked(post).mockResolvedValueOnce({ currency: { code: 'USD' } });
    const { result } = renderHook(() => useCreateCurrency(), { wrapper });
    act(() => {
      result.current.mutate({ code: 'USD', nameAr: 'الدولار', nameEn: 'US Dollar', exchangeRateToBase: 49.2, status: 'ACTIVE' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith('/admin/currencies', {
      code: 'USD', nameAr: 'الدولار', nameEn: 'US Dollar', exchangeRateToBase: 49.2, status: 'ACTIVE',
    });
  });
});

describe('useUpdateCurrency', () => {
  it('PATCHes the exchange rate to /admin/currencies/:code', async () => {
    vi.mocked(patch).mockResolvedValueOnce({ currency: { code: 'USD', exchangeRateToBase: 50 } });
    const { result } = renderHook(() => useUpdateCurrency(), { wrapper });
    act(() => {
      result.current.mutate({ code: 'USD', payload: { exchangeRateToBase: 50 } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patch).toHaveBeenCalledWith('/admin/currencies/USD', { exchangeRateToBase: 50 });
  });
});
