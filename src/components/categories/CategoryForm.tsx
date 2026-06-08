'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldWrapper, Input } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { IconPicker } from './IconPicker';
import { useCreateCategory, useUpdateCategory } from '@/features/categories/use-category-mutations';
import type { CategoryDTO } from '@/features/categories/use-categories';

const schema = z.object({
  nameAr: z.string().min(1, 'الاسم العربي مطلوب'),
  nameEn: z.string().optional(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug يجب أن يكون حروف إنجليزية صغيرة وأرقام وشرطات فقط').optional().or(z.literal('')),
  glyph: z.string().optional(),
  color: z.string().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryFormProps {
  category?: CategoryDTO;
  parentId?: string;
  onClose: () => void;
}

export function CategoryForm({ category, parentId, onClose }: CategoryFormProps) {
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isEdit = !!category;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameAr: category?.nameAr ?? '',
      nameEn: category?.nameEn ?? '',
      slug: '',
      glyph: category?.glyph ?? '',
      color: category?.color ?? '#226199',
      order: category?.order ?? 0,
    },
  });

  const glyph = watch('glyph');

  const onSubmit = async (values: FormValues) => {
    if (isEdit) {
      const { slug: _slug, ...editPayload } = values;
      await updateCategory.mutateAsync({ id: category.id, payload: editPayload });
    } else {
      await createCategory.mutateAsync({
        ...values,
        slug: values.slug || undefined,
        parentId: parentId ?? null,
      });
    }
    onClose();
  };

  const isPending = createCategory.isPending || updateCategory.isPending;
  const error = createCategory.error || updateCategory.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-[14px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">
            {isEdit ? 'تعديل الفئة' : parentId ? 'إضافة قسم فرعي' : 'إضافة فئة جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          <FieldWrapper label="الاسم العربي" error={errors.nameAr?.message} required>
            <Input {...register('nameAr')} placeholder="مثال: سيارات" error={!!errors.nameAr} />
          </FieldWrapper>

          <FieldWrapper label="الاسم الإنجليزي" error={errors.nameEn?.message}>
            <Input {...register('nameEn')} placeholder="e.g. Cars" dir="ltr" className="text-start" />
          </FieldWrapper>

          {!isEdit && (
            <FieldWrapper
              label="Slug (اختياري)"
              hint="يُوّلد تلقائياً من الاسم العربي إن تُرك فارغاً"
              error={errors.slug?.message}
            >
              <Input
                {...register('slug')}
                placeholder="e.g. real-estate"
                dir="ltr"
                className="text-start font-mono text-[12.5px]"
              />
            </FieldWrapper>
          )}

          <FieldWrapper label="اللون" error={errors.color?.message}>
            <Input {...register('color')} type="color" className="h-10 cursor-pointer p-1" />
          </FieldWrapper>

          <FieldWrapper label="الأيقونة" error={errors.glyph?.message}>
            <input type="hidden" {...register('glyph')} />
            <IconPicker value={glyph || undefined} onChange={(id) => setValue('glyph', id, { shouldDirty: true })} />
          </FieldWrapper>

          <FieldWrapper label="الترتيب" error={errors.order?.message}>
            <Input {...register('order')} type="number" min={0} placeholder="0" />
          </FieldWrapper>

          {error && (
            <p className="rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">
              {(error as Error)?.message ?? 'حدث خطأ، يرجى المحاولة مجدداً'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {isPending ? 'جارٍ الحفظ…' : isEdit ? 'حفظ التغييرات' : parentId ? 'إضافة القسم' : 'إضافة فئة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
