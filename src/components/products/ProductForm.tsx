'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { toDatetimeLocalInput } from '@/lib/i18n/format';
import { FieldWrapper, Input, Textarea, Select, Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { MediaGallery } from '@/components/media/MediaGallery';
import { useCategories, useCategoryFields } from '@/features/categories/use-categories';
import { useCreateProduct, useUpdateProduct } from '@/features/products/use-product-mutations';
import { useProduct, type ProductDTO } from '@/features/products/use-products';
import type { AdMediaDTO } from '@/features/ads/use-ads';

const PLACEMENTS = ['NONE', 'FLASH', 'TODAYS_DEAL'] as const;
const STATUSES = ['DRAFT', 'ACTIVE', 'HIDDEN', 'OUT_OF_STOCK'] as const;

/**
 * `z.coerce.number()` turns an empty input into `0` (`Number('') === 0`), which
 * would silently send a zero price or a zero compare-at price the API rejects.
 * Blank has to become `undefined` before coercion so required fields fail and
 * optional ones are simply omitted.
 */
const blankToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema);

const schema = z
  .object({
    title: z.string().min(3, 'العنوان من 3 إلى 150 حرفًا').max(150, 'العنوان من 3 إلى 150 حرفًا'),
    description: z.string().max(4000, 'حتى 4000 حرف').optional().or(z.literal('')),
    categoryId: z.string().min(1, 'الفئة مطلوبة'),
    subCategoryId: z.string().optional().or(z.literal('')),
    price: blankToUndefined(z.coerce.number({ required_error: 'السعر مطلوب' }).min(0, 'لا يقل عن 0')),
    compareAtPrice: blankToUndefined(z.coerce.number().min(0, 'لا يقل عن 0').optional()),
    currency: z.string().min(3).max(3),
    stock: blankToUndefined(z.coerce.number().int('رقم صحيح').min(0, 'لا يقل عن 0')).default(0),
    sku: z.string().max(64).optional().or(z.literal('')),
    weightGrams: blankToUndefined(z.coerce.number().int('رقم صحيح').min(0).optional()),
    badgeText: z.string().max(40).optional().or(z.literal('')),
    placement: z.enum(PLACEMENTS),
    dealStartsAt: z.string().optional().or(z.literal('')),
    dealEndsAt: z.string().optional().or(z.literal('')),
    status: z.enum(STATUSES),
  })
  .refine((d) => d.compareAtPrice == null || d.compareAtPrice > d.price, {
    message: 'سعر المقارنة يجب أن يكون أعلى من السعر',
    path: ['compareAtPrice'],
  })
  // The app renders a live countdown for flash deals, so an end time is required.
  .refine((d) => d.placement !== 'FLASH' || !!d.dealEndsAt, {
    message: 'تاريخ انتهاء العرض مطلوب للعروض الفلاش',
    path: ['dealEndsAt'],
  });

type FormValues = z.output<typeof schema>;

/** Product media round-trips through the ads gallery component's shape. */
function toGalleryMedia(product: ProductDTO | undefined): AdMediaDTO[] {
  return (product?.media ?? []).map((m) => ({
    id: m.id ?? undefined,
    cloudinaryPublicId: m.cloudinaryPublicId,
    originalUrl: m.url,
    variants: { w1080: m.url, w720: null, thumb: m.thumbUrl },
    mimeType: null,
    width: null,
    height: null,
    order: m.order,
  }));
}

const toMinor = (major: number | string | undefined | null): number | null => {
  if (major === '' || major === undefined || major === null) return null;
  return Math.round(Number(major) * 100);
};
const toMajor = (minor: number | null | undefined): string =>
  minor == null ? '' : String(minor / 100);

interface ProductFormProps {
  /** Product id to edit; omit to create. */
  productId?: string | null;
  onClose: () => void;
}

export function ProductForm({ productId, onClose }: ProductFormProps) {
  const isEdit = !!productId;
  const detail = useProduct(productId ?? null);
  const product = detail.data;

  // Wait for the record before mounting the form — defaultValues are read once,
  // so rendering early would leave the edit form showing blank create defaults.
  if (isEdit && !product) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 px-4">
        {detail.isError ? (
          <div className="w-full max-w-sm rounded-[12px] bg-white p-5 text-center shadow-xl">
            <p className="text-[13px] text-red">تعذّر تحميل بيانات المنتج.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <div className="h-40 w-full max-w-3xl animate-pulse rounded-[12px] bg-white" />
        )}
      </div>
    );
  }

  return <ProductFormInner key={productId ?? 'new'} product={product} onClose={onClose} />;
}

