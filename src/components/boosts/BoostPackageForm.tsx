'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input, Select, Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useUpdateBoostPackage } from '@/features/boosts/use-boost-mutations';
import { boostPackageLabel, type BoostPackageDTO } from '@/features/boosts/use-boosts';

const CURRENCIES = ['EGP', 'SAR', 'AED', 'USD'] as const;
const PLACEMENTS = ['TOP_SEARCH', 'TOP_FEED', 'CATEGORY_TOP'] as const;
const BADGES = ['NONE', 'GOLD', 'FLAME', 'URGENT'] as const;

const PLACEMENT_LABEL: Record<(typeof PLACEMENTS)[number], string> = {
  TOP_SEARCH: 'ظهور دائم في أعلى نتائج البحث',
  TOP_FEED: 'ظهور في أعلى الصفحة الرئيسية',
  CATEGORY_TOP: 'ظهور أسرع لمشتري الفئة',
};
const BADGE_LABEL: Record<(typeof BADGES)[number], string> = {
  NONE: 'بدون شارة',
  GOLD: 'تمييز ذهبي على الإعلان',
  FLAME: 'تمييز شعلة حمراء',
  URGENT: 'شارة "عاجل" بجانب الإعلان',
};

export const boostPackageSchema = z.object({
  price: z.coerce
    .number({ invalid_type_error: 'أدخل سعرًا صحيحًا' })
    .positive('السعر يجب أن يكون موجبًا'),
  currency: z.enum(CURRENCIES),
  durationDays: z.coerce
    .number({ invalid_type_error: 'أدخل عدد أيام صحيحًا' })
    .int('عدد الأيام عدد صحيح')
    .min(1, 'المدة لا تقل عن يوم واحد'),
  placement: z.enum(PLACEMENTS),
  badge: z.enum(BADGES),
  pushToFollowers: z.boolean(),
  marketingBullets: z.array(z.string()).default([]),
});

export type BoostPackageFormValues = z.output<typeof boostPackageSchema>;

interface BoostPackageFormProps {
  pkg: BoostPackageDTO;
  onClose: () => void;
}

export function BoostPackageForm({ pkg, onClose }: BoostPackageFormProps) {
  const update = useUpdateBoostPackage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bullets, setBullets] = useState<string[]>(pkg.marketingBullets ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useZodForm(boostPackageSchema, {
    defaultValues: {
      price: pkg.priceMinor / 100,
      currency: (pkg.currency as (typeof CURRENCIES)[number]) ?? 'EGP',
      durationDays: pkg.durationDays,
      placement: pkg.placement,
      badge: pkg.badge,
      pushToFollowers: pkg.pushToFollowers,
      marketingBullets: pkg.marketingBullets ?? [],
    },
  });

  const pushToFollowers = watch('pushToFollowers');

  const syncBullets = (next: string[]) => {
    setBullets(next);
    setValue('marketingBullets', next);
  };
  const updateBullet = (i: number, value: string) => syncBullets(bullets.map((b, idx) => (idx === i ? value : b)));
  const addBullet = () => syncBullets([...bullets, '']);
  const removeBullet = (i: number) => syncBullets(bullets.filter((_, idx) => idx !== i));

  const onSubmit = handleSubmit(async (v: BoostPackageFormValues) => {
    setSubmitError(null);
    clearErrors();
    try {
      await update.mutateAsync({
        pkg: pkg.package,
        payload: {
          priceMinor: Math.round(v.price * 100),
          currency: v.currency,
          durationDays: v.durationDays,
          placement: v.placement,
          badge: v.badge,
          pushToFollowers: v.pushToFollowers,
          marketingBullets: (v.marketingBullets ?? []).map((b) => b.trim()).filter(Boolean),
        },
      });
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ الباقة. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">تعديل باقة {boostPackageLabel(pkg.package)}</h3>
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
          <div className="grid grid-cols-3 gap-3">
            <FieldWrapper label="السعر" required error={errors.price?.message}>
              <Input type="number" step="0.01" {...register('price')} error={!!errors.price} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="العملة" required error={errors.currency?.message}>
              <Select {...register('currency')} error={!!errors.currency}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="المدة (أيام)" required error={errors.durationDays?.message}>
              <Input type="number" min={1} step="1" {...register('durationDays')} error={!!errors.durationDays} className="font-mono" />
            </FieldWrapper>
          </div>

          <FieldWrapper label="مكان ظهور الإعلان المعزّز" required error={errors.placement?.message}>
            <Select {...register('placement')} error={!!errors.placement}>
              {PLACEMENTS.map((p) => (
                <option key={p} value={p}>{PLACEMENT_LABEL[p]}</option>
              ))}
            </Select>
          </FieldWrapper>

          <FieldWrapper label="شارة التمييز" required error={errors.badge?.message}>
            <Select {...register('badge')} error={!!errors.badge}>
              {BADGES.map((b) => (
                <option key={b} value={b}>{BADGE_LABEL[b]}</option>
              ))}
            </Select>
          </FieldWrapper>

          <div className="rounded-[8px] border border-border bg-surface-2/40 px-3.5 py-3">
            <Switch checked={pushToFollowers} onChange={(c) => setValue('pushToFollowers', c)} label="إرسال إشعار فوري لمتابعي البائع" />
          </div>

          <FieldWrapper label="عبارات تسويقية إضافية (اختياري)" hint="إحصاءات أو عبارات حرة تُعرض أسفل المزايا — مثل: مشاهدات +320%">
            <div className="space-y-2">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={b} onChange={(e) => updateBullet(i, e.target.value)} placeholder="مثال: مناسب لإعلانات سريعة الإغلاق" />
                  <button
                    type="button"
                    onClick={() => removeBullet(i)}
                    aria-label="حذف العبارة"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] border border-border text-muted hover:bg-surface-2 hover:text-red"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBullet}
                className="flex items-center gap-1.5 rounded-[8px] border border-dashed border-border px-3 py-2 text-[12.5px] font-medium text-ink-2 hover:bg-surface-2"
              >
                <Icon name="plus" size={13} /> إضافة عبارة
              </button>
            </div>
          </FieldWrapper>

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
              {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
