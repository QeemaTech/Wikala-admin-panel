'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { RouteLoader } from '@/components/ui/RouteLoader';
import { useAuthStore } from '@/features/auth/auth-store';
import { useHasHydrated } from '@/features/auth/use-hydrated';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useHasHydrated();

  useEffect(() => {
    // Waiting for hydration is what makes deep links work: without it the first
    // render of /products/:id looks signed-out and redirects to /login, which
    // then sees the restored token and sends the user to / — losing the page
    // they actually asked for on every refresh and every shared link.
    if (hydrated && !accessToken) router.replace('/login');
  }, [hydrated, accessToken, router]);

  // Render nothing — not a loader — until the session is known. A visible
  // placeholder here paints over the login page during the redirect.
  if (!hydrated || !accessToken) return null;

  return (
    <>
      <RouteLoader />
      <AppShell>{children}</AppShell>
    </>
  );
}
