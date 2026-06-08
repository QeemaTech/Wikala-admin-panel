'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';

interface SetPasswordDialogProps {
  title?: string;
  subjectLabel: string;
  pending?: boolean;
  onSubmit: (password: string) => Promise<unknown>;
  onClose: () => void;
}

const INPUT_CLS =
  'w-full rounded-[8px] border border-border bg-surface-2 px-3 py-2.5 text-start text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/10';

/** Reusable "set / reset password" modal: new + confirm, min-8 + match checks. */
export function SetPasswordDialog({ title = 'تعيين كلمة المرور', subjectLabel, pending = false, onSubmit, onClose }: SetPasswordDialogProps) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (pw.length < 8) { setErr('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (pw !== confirm) { setErr('كلمتا المرور غير متطابقتين'); return; }
    try {
      await onSubmit(pw);
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'تعذّر تعيين كلمة المرور. حاول مرة أخرى.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink">
            <Icon name="x" size={15} />
          </button>
        </div>
        <p className="mb-4 text-[12.5px] text-muted">{subjectLabel}</p>

        {err && <p className="mb-3 rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{err}</p>}

        <div className="space-y-3">
          <input type="password" dir="ltr" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="كلمة المرور الجديدة" className={INPUT_CLS} />
          <input type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="تأكيد كلمة المرور" className={INPUT_CLS} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface">إلغاء</button>
          <button onClick={submit} disabled={pending} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50">
            {pending ? 'جارٍ الحفظ…' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}
