import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
  },
});

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={testQueryClient}>
      <div dir="rtl" lang="ar">
        {children}
      </div>
    </QueryClientProvider>
  );
}

/**
 * Renders a component wrapped in the providers used app-wide (TanStack Query)
 * inside an RTL/Arabic `dir` context — matching the real runtime environment.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from '@testing-library/react';
