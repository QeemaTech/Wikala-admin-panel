'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { toDatetimeLocalInput } from '@/lib/i18n/format';
import { FieldWrapper, Input, Select, Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useCreateCoupon, useUpdateCoupon, type CouponDTO } from '@/features/coupons/use-coupons';

/**
 * `z.coerce.number()` reads an empty input as `0`, which for `maxDiscount` would
 * cap every discount at zero. Blank becomes `undefined` before coercion.
 */
const blankToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

const schema = z
  .object({
    code: z
      .string()
      .min(3, 'الرمز من 3 إلى 32 حرفًا')
      .max(32, 'الرمز من 3 إلى 32 حرفًا')
      .regex(/^[A-Za-z0-9_-]+$/, 'حروف إنجليزية وأرقام وشرطات فقط'),
    type: z.enum(['PERCENT', 'FIXED']),
    /** Percent points for PERCENT, major currency units for FIXED. */
    value: blankToUndefined(
      z.coerce.number({ required_error: 'القيمة مطلوبة' }).min(1, 'يجب أن تكون أكبر من صفر'),
    ),
    minSubtotal: blankToUndefined(z.coerce.number().min(0).optional()),
    maxDiscount: blankToUndefined(z.coerce.number().min(0).optional()),
    usageLimit: blankToUndefined(z.coerce.number().int().min(0).optional()),
    perUserLimit: blankToUndefined(z.coerce.number().int().min(0).optional()),
    startsAt: z.string().optional().or(z.literal('')),
    endsAt: z.string().optional().or(z.literal('')),
  })
  .refine((d) => d.type !== 'PERCENT' || (d.value >= 1 && d.value <= 100), {
    message: 'النسبة يجب أن تكون بين 1 و 100',
    path: ['value'],
  })
  .refine((d) => !d.startsAt || !d.endsAt || new Date(d.endsAt) > new Date(d.startsAt), {
    message: 'تاريخ الانتهاء يجب أن يكون بعد البدء',
    path: ['endsAt'],
  });

type FormValues = z.output<typeof schema>;

const toMinor = (major: number | string | undefined | null): number | null => {
  if (major === '' || major === undefined || major === null) return null;
  return Math.round(Number(major) * 100);
};
const toMajor = (minor: number | null | undefined): string =>
  minor == null ? '' : String(minor / 100);

interface CouponFormProps {
  coupon?: CouponDTO | null;
  onClose: () => void;
}

export function CouponForm({ coupon, onClose }: CouponFormProps) {
  const isEdit = !!coupon;
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const [active, setActive] = useState(coupon?.active ?? true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, {
    defaultValues: {
      code: coupon?.code ?? '',
      type: coupon?.type ?? 'PERCENT',
      // FIXED coupons store minor units; PERCENT stores plain percentage points.
      value: (coupon
        ? coupon.type === 'FIXED'
          ? toMajor(coupon.value)
          : String(coupon.value)
        : '') as unknown as number,
      minSubtotal: toMajor(coupon?.minSubtotalMinor) as unknown as number,
      maxDiscount: toMajor(coupon?.maxDiscountMinor) as unknown as number,
      usageLimit: (coupon?.usageLimit ?? '') as unknown as number,
      perUserLimit: (coupon?.perUserLimit ?? 1) as unknown as number,
      startsAt: toDatetimeLocalInput(coupon?.startsAt ?? null),
      endsAt: toDatetimeLocalInput(coupon?.endsAt ?? null),
    },
  });

  const type = watch('type');

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    const payload = {
      type: v.type,
      value: v.type === 'FIXED' ? (toMinor(v.value) ?? 0) : Number(v.value),
      minSubtotalMinor: toMinor(v.minSubtotal) ?? 0,
      maxDiscountMinor: toMinor(v.maxDiscount),
      usageLimit: v.usageLimit ?? 0,
      perUserLimit: v.perUserLimit ?? 1,
      startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null,
      endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null,
      active,
    };
    try {
      // The code is the identity buyers type — it is set once, never edited.
      if (coupon) await update.mutateAsync({ id: coupon.id, payload });
      else await create.mutateAsync({ ...payload, code: v.code.toUpperCase() });
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ الكوبون. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">
            {isEdit ? 'تعديل الكوبون' : 'إنشاء كوبون'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FieldWrapper
            label="رمز الكوبون"
            required
            hint={isEdit ? 'لا يمكن تعديل الرمز بعد الإنشاء' : 'يُحوَّل إلى حروف كبيرة تلقائيًا'}
            error={errors.code?.message}
          >
            <Input
              {...register('code')}
              disabled={isEdit}
              dir="ltr"
              className="text-start font-mono uppercase disabled:opacity-60"
              error={!!errors.code}
            />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="نوع الخصم" required error={errors.type?.message}>
              <Select {...register('type')} error={!!errors.type}>
                <option value="PERCENT">نسبة مئوية</option>
                <option value="FIXED">مبلغ ثابت</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper
              label={type === 'PERCENT' ? 'النسبة (%)' : 'قيمة الخصم'}
              required
              error={errors.value?.message}
            >
              <Input
                type="number"
                min={1}
                step={type === 'PERCENT' ? '1' : '0.01'}
                {...register('value')}
                error={!!errors.value}
                className="font-mono"
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper
              label="حد أدنى للطلب"
              hint="اتركه فارغًا لبدون حد"
              error={errors.minSubtotal?.message}
            >
              <Input type="number" min={0} step="0.01" {...register('minSubtotal')} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper
              label="أقصى خصم"
              hint="سقف الخصم للنسبة المئوية"
              error={errors.maxDiscount?.message}
            >
              <Input type="number" min={0} step="0.01" {...register('maxDiscount')} className="font-mono" />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper
              label="حد الاستخدام الكلي"
              hint="0 = غير محدود"
              error={errors.usageLimit?.message}
            >
              <Input type="number" min={0} step="1" {...register('usageLimit')} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="حد الاستخدام لكل مستخدم" error={errors.perUserLimit?.message}>
              <Input type="number" min={0} step="1" {...register('perUserLimit')} className="font-mono" />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="يبدأ في" error={errors.startsAt?.message}>
              <Input type="datetime-local" {...register('startsAt')} />
            </FieldWrapper>
            <FieldWrapper label="ينتهي في" error={errors.endsAt?.message}>
              <Input type="datetime-local" {...register('endsAt')} error={!!errors.endsAt} />
            </FieldWrapper>
          </div>

          <Switch checked={active} onChange={setActive} label="مفعّل" />

          {submitError && <p className="text-[12.5px] text-red">{submitError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-60"
            >
              {isSubmitting ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء الكوبون'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
