'use client';

import { Avatar } from '@/components/ui/Avatar';
import { StatusPill } from '@/components/ui/StatusPill';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { UserActions } from './UserActions';
import { useUsers, type UserDTO, type UsersListParams } from '@/features/users/use-users';
import { useSubscriptionPlans, usePlanLabel } from '@/features/plans/use-plans';
import { formatNumber } from '@/lib/i18n/format';
import { buildPages } from '@/lib/ui/build-pages';

function tierChip(role: string) {
  if (role === 'PREMIUM') return <Chip tone="violet"><Icon name="crown" size={11} className="inline-block me-0.5" />بريميوم</Chip>;
  if (role === 'VERIFIED') return <Chip tone="green"><Icon name="badge-check" size={11} className="inline-block me-0.5" />موثَّق</Chip>;
  return <Chip tone="gray">عادي</Chip>;
}

function subBadge(plan: string | null, isPopular: boolean, label: string) {
  if (!plan) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-[5px] border px-1.5 py-0.5 text-[10.5px] font-bold ${
      isPopular
        ? 'border-amber-200 bg-amber-50 text-amber-600'
        : 'border-brand/20 bg-brand/5 text-brand'
    }`}>
      {isPopular && <Icon name="crown" size={9} className="inline-block" />}
      {label}
    </span>
  );
}

function avatarColor(role: string) {
  if (role === 'PREMIUM') return '#7a4cc4';
  if (role === 'VERIFIED') return '#1f9c63';
  return '#5a6679';
}

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(BIDI, '');
  const time = new Intl.DateTimeFormat(AR_GREG, { hour: 'numeric', minute: '2-digit', hour12: true }).format(d).replace(BIDI, '');
  return `${date} في ${time}`;
}

interface UsersTableProps {
  params: UsersListParams;
  onView: (user: UserDTO) => void;
  onPageChange: (page: number) => void;
  selectedIds: Set<string>;
  onSelectChange: (ids: Set<string>) => void;
}

export function UsersTable({ params, onView, onPageChange, selectedIds, onSelectChange }: UsersTableProps) {
  const { data, isLoading, isError } = useUsers(params);
  const { data: plans = [] } = useSubscriptionPlans();
  const planLabel = usePlanLabel();
  const isPopularPlan = (plan: string | null) => plan ? (plans.find((p) => p.plan === plan)?.popular ?? false) : false;

  if (isError) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
        حدث خطأ أثناء تحميل البيانات
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-[var(--radius)] border border-border bg-surface">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-[56px] border-b border-border last:border-0" />
        ))}
      </div>
    );
  }

  const { items = [], total = 0, page = 1, pages = 1 } = data ?? {};
  const from = (page - 1) * 20 + 1;
  const to = Math.min(page * 20, total);

  const allSelected = items.length > 0 && items.every((u) => selectedIds.has(u.id));
  const someSelected = items.some((u) => selectedIds.has(u.id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedIds);
      items.forEach((u) => next.delete(u.id));
      onSelectChange(next);
    } else {
      const next = new Set(selectedIds);
      items.forEach((u) => next.add(u.id));
      onSelectChange(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectChange(next);
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-white">
      <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="w-8 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted">المستخدم</th>
              <th className="px-4 py-3 text-start font-medium text-muted">المستوى</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الموقع</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الإعلانات</th>
              <th className="px-4 py-3 text-start font-medium text-muted">التسجيل</th>
              <th className="px-4 py-3 text-start font-medium text-muted">آخر نشاط</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الحالة</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted">
                  لا يوجد مستخدمون
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleOne(user.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size={34} color={avatarColor(user.role)} />
                      <div>
                        <p className="font-medium text-ink">{user.name}</p>
                        <p className="font-mono text-[11px] text-muted">{user.phone ?? '—'} · #{user.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {tierChip(user.role)}
                      {subBadge(user.subscriptionPlan, isPopularPlan(user.subscriptionPlan), user.subscriptionPlan ? planLabel(user.subscriptionPlan) : '')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.governorate ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(user.adsCount)}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(user.joinedAt)}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(user.lastActiveAt)}</td>
                  <td className="px-4 py-3"><StatusPill status={user.banStatus} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onView(user)}
                        className="flex items-center gap-1 rounded-[6px] border border-border px-2 py-[5px] text-[12px] font-medium text-ink hover:bg-surface"
                      >
                        <Icon name="eye" size={12} />
                        عرض
                      </button>
                      <UserActions user={user} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-[18px] py-3 text-[12px] text-muted">
          <span>تعرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)} مستخدماً</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
            >
              <Icon name="chevron-end" size={12} />
            </button>
            {buildPages(page, pages).map((p, i) =>
              p === '...' ? (
                <button key={`ellipsis-${i}`} className="grid h-7 min-w-[28px] place-items-center rounded-[7px] border border-border bg-surface text-[12px] text-ink-2">…</button>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`grid h-7 min-w-[28px] place-items-center rounded-[7px] border px-1 text-[12px] transition-colors ${
                    p === page
                      ? 'border-brand bg-brand text-white'
                      : 'border-border bg-surface text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  {formatNumber(p)}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40"
            >
              <Icon name="chevron-start" size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
