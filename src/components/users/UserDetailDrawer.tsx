'use client';

import { useState, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { useUserDetail, useUserActivity } from '@/features/users/use-users';
import { useBanUser, useWarnUser, useUnbanUser, useUpdateUser, useUploadAvatar, useGrantSubscription } from '@/features/users/use-user-actions';
import { useSubscriptionPlans, usePlanLabel, planLabelAr } from '@/features/plans/use-plans';
import { TransactionsTable } from '@/components/finance/TransactionsTable';
import { cn } from '@/lib/utils';

/* ── date helpers ─────────────────────────────────────────── */
const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;

function fmtMonthYear(iso: string | null) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { month: 'long', year: 'numeric' }).format(new Date(iso)).replace(BIDI, '');
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const isToday = new Date().toDateString() === d.toDateString();
  if (isToday) {
    return `اليوم، ${new Intl.DateTimeFormat(AR_GREG, { hour: 'numeric', minute: '2-digit', hour12: true }).format(d).replace(BIDI, '')}`;
  }
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short', year: 'numeric' }).format(d).replace(BIDI, '');
}

function fmtDay(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const isToday = new Date().toDateString() === d.toDateString();
  if (isToday) return 'اليوم';
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short' }).format(d).replace(BIDI, '');
}

/* ── tier helpers ─────────────────────────────────────────── */
function tierLabel(role: string) {
  if (role === 'PREMIUM') return 'ذهبي';
  if (role === 'VERIFIED') return 'موثَّق';
  return 'عادي';
}
function tierBadge(role: string) {
  if (role === 'PREMIUM') return 'bg-amber-50 text-amber-600 border-amber-200';
  if (role === 'VERIFIED') return 'bg-green/10 text-green border-green/30';
  return 'bg-surface text-muted border-border';
}
function avatarColor(role: string) {
  if (role === 'PREMIUM') return '#d98a17';
  if (role === 'VERIFIED') return '#1f9c63';
  return '#178a8a';
}

/* ── sub-components ───────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <span className="shrink-0 text-[12px] text-muted">{label}</span>
      <span className="text-start text-[13px] text-ink">{value ?? '—'}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p className="mb-0.5 text-[11px] font-semibold text-muted">{children}</p>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[12px] font-medium text-muted">{children}</label>;
}

function TextInput({
  value, onChange, placeholder, dir,
}: { value: string; onChange: (v: string) => void; placeholder?: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      dir={dir}
      className="w-full rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  );
}

const TONE_DOT: Record<string, string> = {
  success: 'bg-green',
  info:    'bg-brand',
  warning: 'bg-amber',
  danger:  'bg-red',
};

const SUB_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'نشطة',
  CANCELLED: 'ملغاة',
  EXPIRED: 'منتهية',
  PAST_DUE: 'متأخرة',
  PENDING_PAYMENT: 'معلقة',
};

// Plan labels are resolved via planLabelAr() from use-plans.ts

/* ── main component ───────────────────────────────────────── */
interface Props { userId: string | null; onClose: () => void }

