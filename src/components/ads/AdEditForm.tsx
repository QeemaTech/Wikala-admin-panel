'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input, Textarea, Select, Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { LocationPicker, type PickedLocation } from '@/components/map/LocationPicker';
import { useCategoryFields } from '@/features/categories/use-categories';
import { useAdminEditAd } from '@/features/ads/use-ad-actions';
import { ApiError } from '@/lib/api/errors';
import { GOVERNORATES, GOVERNORATE_LABELS, matchGovernorate } from '@/lib/constants/enums';
import type { AdCondition } from '@/features/ads/use-ads';

/**
 * Minimal ad shape the edit form needs. Satisfied by both the moderation
 * `AdAdminDTO` (queue) and the full ad from `GET /ads/:idOrSlug` (ads browse),
 * so the same form drives staff content correction in either context.
 */
export interface EditableAd {
  id: string;
  categoryId: string | null;
  title: string;
  description: string | null;
  priceMinor: number | null;
  currency: string;
  condition: AdCondition;
  dynamicFields?: Record<string, unknown> | null;
  governorate: string | null;
  district: string | null;
  location: { lng: number; lat: number } | null;
}

const CURRENCIES = ['EGP', 'USD', 'SAR', 'AED'] as const;
const CONDITIONS = [
  { value: 'NEW', label: 'جديد' },
  { value: 'PRELOVED', label: 'مستعمل' },
  { value: 'REFURBISHED', label: 'مُجدَّد' },
] as const;

const schema = z.object({
  title: z.string().min(3, 'العنوان من 3 إلى 100 حرف').max(100, 'العنوان من 3 إلى 100 حرف'),
  description: z.string().max(2000, 'الوصف لا يتجاوز 2000 حرف'),
  price: z.coerce.number({ invalid_type_error: 'أدخل سعرًا صحيحًا' }).min(0, 'السعر لا يكون سالبًا'),
  currency: z.enum(CURRENCIES),
  condition: z.enum(['NEW', 'PRELOVED', 'REFURBISHED']),
});
type FormValues = z.infer<typeof schema>;

interface AdEditFormProps {
  ad: EditableAd;
  categoryName?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdEditForm({ ad, categoryName, onClose, onSuccess }: AdEditFormProps) {
  const fieldsQuery = useCategoryFields(ad.categoryId);
  const editAd = useAdminEditAd();
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>(ad.dynamicFields ?? {});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [governorate, setGovernorate] = useState<string>(ad.governorate ?? '');
  const [district, setDistrict] = useState<string>(ad.district ?? '');

  // Pre-populate the map pin from the ad's existing GeoJSON location ({ lng, lat }).
  const initialPin =
    ad.location && typeof ad.location.lat === 'number' && typeof ad.location.lng === 'number'
      ? { lat: ad.location.lat, lng: ad.location.lng }
      : null;

  // Map drop/drag → reverse-geocoded governorate (mapped to the enum when it
  // matches) + district. Coordinates are NOT persisted: the admin edit contract
  // (§7.26 PATCH) accepts governorate/district only, not location.
  const handlePickLocation = (loc: PickedLocation) => {
    const matched = matchGovernorate(loc.governorate);
    if (matched) setGovernorate(matched);
    if (loc.district) setDistrict(loc.district);
  };

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: {
      title: ad.title,
      description: ad.description ?? '',
      price: ad.priceMinor != null ? ad.priceMinor / 100 : 0,
      currency: (ad.currency as (typeof CURRENCIES)[number]) ?? 'EGP',
      condition: ad.condition,
    },
  });

  const setDyn = (key: string, value: unknown) => setDynamicValues((p) => ({ ...p, [key]: value }));

  const onSubmit = handleSubmit(async (values: FormValues) => {
    setSubmitError(null);
    try {
      await editAd.mutateAsync({
        adId: ad.id,
        payload: {
          title: values.title,
          description: values.description,
          priceMinor: Math.round(values.price * 100),
          currency: values.currency,
          condition: values.condition,
          ...(governorate ? { governorate } : {}),
          ...(district.trim() ? { district: district.trim() } : {}),
          dynamicFields: dynamicValues,
        },
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ التعديلات. حاول مرة أخرى.');
      }
    }
  });

  const dynFields = fieldsQuery.data?.items ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">تعديل الإعلان</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <FieldWrapper label="العنوان" required error={errors.title?.message}>
            <Input {...register('title')} error={!!errors.title} />
          </FieldWrapper>

          <FieldWrapper label="الوصف" error={errors.description?.message}>
            <Textarea {...register('description')} error={!!errors.description} rows={4} />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="السعر" required error={errors.price?.message}>
              <Input type="number" step="0.01" {...register('price')} error={!!errors.price} className="font-mono" />
            </FieldWrapper>
            <FieldWrapper label="العملة" required error={errors.currency?.message}>
              <Select {...register('currency')} error={!!errors.currency}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="الحالة" required error={errors.condition?.message}>
              <Select {...register('condition')} error={!!errors.condition}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="التصنيف">
              <Input value={categoryName ?? ad.categoryId ?? '—'} disabled readOnly />
            </FieldWrapper>
          </div>

          <div className="space-y-3 rounded-[10px] border border-border bg-surface-2 p-3.5">
            <p className="text-[12.5px] font-semibold text-ink">الموقع</p>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="المحافظة">
                <Select value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
                  <option value="">—</option>
                  {GOVERNORATES.map((g) => (
                    <option key={g} value={g}>{GOVERNORATE_LABELS[g]}</option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="المنطقة">
                <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="اسم المنطقة" />
              </FieldWrapper>
            </div>
            <LocationPicker value={initialPin} onChange={handlePickLocation} height={260} />
            <p className="text-[11.5px] leading-relaxed text-muted">
              اسحب الدبوس لتحديد الموقع — يُحدَّث اسم المحافظة والمنطقة تلقائيًا. (لا تُحفظ الإحداثيات؛ يُحفظ اسم المحافظة والمنطقة فقط.)
            </p>
          </div>

          {dynFields.length > 0 && (
            <div className="space-y-4 rounded-[10px] border border-border bg-surface-2 p-3.5">
              <p className="text-[12.5px] font-semibold text-ink">حقول التصنيف</p>
              {dynFields.map((f) => {
                const val = dynamicValues[f.key];
                if (f.type === 'boolean') {
                  return (
                    <FieldWrapper key={f.key} label={f.label_ar} required={f.required}>
                      <Switch checked={!!val} onChange={(c) => setDyn(f.key, c)} />
                    </FieldWrapper>
                  );
                }
                if (f.type === 'select') {
                  return (
                    <FieldWrapper key={f.key} label={f.label_ar} required={f.required}>
                      <Select value={(val as string) ?? ''} onChange={(e) => setDyn(f.key, e.target.value)}>
                        <option value="">—</option>
                        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label_ar}</option>)}
                      </Select>
                    </FieldWrapper>
                  );
                }
                return (
                  <FieldWrapper key={f.key} label={f.label_ar} required={f.required}>
                    <Input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={(val as string | number) ?? ''}
                      onChange={(e) => setDyn(f.key, f.type === 'number' ? e.target.valueAsNumber : e.target.value)}
                    />
                  </FieldWrapper>
                );
              })}
            </div>
          )}

          {submitError && <p className="text-[12.5px] text-red">{submitError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
              إلغاء
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-60">
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
