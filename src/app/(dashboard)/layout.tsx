'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import { RouteLoader } from '@/components/ui/RouteLoader';
import { useAuthStore } from '@/features/auth/auth-store';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <>
      <RouteLoader />
      <AppShell>{children}</AppShell>
    </>
  );
}