export function UserDetailDrawer({ userId, onClose }: Props) {
  const { data: user, isLoading }       = useUserDetail(userId);
  const { data: activities = [] }       = useUserActivity(userId);
  const { data: plans = [] }            = useSubscriptionPlans();
  const planLabel                       = usePlanLabel();
  const ban       = useBanUser();
  const warn      = useWarnUser();
  const unban     = useUnbanUser();
  const update    = useUpdateUser();
  const grantSub  = useGrantSubscription();

  const [mode, setMode]         = useState<'view' | 'ban' | 'warn' | 'edit' | 'grant-sub'>('view');
  const [reason, setReason]     = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editGov, setEditGov]   = useState('');
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();

  const [subPlan, setSubPlan]         = useState('');
  const [subDays, setSubDays]         = useState('30');
  const [subQuota, setSubQuota]       = useState('10');
  const [showTx, setShowTx]           = useState(false);

  if (!userId) return null;

  const openEdit = () => {
    if (!user) return;
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditEmail(user.email ?? '');
    setEditRole(user.role);
    setEditGov(user.governorate ?? '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setMode('edit');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAction = async () => {
    if (!user || !reason.trim()) return;
    try {
      if (mode === 'ban')  await ban.mutateAsync({ userId: user.id, payload: { reason } });
      if (mode === 'warn') await warn.mutateAsync({ userId: user.id, payload: { reason } });
      setMode('view'); setReason('');
    } catch { /* surfaced via isError */ }
  };

  const handleUpdate = async () => {
    if (!user) return;
    try {
      if (avatarFile) {
        await uploadAvatar.mutateAsync({ userId: user.id, file: avatarFile });
      }
      await update.mutateAsync({
        userId: user.id,
        payload: {
          name: editName || undefined,
          phone: editPhone || undefined,
          email: editEmail || undefined,
          role: editRole || undefined,
          governorate: editGov || undefined,
        },
      });
      setAvatarFile(null);
      setAvatarPreview(null);
      setMode('view');
    } catch { /* surfaced via update.isError / uploadAvatar.isError */ }
  };

  const handleUnban = async () => {
    if (!user) return;
    try { await unban.mutateAsync({ userId: user.id }); } catch { /* */ }
  };

  const handleGrantSub = async () => {
    if (!user) return;
    try {
      await grantSub.mutateAsync({
        userId: user.id,
        payload: { plan: subPlan, durationDays: Number(subDays), adQuota: Number(subQuota) },
      });
      setMode('view');
    } catch { /* surfaced via grantSub.isError */ }
  };

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onClick={onClose}
    >
      <div
        className="animate-scale-in flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-[16px] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── skeleton ─────────────────────────────── */}
        {isLoading || !user ? (
          <div className="animate-pulse space-y-4 p-6">
            <div className="flex items-start gap-3">
              <div className="h-[52px] w-[52px] rounded-full bg-surface" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-32 rounded bg-surface" />
                <div className="h-3 w-20 rounded bg-surface" />
              </div>
            </div>
            <div className="h-16 rounded-[10px] bg-surface" />
            <div className="h-28 rounded-[10px] bg-surface" />
            <div className="h-28 rounded-[10px] bg-surface" />
          </div>

        /* ── EDIT MODE ──────────────────────────────── */
        ) : mode === 'edit' ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <button
                onClick={() => setMode('view')}
                className="grid h-7 w-7 place-items-center rounded-[7px] border border-border text-muted hover:bg-surface hover:text-ink"
              >
                <Icon name="x" size={14} />
              </button>
              <h3 className="text-[15px] font-semibold text-ink">تعديل بيانات المستخدم</h3>
              <div className="w-7" />
            </div>

            {/* avatar picker in edit mode */}
            <div className="flex justify-center border-b border-border py-4">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="relative cursor-pointer"
                title="تغيير الصورة"
              >
                <Avatar
                  name={user.name}
                  src={avatarPreview ?? user.avatarUrl}
                  size={72}
                  color={avatarColor(user.role)}
                />
                <span className="absolute bottom-0 end-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand text-white">
                  {uploadAvatar.isPending
                    ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <Icon name="image-frame" size={11} />
                  }
                </span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <div>
                <FieldLabel>الاسم الكامل</FieldLabel>
                <TextInput value={editName} onChange={setEditName} placeholder="الاسم الكامل" />
              </div>
              <div>
                <FieldLabel>رقم الجوال</FieldLabel>
                <TextInput value={editPhone} onChange={setEditPhone} placeholder="+966501234567" dir="ltr" />
              </div>
              <div>
                <FieldLabel>البريد الإلكتروني</FieldLabel>
                <TextInput value={editEmail} onChange={setEditEmail} placeholder="user@example.com" dir="ltr" />
              </div>
              <div>
                <FieldLabel>المستوى</FieldLabel>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                >
                  <option value="REGISTERED">عادي</option>
                  <option value="VERIFIED">موثَّق</option>
                  <option value="PREMIUM">ذهبي (بريميوم)</option>
                </select>
              </div>
              <div>
                <FieldLabel>المنطقة</FieldLabel>
                <TextInput value={editGov} onChange={setEditGov} placeholder="مثال: الرياض" />
              </div>
              {(update.isError || uploadAvatar.isError) && (
                <p className="rounded-[8px] border border-red/20 bg-red/5 px-3 py-2 text-[12.5px] text-red">
                  {((update.error || uploadAvatar.error) as Error)?.message ?? 'حدث خطأ، حاول مجدداً'}
                </p>
              )}
            </div>

            <div className="flex gap-2 border-t border-border px-5 py-4">
              <button
                onClick={() => setMode('view')}
                className="flex-1 rounded-[8px] border border-border py-2.5 text-[13px] font-medium text-ink hover:bg-surface"
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdate}
                disabled={update.isPending || uploadAvatar.isPending}
                className="flex-1 rounded-[8px] bg-teal py-2.5 text-[13px] font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
              >
                {uploadAvatar.isPending ? 'جارٍ رفع الصورة…' : update.isPending ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}
              </button>
            </div>
          </>

        /* ── VIEW MODE ──────────────────────────────── */
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">

              {/* header */}
              <div className="flex items-start gap-3 px-5 pb-4 pt-5">
                <Avatar name={user.name} src={user.avatarUrl} size={52} color={avatarColor(user.role)} />
                <div className="flex-1 text-start">
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-[6px] border px-2 py-0.5 text-[11px] font-semibold', tierBadge(user.role))}>
                      {tierLabel(user.role)}
                    </span>
                    <p className="text-[16px] font-bold text-ink">{user.name}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', user.banStatus === 'ACTIVE' ? 'bg-green' : 'bg-red')} />
                    <span className={cn('text-[11.5px] font-semibold', user.banStatus === 'ACTIVE' ? 'text-green' : 'text-red')}>
                      {user.banStatus === 'ACTIVE' ? 'نشط' : user.banStatus === 'BANNED' ? 'محظور' : 'محذَّر'}
                    </span>
                    <span className="font-mono text-[12px] text-muted">
                      {'• USR-' + user.id.slice(-4).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-border text-muted hover:bg-surface hover:text-ink"
                >
                  <Icon name="x" size={14} />
                </button>
              </div>

              {/* stats */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse divide-border border-y border-border">
                {[
                  { value: user.adsCount.toLocaleString('en-US'), label: 'الإعلانات' },
                  { value: user.subscription ? `${user.subscription.adQuotaUsed}/${user.subscription.adQuotaTotal}` : '—', label: 'حصة الاشتراك' },
                  { value: '—', label: 'الطلبات' },
                ].map(({ value, label }) => (
                  <div key={label} className="py-4 text-center">
                    <p className="text-[20px] font-bold leading-none text-teal">{value}</p>
                    <p className="mt-1 text-[11.5px] text-muted">{label}</p>
                  </div>
                ))}
              </div>

              {/* contact */}
              <div className="border-b border-border px-5 py-4">
                <SectionTitle>بيانات الاتصال</SectionTitle>
                <InfoRow label="البريد الإلكتروني" value={user.email ?? '—'} />
                <InfoRow label="رقم الجوال" value={<span dir="ltr">{user.phone}</span>} />
                <InfoRow label="الموقع" value={user.governorate ?? '—'} />
              </div>

              {/* personal */}
              <div className={cn('px-5 py-4', (user.subscription || user.banReason) ? 'border-b border-border' : '')}>
                <SectionTitle>المعلومات الشخصية</SectionTitle>
                <InfoRow label="تاريخ الانضمام" value={fmtMonthYear(user.joinedAt)} />
                <InfoRow label="آخر نشاط" value={fmtDateTime(user.lastActiveAt)} />
                {user.banStatus !== 'ACTIVE' && user.banReason && (
                  <InfoRow label="سبب الإجراء" value={<span className="text-red">{user.banReason}</span>} />
                )}
              </div>

              {/* subscription — always shown */}
              <div className="border-b border-border px-5 py-4">
                <div className="mb-0.5 flex items-center justify-between">
                  <SectionTitle>الاشتراك</SectionTitle>
                  <button
                    onClick={() => {
                      const first = plans[0];
                      setSubPlan(first?.plan ?? '');
                      setSubDays('30');
                      setSubQuota(String(first?.adQuotaTotal ?? 10));
                      setMode('grant-sub');
                    }}
                    className="rounded-[6px] border border-brand/30 px-2 py-0.5 text-[11px] font-semibold text-brand hover:bg-brand/5"
                  >
                    {user.subscription ? 'تجديد' : 'منح اشتراك'}
                  </button>
                </div>
                {user.subscription ? (
                  <>
                    <InfoRow label="الخطة" value={planLabel(user.subscription.plan)} />
                    <InfoRow
                      label="الحالة"
                      value={
                        <span className={cn(
                          'rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold',
                          user.subscription.status === 'ACTIVE' ? 'bg-green/10 text-green' : 'bg-surface text-muted',
                        )}>
                          {SUB_STATUS_LABEL[user.subscription.status] ?? user.subscription.status}
                        </span>
                      }
                    />
                    <InfoRow label="تنتهي في" value={fmtMonthYear(user.subscription.periodEnd)} />
                    <InfoRow
                      label="حصة الإعلانات"
                      value={
                        <span>
                          <span className="text-teal font-semibold">{user.subscription.adQuotaUsed}</span>
                          {' / '}{user.subscription.adQuotaTotal}
                        </span>
                      }
                    />
                  </>
                ) : (
                  <p className="py-2 text-[13px] text-muted">لا يوجد اشتراك نشط</p>
                )}
              </div>

              {/* transactions — lazy-loaded on expand (TASK-F-11.7) */}
              <div className="border-b border-border px-5 py-4">
                <button
                  type="button"
                  onClick={() => setShowTx((v) => !v)}
                  className="flex w-full items-center justify-between"
                  aria-expanded={showTx}
                >
                  <SectionTitle>المعاملات المالية</SectionTitle>
                  <Icon name={showTx ? 'chevron-up' : 'chevron-down'} size={14} className="text-muted" />
                </button>
                {showTx && (
                  <div className="mt-2">
                    <TransactionsTable userId={user.id} />
                  </div>
                )}
              </div>

              {/* activities */}
              {activities.length > 0 && (
                <div className="px-5 py-4">
                  <SectionTitle>آخر النشاطات</SectionTitle>
                  <div className="mt-2 space-y-0">
                    {activities.map((act) => (
                      <div key={act.id} className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
                        <span className="mt-1.5 text-[11px] text-muted shrink-0 font-mono w-14 text-start">
                          {fmtDay(act.createdAt)}
                        </span>
                        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TONE_DOT[act.tone] ?? 'bg-muted')} />
                        <span className="flex-1 text-[13px] text-ink">{act.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* grant subscription panel */}
            {mode === 'grant-sub' && (
              <div className="border-t border-border bg-surface/80 px-5 py-4">
                <p className="mb-3 text-[13px] font-semibold text-ink">منح اشتراك</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-muted">الخطة</label>
                    <select
                      value={subPlan}
                      onChange={(e) => {
                        setSubPlan(e.target.value);
                        const cfg = plans.find((p) => p.plan === e.target.value);
                        if (cfg) setSubQuota(String(cfg.adQuotaTotal));
                      }}
                      className="w-full rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                    >
                      {plans.map((p) => (
                        <option key={p.plan} value={p.plan}>{p.name || planLabelAr(p.plan)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-muted">المدة</label>
                    <select
                      value={subDays}
                      onChange={(e) => setSubDays(e.target.value)}
                      className="w-full rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
                    >
                      <option value="30">شهر (30 يوم)</option>
                      <option value="90">3 أشهر (90 يوم)</option>
                      <option value="180">6 أشهر (180 يوم)</option>
                      <option value="365">سنة (365 يوم)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-muted">حصة الإعلانات</label>
                    <input
                      type="number"
                      min={1}
                      value={subQuota}
                      onChange={(e) => setSubQuota(e.target.value)}
                      className="w-full rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                  </div>
                  {grantSub.isError && (
                    <p className="text-[12px] text-red">{(grantSub.error as Error)?.message ?? 'حدث خطأ، حاول مجدداً'}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleGrantSub}
                      disabled={grantSub.isPending || !subQuota || Number(subQuota) < 1}
                      className="rounded-[7px] bg-brand px-4 py-1.5 text-[12.5px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
                    >
                      {grantSub.isPending ? 'جارٍ…' : 'تأكيد'}
                    </button>
                    <button
                      onClick={() => setMode('view')}
                      className="rounded-[7px] border border-border px-4 py-1.5 text-[12.5px] text-ink hover:bg-surface"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* inline reason box */}
            {(mode === 'ban' || mode === 'warn') && (
              <div className="border-t border-border bg-surface/80 px-5 py-4">
                <p className="mb-2 text-[13px] font-semibold text-ink">
                  {mode === 'ban' ? 'سبب الحظر' : 'سبب التحذير'}
                </p>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="أدخل السبب..."
                  rows={2}
                  className="w-full resize-none rounded-[8px] border border-border bg-white px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
                {(ban.isError || warn.isError) && (
                  <p className="mt-1 text-[12px] text-red">حدث خطأ، حاول مجدداً</p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleAction}
                    disabled={!reason.trim() || ban.isPending || warn.isPending}
                    className={cn(
                      'rounded-[7px] px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-50',
                      mode === 'ban' ? 'bg-red hover:bg-red/90' : 'bg-amber hover:bg-amber/90',
                    )}
                  >
                    {ban.isPending || warn.isPending ? 'جارٍ…' : mode === 'ban' ? 'تأكيد الحظر' : 'تأكيد التحذير'}
                  </button>
                  <button
                    onClick={() => { setMode('view'); setReason(''); }}
                    className="rounded-[7px] border border-border px-4 py-1.5 text-[12.5px] text-ink hover:bg-surface"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* bottom bar */}
            <div className="flex items-center gap-2 border-t border-border px-5 py-4">
              {user.banStatus !== 'BANNED' ? (
                <button
                  onClick={() => { setMode('ban'); setReason(''); }}
                  className="rounded-[8px] border border-red/30 px-4 py-2.5 text-[13px] font-medium text-red hover:bg-red/5"
                >
                  حظر
                </button>
              ) : (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleUnban}
                    disabled={unban.isPending}
                    className="rounded-[8px] border border-green/30 px-4 py-2.5 text-[13px] font-medium text-green hover:bg-green/5 disabled:opacity-50"
                  >
                    {unban.isPending ? 'جارٍ…' : 'رفع الحظر'}
                  </button>
                  {unban.isError && (
                    <p className="text-[12px] text-red">{(unban.error as Error)?.message ?? 'تعذّر رفع الحظر، حاول مجدداً'}</p>
                  )}
                </div>
              )}

              {user.banStatus !== 'BANNED' && (
                <button
                  onClick={() => { setMode('warn'); setReason(''); }}
                  className="flex-1 rounded-[8px] border border-border py-2.5 text-[13px] font-medium text-ink hover:bg-surface"
                >
                  تحذير
                </button>
              )}

              <button
                onClick={openEdit}
                className="flex-1 rounded-[8px] bg-teal py-2.5 text-[13px] font-semibold text-white hover:bg-teal/90"
              >
                تعديل
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
