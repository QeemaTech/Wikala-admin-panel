'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { isNavItemActive, NAV_GROUPS } from '@/lib/nav';
import { useAuthStore } from '@/features/auth/auth-store';
import { ROLE_PERMISSIONS } from '@/features/auth/permissions';
import { useDashboard } from '@/features/dashboard/use-dashboard';
import { Avatar } from '@/components/ui/Avatar';

export function Sidebar() {
  const pathname = usePathname();
  const staff = useAuthStore((s) => s.staff);
  const { data: dashboard } = useDashboard('30d');

  const permSet = useMemo(() => {
    if (!staff) return new Set<string>();
    const fromRole = ROLE_PERMISSIONS[staff.role] ?? [];
    return new Set([...fromRole, ...(staff.permissions ?? [])]);
  }, [staff]);

  // Live queue badges from the Admin Dashboard API (Contract §7.43), keyed by
  // nav item id. Undefined while loading → the badge simply doesn't render.
  const liveCounts = useMemo<Record<string, number | undefined>>(() => {
    const q = dashboard?.queues;
    if (!q) return {};
    return {
      moderation: q.moderation,
      reports: q.reportsOpen,
      verifications: q.verificationsIndividual + q.verificationsStore,
      auctions: q.auctionsEndingToday,
      ads: q.activeAds,
    };
  }, [dashboard]);

  return (
    <aside className="sticky top-0 flex h-screen flex-col overflow-hidden border-s border-side-border bg-side-bg text-side-text">
      {/* brand */}
      <div className="flex items-center gap-3 border-b border-side-border px-[22px] pb-[18px] pt-5">
        <div className="grid h-[38px] w-[38px] place-items-center rounded-sm bg-white shadow-logo">
          <Image src="/assets/wikala-logo.png" alt="وكالة" width={26} height={26} priority />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-[0.2px] text-white">وكالة</div>
          <div className="mt-0.5 text-[11px] text-side-text-mut">لوحة التحكم الإدارية</div>
        </div>
      </div>

      {/* quick search */}
      <div className="border-b border-side-border px-4 py-[14px]">
        <div className="flex items-center gap-2 rounded-sm border border-white/[0.07] bg-white/[0.05] px-[10px] py-2">
          <Icon name="search" size={14} />
          <input
            type="search"
            aria-label="بحث سريع"
            placeholder="بحث سريع..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-side-text-mut"
          />
          <kbd className="rounded bg-white/[0.06] px-[5px] py-0.5 font-mono text-[10px] text-side-text-mut">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* navigation */}
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-[10px] pb-6 pt-[10px]">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="mt-[14px]">
            <div className="px-[14px] py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.8px] text-side-text-mut">
              {group.group}
            </div>
            {group.items.filter((item) => !item.permission || permSet.has(item.permission)).map((item) => {
              const active = isNavItemActive(pathname, item.href);
              const count = liveCounts[item.id] ?? item.count;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative mx-1 my-0.5 flex items-center gap-[11px] rounded-[9px] px-3 py-[9px] text-[13.5px] font-medium transition-colors',
                    active
                      ? 'bg-side-active text-white shadow-nav-active'
                      : 'text-side-text hover:bg-white/[0.04] hover:text-white',
                  )}
                >
                  <Icon
                    name={item.icon}
                    size={18}
                    className={cn('shrink-0', active ? 'opacity-100' : 'opacity-85')}
                  />
                  <span className="flex-1">{item.label}</span>
                  {count != null && count > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-[7px] py-px font-mono text-[10.5px] font-semibold tabular-nums',
                        item.countClass === 'danger'
                          ? 'bg-red-50 text-red-600'
                          : item.countClass === 'amber'
                            ? 'bg-amber-50 text-amber-600'
                            : item.countClass === 'info'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-white/[0.12] text-white',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-[10px] border-t border-side-border p-3">
        <div className="relative">
          <Avatar name={staff?.name ?? '؟'} size={36} square />
          <span
            className="absolute bottom-0 end-0 h-2.5 w-2.5 translate-x-0.5 translate-y-0.5 rounded-full border-2 border-side-bg bg-green-400"
            title="متصل"
            aria-label="متصل"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-white">{staff?.name ?? '—'}</div>
          <div className="mt-px truncate text-[11px] text-side-text-mut">{staff?.role ?? '—'}</div>
        </div>
      </div>
    </aside>
  );
}
