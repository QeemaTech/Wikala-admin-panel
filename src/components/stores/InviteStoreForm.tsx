'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input, Select } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useCategories } from '@/features/categories/use-categories';
import { useInviteStore, type InviteStoreResult } from '@/features/stores/use-store-mutations';

const schema = z.object({
  phoneE164: z.string().regex(/^\+[1-9]\d{6,14}$/, 'رقم هاتف بصيغة دولية (مثال: ‎+201234567890)'),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  suggestedName: z.string().max(60, 'الاسم طويل جداً').optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface InviteStoreFormProps {
  onClose: () => void;
}

export function InviteStoreForm({ onClose }: InviteStoreFormProps) {
  const invite = useInviteStore();
  const { data: cats } = useCategories();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteStoreResult | null>(null);
  const [copied, setCopied] = useState(false);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — link stays visible to copy manually */
    }
  };

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: { phoneE164: '', email: '', suggestedName: '', categoryId: '' },
  });

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    try {
      const res = await invite.mutateAsync({
        phoneE164: v.phoneE164,
        email: v.email || undefined,
        suggestedName: v.suggestedName || undefined,
        categories: v.categoryId ? [v.categoryId] : undefined,
      });
      setResult(res);
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر إرسال الدعوة. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">دعوة متجر جديد</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={16} />
          </button>
        </div>

        {result ? (
          <div className="space-y-3">
            {result.emailSent ? (
              <p className="flex items-center gap-2 rounded-[8px] bg-green-50 p-3 text-[13px] text-green">
                <Icon name="send" size={16} />
                <span>تم إرسال رابط التسجيل بالبريد إلى <b dir="ltr">{result.email}</b>.</span>
              </p>
            ) : (
              <p className="rounded-[8px] bg-amber-50 p-3 text-[13px] text-amber">
                تم إنشاء الدعوة لـ <b dir="ltr">{result.phoneE164}</b> — شارك رابط التسجيل مع التاجر.
              </p>
            )}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[12.5px] font-medium text-ink-2">
                  رابط التسجيل {result.emailSent && <span className="font-normal text-muted">(للمشاركة)</span>}
                </p>
                <button
                  type="button"
                  onClick={() => copyLink(result.inviteUrl)}
                  className="flex items-center gap-1 rounded-[6px] px-2 py-1 text-[12px] font-medium text-wk-blue hover:bg-surface-2"
                >
                  <Icon name={copied ? 'check' : 'doc'} size={14} />
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
              <code dir="ltr" className="block break-all rounded-[8px] bg-surface-2 p-2.5 text-start font-mono text-[12px] text-ink">{result.inviteUrl}</code>
            </div>
            <p className="text-[12px] text-muted">{result.note}</p>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className="rounded-[8px] bg-wk-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90">تم</button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3.5">
            {submitError && <p className="rounded-[8px] bg-red-50 p-2.5 text-[12.5px] text-red">{submitError}</p>}

            <FieldWrapper label="رقم الهاتف" required error={errors.phoneE164?.message} hint="بصيغة دولية E.164">
              <Input {...register('phoneE164')} error={!!errors.phoneE164} dir="ltr" className="text-start font-mono" placeholder="+201234567890" />
            </FieldWrapper>

            <FieldWrapper label="البريد الإلكتروني" error={errors.email?.message}>
              <Input {...register('email')} error={!!errors.email} dir="ltr" className="text-start" placeholder="store@example.com" />
            </FieldWrapper>

            <FieldWrapper label="اسم المتجر المقترح" error={errors.suggestedName?.message}>
              <Input {...register('suggestedName')} error={!!errors.suggestedName} placeholder="مثال: Elite Mobile" />
            </FieldWrapper>

            <FieldWrapper label="الفئة المستهدفة" error={errors.categoryId?.message}>
              <Select {...register('categoryId')} error={!!errors.categoryId}>
                <option value="">— اختر فئة (اختياري) —</option>
                {(cats?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.nameAr}</option>
                ))}
              </Select>
            </FieldWrapper>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-3.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2">إلغاء</button>
              <button type="submit" disabled={isSubmitting} className="rounded-[8px] bg-wk-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50">
                إرسال الدعوة
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
