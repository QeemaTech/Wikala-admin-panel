'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            // Refetch every query when its component mounts, even if the cached
            // data is still within staleTime. Navigating to a page then behaves
            // like a hard refresh: you always land on server-fresh data. This is
            // the safety net for any cross-feature change a mutation didn't
            // explicitly invalidate; cached data is shown while the refetch runs
            // in the background, so there's no loading flash. Cheap for a staff
            // tool, and it kills the "I only see it after a refresh" class of bug.
            refetchOnMount: 'always',
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
