'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useBanUser, useWarnUser, useUnbanUser, useSetUserPassword } from '@/features/users/use-user-actions';
import { ApiError } from '@/lib/api/errors';
import type { UserDTO } from '@/features/users/use-users';

interface UserActionsProps {
  user: UserDTO;
}

export function UserActions({ user }: UserActionsProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'ban' | 'warn' | null>(null);
  const [reason, setReason] = useState('');
  const [pwOpen, setPwOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const ban = useBanUser();
  const warn = useWarnUser();
  const unban = useUnbanUser();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleAction = async () => {
    if (!reason.trim()) return;
    if (mode === 'ban') await ban.mutateAsync({ userId: user.id, payload: { reason } });
    if (mode === 'warn') await warn.mutateAsync({ userId: user.id, payload: { reason } });
    setMode(null);
    setReason('');
    setOpen(false);
  };

  const handleUnban = async () => {
    await unban.mutateAsync({ userId: user.id });
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid h-7 w-7 place-items-center rounded-[6px] text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        aria-label="إجراءات"
      >
        <Icon name="more-v" size={15} />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-30 mt-1 w-48 rounded-[10px] border border-border bg-white py-1 shadow-lg">
          <button
            onClick={() => { setPwOpen(true); setOpen(false); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-surface"
          >
            <Icon name="lock" size={14} />
            تعيين كلمة المرور
          </button>
          <div className="my-1 h-px bg-border" />
          {user.banStatus === 'ACTIVE' || user.banStatus === 'WARNED' ? (
            <>
              <button
                onClick={() => { setMode('warn'); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-amber hover:bg-surface"
              >
                <Icon name="shield-alert" size={14} />
                تحذير
              </button>
              <button
                onClick={() => { setMode('ban'); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-red hover:bg-surface"
              >
                <Icon name="lock" size={14} />
                حظر
              </button>
            </>
          ) : null}
          {user.banStatus !== 'ACTIVE' && (
            <button
              onClick={handleUnban}
              disabled={unban.isPending}
              className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-green hover:bg-surface disabled:opacity-50"
            >
              <Icon name="check" size={14} />
              رفع الحظر
            </button>
          )}
        </div>
      )}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
            <h3 className="mb-3 text-[15px] font-semibold text-ink">
              {mode === 'ban' ? 'حظر المستخدم' : 'تحذير المستخدم'}
            </h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب الإجراء..."
              rows={3}
              className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 resize-none"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => { setMode(null); setReason(''); }}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
              >
                إلغاء
              </button>
              <button
                onClick={handleAction}
                disabled={!reason.trim() || ban.isPending || warn.isPending}
                className={cn(
                  'rounded-[8px] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50',
                  mode === 'ban' ? 'bg-red hover:bg-red/90' : 'bg-amber hover:bg-amber/90',
                )}
              >
                {mode === 'ban' ? 'حظر' : 'تحذير'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pwOpen && <SetUserPasswordModal user={user} onClose={() => setPwOpen(false)} />}
    </div>
  );
}

function SetUserPasswordModal({ user, onClose }: { user: UserDTO; onClose: () => void }) {
  const setPassword = useSetUserPassword();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (pw.length < 8) { setErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (pw !== confirm) { setErr('كلمتا المرور غير متطابقتين'); return; }
    try {
      await setPassword.mutateAsync({ userId: user.id, password: pw });
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'تعذّر تعيين كلمة المرور. حاول مرة أخرى.');
    }
  };

  const inputCls =
    'w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2.5 text-start text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <h3 className="mb-1 text-[15px] font-semibold text-ink">تعيين كلمة المرور</h3>
        <p className="mb-4 text-[12.5px] text-muted">للمستخدم: {user.name}</p>

        {err && <p className="mb-3 rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{err}</p>}

        <div className="space-y-3">
          <input type="password" dir="ltr" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="كلمة المرور الجديدة" className={inputCls} />
          <input type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="تأكيد كلمة المرور" className={inputCls} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface">إلغاء</button>
          <button onClick={submit} disabled={setPassword.isPending} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50">
            {setPassword.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
