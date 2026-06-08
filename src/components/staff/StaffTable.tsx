'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { useStaff, type StaffMember } from '@/features/staff/use-staff';
import { useReset2FA } from '@/features/staff/use-2fa-reset';
import { useSuspendStaff, useDeleteStaff, useSetStaffPassword } from '@/features/staff/use-staff-mutations';
import { SetPasswordDialog } from '@/components/ui/SetPasswordDialog';
import { ROLE_PERMISSIONS } from '@/features/auth/permissions';
import { useAuthStore } from '@/features/auth/auth-store';
import { STAFF_PERMISSIONS, roleLabel } from '@/features/staff/labels';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const PERM_LABEL = new Map(STAFF_PERMISSIONS.map((p) => [p.value, p.label]));

/** Localized "time ago" for the last-activity column. */
function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return 'الآن';
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  return rtf.format(Math.round(diffSec / 86400), 'day');
}

/** Effective permission labels for display: explicit set, else role defaults. */
function effectivePermissionLabels(member: StaffMember): string[] {
  const source = member.permissions.length > 0 ? member.permissions : ROLE_PERMISSIONS[member.role] ?? [];
  return source.map((p) => PERM_LABEL.get(p) ?? p);
}

function joinYear(iso: string | null): string {
  if (!iso) return '—';
  return String(new Date(iso).getFullYear());
}

interface StaffRowMenuProps {
  member: StaffMember;
  onPermissions: (m: StaffMember) => void;
}

