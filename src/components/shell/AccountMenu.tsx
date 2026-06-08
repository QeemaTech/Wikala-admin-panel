'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/features/auth/auth-store';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { roleLabel } from '@/features/staff/labels';

export function AccountMenu() {
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const logout = useAuthStore((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-[10px] rounded-sm px-1.5 py-1 transition-colors hover:bg-surface-2"
        aria-label="قائمة المستخدم"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={staff?.name ?? '؟'} size={34} square />
        <span className="text-start">
          <span className="block text-[13px] font-semibold text-ink">{staff?.name ?? '—'}</span>
          <span className="block text-[11px] text-muted">{staff ? roleLabel(staff.role) : '—'}</span>
        </span>
        <Icon name="chevron-down" size={14} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div role="menu" className="absolute end-0 top-full z-40 mt-2 w-56 rounded-[10px] border border-border bg-white py-1 shadow-lg">
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-[13px] font-semibold text-ink">{staff?.name}</p>
            <p className="truncate font-mono text-[11px] text-muted" dir="ltr">{staff?.email}</p>
          </div>
          <button
            onClick={() => { setPwOpen(true); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-surface"
          >
            <Icon name="lock" size={14} />
            تغيير كلمة المرور
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red hover:bg-surface"
          >
            <Icon name="log-out" size={14} />
            تسجيل الخروج
          </button>
        </div>
      )}

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}
