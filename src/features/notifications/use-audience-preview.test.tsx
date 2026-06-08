import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPost = vi.fn().mockResolvedValue({ targetCountEstimate: 42 });
vi.mock('@/lib/api/client', () => ({ post: (...args: unknown[]) => mockPost(...args) }));

import { useAudiencePreview } from './use-audience-preview';
import type { AudienceQuery } from './use-campaigns';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useAudiencePreview', () => {
  beforeEach(() => mockPost.mockClear());

  it('debounce-calls preview-audience with the query and re-fires on change', async () => {
    const { rerender } = renderHook((q: AudienceQuery) => useAudiencePreview(q), {
      initialProps: { tier: ['VERIFIED'] } as AudienceQuery,
      wrapper,
    });

    await waitFor(
      () => expect(mockPost).toHaveBeenCalledWith('/admin/push-campaigns/preview-audience', { audienceQuery: { tier: ['VERIFIED'] } }),
      { timeout: 2000 },
    );

    rerender({ tier: ['PREMIUM'] });
    await waitFor(
      () => expect(mockPost).toHaveBeenCalledWith('/admin/push-campaigns/preview-audience', { audienceQuery: { tier: ['PREMIUM'] } }),
      { timeout: 2000 },
    );
  });
});
