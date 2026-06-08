'use client';

import { useState, type ChangeEvent } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { toDatetimeLocalInput } from '@/lib/i18n/format';
import { FieldWrapper, Input, Textarea, Select } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useSignedUpload } from '@/features/media/use-signed-upload';
import { useCreateBanner, useUpdateBanner } from '@/features/banners/use-banner-mutations';
import { BannerHomePreview } from './BannerHomePreview';
import { BANNER_SLOTS, SLOT_LABELS, type BannerDTO, type BannerSlot } from '@/features/banners/use-banners';

const schema = z
  .object({
    title: z.string().min(3, 'العنوان من 3 إلى 150 حرفًا').max(150, 'العنوان من 3 إلى 150 حرفًا'),
    subtitle: z.string().max(150, 'حتى 150 حرفًا').optional().or(z.literal('')),
    body: z.string().max(500, 'حتى 500 حرف').optional().or(z.literal('')),
    ctaText: z.string().min(1, 'نص الزر مطلوب').max(80, 'حتى 80 حرفًا'),
    linkUrl: z.string().url('رابط غير صالح (يبدأ بـ http)'),
    slot: z.enum(BANNER_SLOTS as unknown as [BannerSlot, ...BannerSlot[]]),
    startsAt: z.string().optional().or(z.literal('')),
    endsAt: z.string().optional().or(z.literal('')),
    order: z.coerce.number().int('رقم صحيح').min(0, 'لا يقل عن 0').optional(),
  })
  .refine((d) => !d.startsAt || !d.endsAt || new Date(d.endsAt) > new Date(d.startsAt), {
    message: 'تاريخ الانتهاء يجب أن يكون بعد البدء',
    path: ['endsAt'],
  });

type FormValues = z.output<typeof schema>;

interface BannerFormProps {
  banner?: BannerDTO | null;
  onClose: () => void;
}

export function BannerForm({ banner, onClose }: BannerFormProps) {
  const isEdit = !!banner;
  const create = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const { upload, isUploading, progress, error: uploadError } = useSignedUpload();
  const [image, setImage] = useState<{ url: string | null; publicId: string | null }>({
    url: banner?.imageUrl ?? null,
    publicId: null,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: banner
      ? {
          title: banner.title,
          subtitle: banner.subtitle ?? '',
          body: banner.body ?? '',
          ctaText: banner.ctaText,
          linkUrl: banner.linkUrl,
          slot: banner.slot,
          startsAt: toDatetimeLocalInput(banner.startsAt),
          endsAt: toDatetimeLocalInput(banner.endsAt),
          order: banner.order,
        }
      : { title: '', ctaText: 'اطلب الآن', linkUrl: '', slot: 'HOME_TOP', order: 0 },
  });

  const live = watch();

  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const descriptor = await upload(file, {
        context: 'BANNERS',
        contextId: banner?.id ?? 'new',
        allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      setImage({ url: descriptor.watermarkedUrl, publicId: descriptor.cloudinaryId });
    } catch {
      // useSignedUpload surfaces the message via uploadError
    }
  };

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    const payload = {
      title: v.title,
      ...(v.subtitle ? { subtitle: v.subtitle } : {}),
      ...(v.body ? { body: v.body } : {}),
      ctaText: v.ctaText,
      ...(image.publicId ? { imageCloudinaryPublicId: image.publicId } : {}),
      linkUrl: v.linkUrl,
      slot: v.slot,
      ...(v.startsAt ? { startsAt: new Date(v.startsAt).toISOString() } : {}),
      ...(v.endsAt ? { endsAt: new Date(v.endsAt).toISOString() } : {}),
      order: v.order ?? 0,
    };
    try {
      if (isEdit && banner) await updateBanner.mutateAsync({ id: banner.id, payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ البانر. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 py-6" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[12px] bg-white shadow-xl">
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">{isEdit ? 'تعديل البانر' : 'إنشاء بانر'}</h3>
            <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
              <Icon name="x" size={16} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <FieldWrapper label="العنوان" required error={errors.title?.message}>
              <Input {...register('title')} error={!!errors.title} />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="العنوان الفرعي" error={errors.subtitle?.message}>
                <Input {...register('subtitle')} error={!!errors.subtitle} />
              </FieldWrapper>
              <FieldWrapper label="نص الزر (CTA)" required error={errors.ctaText?.message}>
                <Input {...register('ctaText')} error={!!errors.ctaText} />
              </FieldWrapper>
            </div>
            <FieldWrapper label="نص إضافي" error={errors.body?.message}>
              <Textarea {...register('body')} error={!!errors.body} rows={2} />
            </FieldWrapper>
            <FieldWrapper label="رابط الوجهة" required error={errors.linkUrl?.message}>
              <Input {...register('linkUrl')} error={!!errors.linkUrl} dir="ltr" placeholder="https://..." />
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="المكان (Slot)" required error={errors.slot?.message}>
                <Select {...register('slot')} error={!!errors.slot}>
                  {BANNER_SLOTS.map((s) => <option key={s} value={s}>{SLOT_LABELS[s]}</option>)}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="الترتيب" error={errors.order?.message}>
                <Input type="number" min={0} step="1" {...register('order')} error={!!errors.order} className="font-mono" />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="يبدأ في" error={errors.startsAt?.message}>
                <Input type="datetime-local" {...register('startsAt')} error={!!errors.startsAt} />
              </FieldWrapper>
              <FieldWrapper label="ينتهي في" error={errors.endsAt?.message}>
                <Input type="datetime-local" {...register('endsAt')} error={!!errors.endsAt} />
              </FieldWrapper>
            </div>

            <FieldWrapper label="صورة البانر" hint="JPG/PNG/WebP — تُرفع عبر التوقيع الآمن" error={uploadError ?? undefined}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onPickImage}
                className="block w-full text-[12.5px] text-muted file:me-3 file:rounded-[8px] file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-[12.5px] file:font-medium file:text-ink"
              />
              {isUploading && <p className="mt-1 text-[12px] text-muted">جارٍ الرفع... {progress}%</p>}
              {image.url && !isUploading && <p className="mt-1 text-[12px] text-green">تم رفع الصورة ✓</p>}
            </FieldWrapper>

            {submitError && <p className="text-[12.5px] text-red">{submitError}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">إلغاء</button>
              <button type="submit" disabled={isSubmitting || isUploading} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-60">
                {isSubmitting ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء البانر'}
              </button>
            </div>
          </form>
        </div>

        {/* Live preview */}
        <div className="hidden w-[320px] shrink-0 flex-col items-center gap-3 border-s border-border bg-surface p-5 md:flex">
          <p className="text-[12.5px] font-semibold text-ink">معاينة الصفحة الرئيسية</p>
          <BannerHomePreview
            title={live.title ?? ''}
            subtitle={live.subtitle || undefined}
            ctaText={live.ctaText || 'اطلب الآن'}
            imageUrl={image.url}
            slot={(live.slot as BannerSlot) ?? 'HOME_TOP'}
          />
        </div>
      </div>
    </div>
  );
}
