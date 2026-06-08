'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useChangeMyPassword } from '@/features/auth/use-change-password';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { path: ['confirm'], message: 'كلمتا المرور غير متطابقتين' });

type FormValues = z.infer<typeof schema>;

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const change = useChangeMyPassword();
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    try {
      await change.mutateAsync({ currentPassword: v.currentPassword, newPassword: v.newPassword });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'INVALID_CREDENTIALS') {
        setError('currentPassword', { message: 'كلمة المرور الحالية غير صحيحة' });
      } else {
        setSubmitError(e instanceof ApiError ? e.message : 'تعذّر تغيير كلمة المرور. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">تغيير كلمة المرور</h2>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink">
            <Icon name="x" size={15} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green">
              <Icon name="check" size={22} />
            </span>
            <p className="text-[14px] font-medium text-ink">تم تغيير كلمة المرور بنجاح</p>
            <button onClick={onClose} className="mt-1 rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90">تم</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
            {submitError && <p className="rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{submitError}</p>}

            <FieldWrapper label="كلمة المرور الحالية" required error={errors.currentPassword?.message}>
              <Input {...register('currentPassword')} type="password" dir="ltr" className="text-start" autoComplete="current-password" error={!!errors.currentPassword} />
            </FieldWrapper>
            <FieldWrapper label="كلمة المرور الجديدة" required error={errors.newPassword?.message}>
              <Input {...register('newPassword')} type="password" dir="ltr" className="text-start" autoComplete="new-password" error={!!errors.newPassword} />
            </FieldWrapper>
            <FieldWrapper label="تأكيد كلمة المرور" required error={errors.confirm?.message}>
              <Input {...register('confirm')} type="password" dir="ltr" className="text-start" autoComplete="new-password" error={!!errors.confirm} />
            </FieldWrapper>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface">إلغاء</button>
              <button type="submit" disabled={isSubmitting || change.isPending} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50">
                {isSubmitting || change.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