function StaffRowMenu({ member, onPermissions }: StaffRowMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [confirm, setConfirm] = useState<'2fa' | 'suspend' | 'delete' | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const role = useAuthStore((s) => s.staff?.role);
  const isSuper = role === 'SUPER_ADMIN';

  const reset2fa = useReset2FA();
  const suspend = useSuspendStaff();
  const remove = useDeleteStaff();
  const setPassword = useSetStaffPassword();

  const MENU_W = 192; // w-48

  const openMenu = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - MENU_W - 8);
    setCoords({ top: r.bottom + 6, left });
    setOpen(true);
  };

  // The menu renders in a portal (so the table's overflow-hidden can't clip it),
  // hence outside-click must check both the trigger and the portaled menu, and
  // any scroll/resize invalidates the captured coordinates.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className="grid h-7 w-7 place-items-center rounded-[6px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        aria-label="إجراءات"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="more-v" size={14} />
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', top: coords.top, left: coords.left, width: MENU_W }}
          className="z-[80] rounded-[10px] border border-border bg-white py-1 shadow-lg"
        >
          <button
            onClick={() => { onPermissions(member); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-surface"
          >
            <Icon name="shield-check" size={14} />
            تعديل الصلاحيات
          </button>
          <button
            onClick={() => { setPwOpen(true); setOpen(false); }}
            disabled={!isSuper}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-surface disabled:opacity-40"
            title={isSuper ? undefined : 'مقصور على المدير العام'}
          >
            <Icon name="lock" size={14} />
            تعيين كلمة المرور
          </button>
          <button
            onClick={() => { setConfirm('2fa'); setOpen(false); }}
            disabled={!isSuper}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-amber hover:bg-surface disabled:opacity-40"
            title={isSuper ? undefined : 'مقصور على المدير العام'}
          >
            <Icon name="refresh" size={14} />
            إعادة تعيين 2FA
          </button>
          {member.status !== 'suspended' && member.status !== 'disabled' && (
            <button
              onClick={() => { setConfirm('suspend'); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-surface"
            >
              <Icon name="lock" size={14} />
              إيقاف الحساب
            </button>
          )}
          <button
            onClick={() => { setConfirm('delete'); setOpen(false); }}
            disabled={!isSuper}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red hover:bg-surface disabled:opacity-40"
            title={isSuper ? undefined : 'مقصور على المدير العام'}
          >
            <Icon name="trash" size={14} />
            حذف العضو
          </button>
        </div>,
        document.body,
      )}

      {confirm === '2fa' && (
        <ConfirmDialog
          title="إعادة تعيين التحقق بخطوتين"
          message={`سيُطلب من ${member.name} إعادة تسجيل 2FA عند تسجيل الدخول التالي. هل تريد المتابعة؟`}
          confirmLabel="إعادة التعيين"
          tone="amber"
          loading={reset2fa.isPending}
          error={reset2fa.isError ? (reset2fa.error as Error)?.message : null}
          onConfirm={async () => { await reset2fa.mutateAsync(member.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'suspend' && (
        <ConfirmDialog
          title="إيقاف الحساب"
          message={`سيتم إنهاء جلسات ${member.name} وإيقاف وصوله. هل تريد المتابعة؟`}
          confirmLabel="إيقاف"
          tone="red"
          loading={suspend.isPending}
          error={suspend.isError ? (suspend.error as Error)?.message : null}
          onConfirm={async () => { await suspend.mutateAsync(member.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="حذف العضو"
          message={`سيتم تعطيل حساب ${member.name} نهائياً. هل تريد المتابعة؟`}
          confirmLabel="حذف"
          tone="red"
          loading={remove.isPending}
          error={remove.isError ? (remove.error as Error)?.message : null}
          onConfirm={async () => { await remove.mutateAsync(member.id); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {pwOpen && (
        <SetPasswordDialog
          subjectLabel={`للعضو: ${member.name}`}
          pending={setPassword.isPending}
          onSubmit={(password) => setPassword.mutateAsync({ id: member.id, password })}
          onClose={() => setPwOpen(false)}
        />
      )}
    </div>
  );
}

interface StaffTableProps {
  onEdit: (m: StaffMember) => void;
  onPermissions: (m: StaffMember) => void;
}

export function StaffTable({ onEdit, onPermissions }: StaffTableProps) {
  const { data: staff, isLoading, isError } = useStaff();

  if (isError) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
        تعذّر تحميل فريق الإدارة. يرجى تحديث الصفحة.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-[var(--radius)] border border-border bg-surface">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[60px] border-b border-border last:border-0" />
        ))}
      </div>
    );
  }

  const members = staff ?? [];

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-start font-medium text-muted">العضو</th>
            <th className="px-4 py-3 text-start font-medium text-muted">الدور</th>
            <th className="px-4 py-3 text-start font-medium text-muted">الصلاحيات</th>
            <th className="px-4 py-3 text-start font-medium text-muted">آخر نشاط</th>
            <th className="px-4 py-3 text-start font-medium text-muted">2FA</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {members.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-muted">لا يوجد أعضاء في الفريق بعد</td>
            </tr>
          ) : (
            members.map((m) => {
              const perms = effectivePermissionLabels(m);
              const shown = perms.slice(0, 4);
              const extra = perms.length - shown.length;
              return (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} size={36} />
                      <div>
                        <p className="font-medium text-ink">{m.name}</p>
                        <p className="text-[11.5px] text-muted">عضو منذ {joinYear(m.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-0.5 text-[11.5px] font-medium text-white">
                      {roleLabel(m.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {shown.map((p) => <Chip key={p} tone="gray">{p}</Chip>)}
                      {extra > 0 && <Chip tone="gray">+{extra}</Chip>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{relativeTime(m.lastActiveAt)}</td>
                  <td className="px-4 py-3">
                    {m.twoFactorEnabled ? (
                      <Chip tone="green" dot>مُفعّل</Chip>
                    ) : (
                      <Chip tone="gray">غير مُفعّل</Chip>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEdit(m)}
                        className="flex items-center gap-1 rounded-[6px] border border-border px-2 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
                      >
                        <Icon name="pencil" size={12} />
                        تعديل
                      </button>
                      <StaffRowMenu member={m} onPermissions={onPermissions} />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
