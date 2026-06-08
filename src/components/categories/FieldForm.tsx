'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FieldWrapper, Input, Select } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { Switch } from '@/components/forms/Field';
import { useCreateField, useUpdateField } from '@/features/categories/use-category-fields';
import type { CategoryFieldDTO } from '@/features/categories/use-categories';

const schema = z.object({
  key: z.string().min(1, 'المفتاح مطلوب').regex(/^[a-z_]+$/, 'يجب أن يكون بأحرف إنجليزية صغيرة وشرطة سفلية فقط'),
  labelAr: z.string().min(1, 'الاسم العربي مطلوب'),
  labelEn: z.string().optional(),
  type: z.enum(['number', 'text', 'select', 'boolean']),
  required: z.boolean(),
  searchable: z.boolean(),
  filterable: z.boolean(),
  order: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface FieldFormProps {
  categoryId: string;
  field?: CategoryFieldDTO;
  onClose: () => void;
}

export function FieldForm({ categoryId, field, onClose }: FieldFormProps) {
  const createField = useCreateField(categoryId);
  const updateField = useUpdateField(categoryId);
  const isEdit = !!field;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: field?.key ?? '',
      labelAr: field?.label_ar ?? '',
      labelEn: field?.label_en ?? '',
      type: field?.type ?? 'text',
      required: field?.required ?? false,
      searchable: field?.searchable ?? false,
      filterable: field?.filterable ?? false,
      order: field?.order ?? 0,
    },
  });

  const required = watch('required');
  const searchable = watch('searchable');
  const filterable = watch('filterable');

  const onSubmit = async (values: FormValues) => {
    if (isEdit) {
      await updateField.mutateAsync({
        fieldId: field._id,
        payload: {
          labelAr: values.labelAr,
          labelEn: values.labelEn,
          required: values.required,
          searchable: values.searchable,
          filterable: values.filterable,
          order: values.order,
        },
      });
    } else {
      await createField.mutateAsync(values);
    }
    onClose();
  };

  const isPending = createField.isPending || updateField.isPending;
  const error = createField.error || updateField.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-[14px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">
            {isEdit ? 'تعديل الحقل' : 'إضافة حقل جديد'}
          </h2>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink"
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          {!isEdit && (
            <FieldWrapper label="المفتاح (key)" error={errors.key?.message} required>
              <Input {...register('key')} placeholder="مثال: year_made" dir="ltr" className="text-start" error={!!errors.key} />
            </FieldWrapper>
          )}

          <FieldWrapper label="الاسم العربي" error={errors.labelAr?.message} required>
            <Input {...register('labelAr')} placeholder="مثال: سنة الصنع" error={!!errors.labelAr} />
          </FieldWrapper>

          <FieldWrapper label="الاسم الإنجليزي" error={errors.labelEn?.message}>
            <Input {...register('labelEn')} placeholder="e.g. Year Made" dir="ltr" className="text-start" />
          </FieldWrapper>

          {!isEdit && (
            <FieldWrapper label="نوع الحقل" error={errors.type?.message} required>
              <Select {...register('type')} error={!!errors.type}>
                <option value="text">نص</option>
                <option value="number">رقم</option>
                <option value="select">قائمة اختيار</option>
                <option value="boolean">نعم / لا</option>
              </Select>
            </FieldWrapper>
          )}

          <FieldWrapper label="الترتيب">
            <Input {...register('order')} type="number" min={0} placeholder="0" />
          </FieldWrapper>

          <div className="flex flex-col gap-3">
            <Switch checked={required} onChange={(v) => setValue('required', v)} label="إلزامي" />
            <Switch checked={searchable} onChange={(v) => setValue('searchable', v)} label="قابل للبحث" />
            <Switch checked={filterable} onChange={(v) => setValue('filterable', v)} label="قابل للفلترة" />
          </div>

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
              {isPending ? 'جارٍ الحفظ…' : isEdit ? 'حفظ' : 'إضافة حقل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