function ProductFormInner({ product, onClose }: { product?: ProductDTO; onClose: () => void }) {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const categoriesQuery = useCategories('PRODUCTS');
  const [media, setMedia] = useState<AdMediaDTO[]>(() => toGalleryMedia(product));
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>(
    product?.dynamicFields ?? {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, {
    defaultValues: {
      title: product?.title ?? '',
      description: product?.description ?? '',
      categoryId: product?.categoryId ?? '',
      subCategoryId: product?.subCategoryId ?? '',
      price: toMajor(product?.priceMinor) as unknown as number,
      compareAtPrice: toMajor(product?.compareAtPriceMinor) as unknown as number,
      currency: product?.currency ?? 'EGP',
      stock: product?.stock ?? 0,
      sku: product?.sku ?? '',
      weightGrams: (product?.weightGrams ?? '') as unknown as number,
      badgeText: product?.badgeText ?? '',
      placement: product?.placement ?? 'NONE',
      dealStartsAt: toDatetimeLocalInput(product?.dealStartsAt ?? null),
      dealEndsAt: toDatetimeLocalInput(product?.dealEndsAt ?? null),
      status: product?.status ?? 'DRAFT',
    },
  });

  const categoryId = watch('categoryId');
  const subCategoryId = watch('subCategoryId');
  const placement = watch('placement');

  const roots = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data]);
  const subCategories = useMemo(
    () => roots.find((c) => c.id === categoryId)?.children ?? [],
    [roots, categoryId],
  );

  // The backend validates against the merged [sub, parent] field set, so both
  // schemas have to be fetched and rendered here.
  const parentFields = useCategoryFields(categoryId || null);
  const subFields = useCategoryFields(subCategoryId || null);
  const dynFields = useMemo(() => {
    const merged = [...(subFields.data?.items ?? []), ...(parentFields.data?.items ?? [])];
    // Sub-category first, so a key it redefines wins over the parent's version.
    const byKey = new Map<string, (typeof merged)[number]>();
    for (const f of merged) if (f.is_active && !byKey.has(f.key)) byKey.set(f.key, f);
    return [...byKey.values()].sort((a, b) => a.order - b.order);
  }, [parentFields.data, subFields.data]);

  const setDyn = (key: string, value: unknown) =>
    setDynamicValues((prev) => ({ ...prev, [key]: value }));

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    const payload = {
      title: v.title,
      description: v.description || '',
      categoryId: v.categoryId,
      subCategoryId: v.subCategoryId || null,
      dynamicFields: dynamicValues,
      media: media.map((m, i) => ({ cloudinaryPublicId: m.cloudinaryPublicId, order: i })),
      priceMinor: toMinor(v.price) ?? 0,
      compareAtPriceMinor: toMinor(v.compareAtPrice),
      currency: v.currency,
      stock: v.stock ?? 0,
      sku: v.sku || null,
      weightGrams: v.weightGrams ?? null,
      badgeText: v.badgeText || null,
      placement: v.placement,
      dealStartsAt: v.dealStartsAt ? new Date(v.dealStartsAt).toISOString() : null,
      dealEndsAt: v.dealEndsAt ? new Date(v.dealEndsAt).toISOString() : null,
      status: v.status,
    };
    try {
      if (product) await update.mutateAsync({ id: product.id, payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ المنتج. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">
            {isEdit ? 'تعديل المنتج' : 'إضافة منتج'}
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
          <FieldWrapper label="اسم المنتج" required error={errors.title?.message}>
            <Input {...register('title')} error={!!errors.title} />
          </FieldWrapper>

          <FieldWrapper label="الوصف" error={errors.description?.message}>
            <Textarea {...register('description')} error={!!errors.description} rows={3} />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper label="الفئة" required error={errors.categoryId?.message}>
              <Select {...register('categoryId')} error={!!errors.categoryId}>
                <option value="">— اختر فئة —</option>
                {roots.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="القسم الفرعي" error={errors.subCategoryId?.message}>
              <Select {...register('subCategoryId')} disabled={!subCategories.length}>
                <option value="">— بدون —</option>
                {subCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FieldWrapper label="السعر" required error={errors.price?.message}>
              <Input
                type="number"
                min={0}
                step="0.01"
                {...register('price')}
                error={!!errors.price}
                className="font-mono"
              />
            </FieldWrapper>
            <FieldWrapper
              label="سعر قبل الخصم"
              hint="يظهر مشطوبًا في التطبيق"
              error={errors.compareAtPrice?.message}
            >
              <Input
                type="number"
                min={0}
                step="0.01"
                {...register('compareAtPrice')}
                error={!!errors.compareAtPrice}
                className="font-mono"
              />
            </FieldWrapper>
            <FieldWrapper label="العملة" error={errors.currency?.message}>
              <Select {...register('currency')} error={!!errors.currency}>
                <option value="EGP">EGP</option>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FieldWrapper label="المخزون" required error={errors.stock?.message}>
              <Input
                type="number"
                min={0}
                step="1"
                {...register('stock')}
                error={!!errors.stock}
                className="font-mono"
              />
            </FieldWrapper>
            <FieldWrapper label="رمز المنتج (SKU)" error={errors.sku?.message}>
              <Input {...register('sku')} dir="ltr" className="text-start font-mono" />
            </FieldWrapper>
            <FieldWrapper label="الوزن (جرام)" error={errors.weightGrams?.message}>
              <Input
                type="number"
                min={0}
                step="1"
                {...register('weightGrams')}
                className="font-mono"
              />
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FieldWrapper label="مكان العرض" error={errors.placement?.message}>
              <Select {...register('placement')} error={!!errors.placement}>
                <option value="NONE">بدون</option>
                <option value="FLASH">عروض فلاش</option>
                <option value="TODAYS_DEAL">صفقات اليوم</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="شارة" hint="مثال: كمية محدودة" error={errors.badgeText?.message}>
              <Input {...register('badgeText')} error={!!errors.badgeText} />
            </FieldWrapper>
            <FieldWrapper label="الحالة" error={errors.status?.message}>
              <Select {...register('status')} error={!!errors.status}>
                <option value="DRAFT">مسودة</option>
                <option value="ACTIVE">نشط</option>
                <option value="HIDDEN">مخفي</option>
                <option value="OUT_OF_STOCK">نفدت الكمية</option>
              </Select>
            </FieldWrapper>
          </div>

          {placement !== 'NONE' && (
            <div className="grid grid-cols-2 gap-3 rounded-[10px] border border-border bg-surface-2 p-3.5">
              <FieldWrapper label="يبدأ العرض في" error={errors.dealStartsAt?.message}>
                <Input type="datetime-local" {...register('dealStartsAt')} />
              </FieldWrapper>
              <FieldWrapper
                label="ينتهي العرض في"
                required={placement === 'FLASH'}
                hint={placement === 'FLASH' ? 'يشغّل العدّاد التنازلي في التطبيق' : undefined}
                error={errors.dealEndsAt?.message}
              >
                <Input
                  type="datetime-local"
                  {...register('dealEndsAt')}
                  error={!!errors.dealEndsAt}
                />
              </FieldWrapper>
            </div>
          )}

          <FieldWrapper label="صور المنتج" hint="أول صورة هي الصورة الرئيسية — اسحب لإعادة الترتيب">
            <MediaGallery
              value={media}
              onChange={setMedia}
              context="PRODUCTS_MEDIA"
              contextId={product?.id ?? 'new'}
              editable
            />
          </FieldWrapper>

          {dynFields.length > 0 && (
            <div className="space-y-4 rounded-[10px] border border-border bg-surface-2 p-3.5">
              <p className="text-[12.5px] font-semibold text-ink">مواصفات الفئة</p>
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
                      <Select
                        value={(val as string) ?? ''}
                        onChange={(e) => setDyn(f.key, e.target.value)}
                      >
                        <option value="">—</option>
                        {f.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label_ar}
                          </option>
                        ))}
                      </Select>
                    </FieldWrapper>
                  );
                }
                return (
                  <FieldWrapper key={f.key} label={f.label_ar} required={f.required}>
                    <Input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={(val as string | number) ?? ''}
                      onChange={(e) =>
                        setDyn(f.key, f.type === 'number' ? e.target.valueAsNumber : e.target.value)
                      }
                    />
                  </FieldWrapper>
                );
              })}
            </div>
          )}

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
              {isSubmitting ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
