'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input, Select, Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useCreatePlan, useUpdatePlan } from '@/features/plans/use-plan-mutations';
import { planLabelAr, type AdminPlanDTO } from '@/features/plans/use-plans';

const CURRENCIES = ['EGP', 'SAR', 'AED', 'USD'] as const;
const SEARCH_PLACEMENTS = ['STANDARD', 'BOOSTED', 'TOP'] as const;
const ANALYTICS_LEVELS = ['BASIC', 'ADVANCED'] as const;
const SUPPORT_LEVELS = ['EMAIL', 'PRIORITY'] as const;

const SEARCH_LABEL: Record<(typeof SEARCH_PLACEMENTS)[number], string> = {
  STANDARD: 'ظهور قياسي في نتائج البحث',
  BOOSTED: 'ظهور معزز في نتائج البحث',
  TOP: 'ظهور في أعلى نتائج البحث',
};
const ANALYTICS_LABEL: Record<(typeof ANALYTICS_LEVELS)[number], string> = {
  BASIC: 'تحليلات أساسية',
  ADVANCED: 'تحليلات متقدمة لكل إعلان',
};
const SUPPORT_LABEL: Record<(typeof SUPPORT_LEVELS)[number], string> = {
  EMAIL: 'دعم عبر البريد الإلكتروني',
  PRIORITY: 'دعم بأولوية عبر البريد الإلكتروني',
};

// `plan` (code) is required + format-checked only when creating; in edit mode it
// is fixed and never re-sent.
function buildSchema(isCreate: boolean) {
  return z
    .object({
      plan: z.string().trim().optional(),
      name: z.string().trim().min(1, 'اسم الخطة مطلوب').max(60, 'الاسم لا يتجاوز 60 حرفًا'),
      price: z.coerce
        .number({ invalid_type_error: 'أدخل سعرًا صحيحًا' })
        .positive('السعر يجب أن يكون موجبًا'),
      currency: z.enum(CURRENCIES),
      adQuotaTotal: z.coerce
        .number({ invalid_type_error: 'أدخل عدد إعلانات صحيحًا' })
        .int('الحصة عدد صحيح')
        .min(1, 'الحصة لا تقل عن إعلان واحد'),
      dealRadarLimit: z.coerce
        .number({ invalid_type_error: 'أدخل رقمًا صحيحًا' })
        .int('القيمة عدد صحيح')
        .min(0, 'لا تقل عن صفر'),
      searchPlacement: z.enum(SEARCH_PLACEMENTS),
      analyticsLevel: z.enum(ANALYTICS_LEVELS),
      supportLevel: z.enum(SUPPORT_LEVELS),
      verifiedBadge: z.boolean(),
      popular: z.boolean(),
      marketingBullets: z.array(z.string()).default([]),
    })
    .superRefine((val, ctx) => {
      if (isCreate && !/^[A-Za-z0-9_]{2,20}$/.test(val.plan ?? '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['plan'],
          message: 'الرمز: 2–20 حرفًا إنجليزيًا أو أرقامًا أو شرطة سفلية',
        });
      }
    });
}

type PlanFormValues = z.output<ReturnType<typeof buildSchema>>;

interface PlanFormProps {
  /** Omit / null → create mode. */
  plan?: AdminPlanDTO | null;
  onClose: () => void;
}

