'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';
import { routeCrumb } from '@/lib/nav';
import { AccountMenu } from '@/components/shell/AccountMenu';

const TOPBAR_BUTTON =
  'relative grid h-9 w-9 place-items-center rounded-sm border border-border bg-surface-2 text-ink-2 transition-colors hover:bg-wk-blue-50 hover:text-wk-blue';

export function Topbar() {
  const pathname = usePathname();
  const crumb = routeCrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-[18px] border-b border-border bg-surface px-6 py-3">
      <nav aria-label="مسار التنقل" className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/" className="hover:text-ink">
          وكالة
        </Link>
        <Icon name="chevron-start" size={12} className="opacity-50" />
        <span className="font-semibold text-ink">{crumb}</span>
      </nav>

      <div className="flex-1" />

      <div className="flex w-80 max-w-full items-center gap-2 rounded-sm border border-border bg-surface-2 px-[10px] py-[7px] text-muted">
        <Icon name="search" size={14} />
        <input
          type="search"
          aria-label="بحث عام"
          placeholder="بحث عن مستخدم، إعلان، بلاغ..."
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
        />
      </div>

      <button type="button" className={TOPBAR_BUTTON} aria-label="مساعدة" title="مساعدة">
        <Icon name="help" size={16} />
      </button>
      <button type="button" className={TOPBAR_BUTTON} aria-label="اللغة" title="اللغة">
        <span className="text-[11px] font-bold">ع</span>
      </button>
      <button type="button" className={cn(TOPBAR_BUTTON, 'relative')} aria-label="الإشعارات" title="الإشعارات">
        <Icon name="bell" size={16} />
        <span className="absolute end-1 top-1 h-2 w-2 rounded-full border-2 border-surface bg-wk-blue" aria-hidden="true" />
      </button>

      <span className="h-6 w-px bg-border" aria-hidden="true" />

      <AccountMenu />
    </header>
  );
}
