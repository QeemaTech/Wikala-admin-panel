'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { toDatetimeLocalInput } from '@/lib/i18n/format';
import { FieldWrapper, Input, Select } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { AdPicker, type PickedAd } from './AdPicker';
import { useCreateFlashSale, useUpdateFlashSale } from '@/features/flash/use-flash-mutations';
import type { AdSearchResult } from '@/features/flash/use-ad-search';
import type { FlashSaleDTO } from '@/features/flash/use-flash-sales';

const CURRENCIES = ['EGP', 'SAR', 'AED', 'USD'] as const;

const schema = z
  .object({
    adId: z.string().min(1, 'معرّف الإعلان مطلوب'),
    title: z.string().min(3, 'العنوان من 3 إلى 150 حرفًا').max(150, 'العنوان من 3 إلى 150 حرفًا'),
    originalPrice: z.coerce.number({ invalid_type_error: 'أدخل سعرًا صحيحًا' }).positive('السعر يجب أن يكون موجبًا'),
    salePrice: z.coerce.number({ invalid_type_error: 'أدخل سعرًا صحيحًا' }).positive('السعر يجب أن يكون موجبًا'),
    currency: z.enum(CURRENCIES),
    stock: z.coerce.number({ invalid_type_error: 'أدخل كمية صحيحة' }).int('الكمية عدد صحيح').min(1, 'الكمية لا تقل عن 1'),
    endsAt: z.string().min(1, 'وقت الانتهاء مطلوب'),
    source: z.enum(['ADMIN', 'SELLER_PAID']),
  })
  .refine((d) => d.salePrice < d.originalPrice, {
    message: 'سعر العرض يجب أن يكون أقل من السعر الأصلي',
    path: ['salePrice'],
  })
  .refine((d) => new Date(d.endsAt).getTime() > Date.now(), {
    message: 'وقت الانتهاء يجب أن يكون في المستقبل',
    path: ['endsAt'],
  });

type FormValues = z.output<typeof schema>;

interface FlashSaleFormProps {
  flash?: FlashSaleDTO | null;
  onClose: () => void;
}

export function FlashSaleForm({ flash, onClose }: FlashSaleFormProps) {
  const isEdit = !!flash;
  const create = useCreateFlashSale();
  const update = useUpdateFlashSale();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [selectedAd, setSelectedAd] = useState<PickedAd | null>(
    flash?.ad ? { id: flash.ad.id, title: flash.ad.title, coverUrl: flash.ad.coverUrl } : null,
  );

  const { register, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: flash
      ? {
          adId: flash.ad?.id ?? '',
          title: flash.title,
          originalPrice: flash.originalPriceMinor / 100,
          salePrice: flash.salePriceMinor / 100,
          currency: (flash.currency as (typeof CURRENCIES)[number]) ?? 'EGP',
          stock: flash.stock,
          endsAt: toDatetimeLocalInput(flash.endsAt),
          source: flash.source,
        }
      : { adId: '', title: '', currency: 'EGP', source: 'ADMIN' },
  });

  const onPickAd = (ad: AdSearchResult | null) => {
    setSelectedAd(ad ? { id: ad.id, title: ad.title, coverUrl: ad.coverUrl } : null);
    setValue('adId', ad?.id ?? '', { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && flash) {
        await update.mutateAsync({
          id: flash.id,
          payload: {
            title: v.title,
            originalPriceMinor: Math.round(v.originalPrice * 100),
            salePriceMinor: Math.round(v.salePrice * 100),
            stock: v.stock,
            endsAt: new Date(v.endsAt).toISOString(),
          },
        });
      } else {
        await create.mutateAsync({
          adId: v.adId,
          title: v.title,
          originalPriceMinor: Math.round(v.originalPrice * 100),
          salePriceMinor: Math.round(v.salePrice * 100),
          currency: v.currency,
          stock: v.stock,
          endsAt: new Date(v.endsAt).toISOString(),
          source: v.source,
        });
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ العرض. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">{isEdit ? 'تعديل عرض فلاش' : 'إطلاق عرض فلاش'}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FieldWrapper label="المنتج (الإعلان)" required error={errors.adId?.message} hint="ابحث واختر الإعلان المصدر للعرض">
            <input type="hidden" {...register('adId')} />
            <AdPicker value={selectedAd} onSelect={onPickAd} error={!!errors.adId} disabled={isEdit} />
          </FieldWrapper>

          <FieldWrapper label="عنوان العرض" required error={errors.title?.message}>
            <Input {...register('title')} error={!!errors.title} />
          </FieldWrapper>

          <div className="grid grid-cols-3 gap-3">
            <FieldWrapper label="السعر الأصلي" required error={errors.originalPrice?.message}>
              <Input type="number" step="0.01" {...register('originalPrice')} error={!!errors.originalPrice} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="سعر العرض" required error={errors.salePrice?.message}>
              <Input type="number" step="0.01" {...register('salePrice')} error={!!errors.salePrice} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="العملة" required error={errors.currency?.message}>
              <Select {...register('currency')} error={!!errors.currency} disabled={isEdit}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="المخزون" required error={errors.stock?.message}>
              <Input type="number" min={1} step="1" {...register('stock')} error={!!errors.stock} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="ينتهي في" required error={errors.endsAt?.message}>
              <Input type="datetime-local" {...register('endsAt')} error={!!errors.endsAt} />
            </FieldWrapper>
          </div>

          <FieldWrapper label="مصدر العرض" required error={errors.source?.message} hint="تنسيق إداري أو طلب بائع مدفوع">
            <Select {...register('source')} error={!!errors.source} disabled={isEdit}>
              <option value="ADMIN">تنسيق إداري (وكالة)</option>
              <option value="SELLER_PAID">طلب بائع مدفوع</option>
            </Select>
          </FieldWrapper>

          {submitError && <p className="text-[12.5px] text-red">{submitError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
              إلغاء
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-60">
              {isSubmitting ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إطلاق العرض'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