export function PlanForm({ plan, onClose }: PlanFormProps) {
  const isCreate = !plan;
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bullets, setBullets] = useState<string[]>(plan?.marketingBullets ?? []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useZodForm(buildSchema(isCreate), {
    defaultValues: {
      plan: plan?.plan ?? '',
      name: plan?.name ?? '',
      price: plan ? plan.priceMinor / 100 : undefined,
      currency: (plan?.currency as (typeof CURRENCIES)[number]) ?? 'EGP',
      adQuotaTotal: plan?.adQuotaTotal ?? 5,
      dealRadarLimit: plan?.dealRadarLimit ?? 0,
      searchPlacement: plan?.searchPlacement ?? 'STANDARD',
      analyticsLevel: plan?.analyticsLevel ?? 'BASIC',
      supportLevel: plan?.supportLevel ?? 'EMAIL',
      verifiedBadge: plan?.verifiedBadge ?? false,
      popular: plan?.popular ?? false,
      marketingBullets: plan?.marketingBullets ?? [],
    },
  });

  const verifiedBadge = watch('verifiedBadge');
  const popular = watch('popular');

  const syncBullets = (next: string[]) => {
    setBullets(next);
    setValue('marketingBullets', next);
  };
  const updateBullet = (i: number, value: string) => syncBullets(bullets.map((b, idx) => (idx === i ? value : b)));
  const addBullet = () => syncBullets([...bullets, '']);
  const removeBullet = (i: number) => syncBullets(bullets.filter((_, idx) => idx !== i));

  const onSubmit = handleSubmit(async (v: PlanFormValues) => {
    setSubmitError(null);
    clearErrors();
    const structured = {
      name: v.name.trim(),
      priceMinor: Math.round(v.price * 100),
      currency: v.currency,
      adQuotaTotal: v.adQuotaTotal,
      dealRadarLimit: v.dealRadarLimit,
      searchPlacement: v.searchPlacement,
      analyticsLevel: v.analyticsLevel,
      supportLevel: v.supportLevel,
      verifiedBadge: v.verifiedBadge,
      popular: v.popular,
      marketingBullets: (v.marketingBullets ?? []).map((b) => b.trim()).filter(Boolean),
    };
    try {
      if (isCreate) {
        await create.mutateAsync({ plan: (v.plan ?? '').trim().toUpperCase(), ...structured });
      } else {
        await update.mutateAsync({ plan: plan.plan, payload: structured });
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ الخطة. حاول مرة أخرى.');
      }
    }
  });

  const heading = isCreate ? 'إضافة خطة جديدة' : `تعديل خطة ${plan.name || planLabelAr(plan.plan)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">{heading}</h3>
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
          {isCreate && (
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="رمز الخطة (إنجليزي ثابت)" required error={errors.plan?.message as string | undefined} hint="مثال: GOLD — لا يمكن تغييره لاحقاً">
                <Input {...register('plan')} error={!!errors.plan} className="font-mono uppercase" placeholder="GOLD" />
              </FieldWrapper>
              <FieldWrapper label="اسم الخطة (يظهر للمستخدم)" required error={errors.name?.message}>
                <Input {...register('name')} error={!!errors.name} placeholder="الذهبية" />
              </FieldWrapper>
            </div>
          )}
          {!isCreate && (
            <FieldWrapper label="اسم الخطة (يظهر للمستخدم)" required error={errors.name?.message}>
              <Input {...register('name')} error={!!errors.name} placeholder="الاحترافية" />
            </FieldWrapper>
          )}

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
            <FieldWrapper label="دورة الفوترة">
              <Select defaultValue="MONTHLY" disabled>
                <option value="MONTHLY">شهرياً</option>
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="حصة الإعلانات الشهرية" required error={errors.adQuotaTotal?.message}>
              <Input type="number" min={1} step="1" {...register('adQuotaTotal')} error={!!errors.adQuotaTotal} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="تنبيهات Deal Radar" required error={errors.dealRadarLimit?.message} hint="0 = غير محدودة">
              <Input type="number" min={0} step="1" {...register('dealRadarLimit')} error={!!errors.dealRadarLimit} className="font-mono" />
            </FieldWrapper>
          </div>

          <FieldWrapper label="ظهور الإعلانات في البحث" required error={errors.searchPlacement?.message}>
            <Select {...register('searchPlacement')} error={!!errors.searchPlacement}>
              {SEARCH_PLACEMENTS.map((s) => (
                <option key={s} value={s}>{SEARCH_LABEL[s]}</option>
              ))}
            </Select>
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="مستوى التحليلات" required error={errors.analyticsLevel?.message}>
              <Select {...register('analyticsLevel')} error={!!errors.analyticsLevel}>
                {ANALYTICS_LEVELS.map((a) => (
                  <option key={a} value={a}>{ANALYTICS_LABEL[a]}</option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="مستوى الدعم" required error={errors.supportLevel?.message}>
              <Select {...register('supportLevel')} error={!!errors.supportLevel}>
                {SUPPORT_LEVELS.map((s) => (
                  <option key={s} value={s}>{SUPPORT_LABEL[s]}</option>
                ))}
              </Select>
            </FieldWrapper>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[8px] border border-border bg-surface-2/40 px-3.5 py-3">
            <Switch checked={verifiedBadge} onChange={(c) => setValue('verifiedBadge', c)} label="شارة موثّق على ملف البائع" />
            <Switch checked={popular} onChange={(c) => setValue('popular', c)} label="وسمها كالأكثر طلباً" />
          </div>

          <FieldWrapper label="عبارات تسويقية إضافية (اختياري)" hint="إحصاءات أو عبارات حرة تُعرض أسفل المزايا — مثل: مشاهدات +320%">
            <div className="space-y-2">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={b} onChange={(e) => updateBullet(i, e.target.value)} placeholder="مثال: دعم مخصص على مدار الساعة" />
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
              {isSubmitting ? 'جارٍ الحفظ...' : isCreate ? 'إنشاء الخطة' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
