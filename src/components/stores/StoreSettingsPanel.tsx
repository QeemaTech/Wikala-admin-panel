'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useCategories } from '@/features/categories/use-categories';
import { useUpdateStore } from '@/features/stores/use-store-mutations';
import type { StoreDTO } from '@/features/stores/use-stores';

const schema = z.object({
  name: z.string().trim().min(2, 'اسم المتجر مطلوب').max(60, 'الاسم طويل جداً'),
  featured: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface StoreSettingsPanelProps {
  store: StoreDTO;
  onClose: () => void;
}

export function StoreSettingsPanel({ store, onClose }: StoreSettingsPanelProps) {
  const update = useUpdateStore();
  const { data: cats } = useCategories();

  const [categories, setCategories] = useState<string[]>(store.categories);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useZodForm(schema, {
    defaultValues: { name: store.name, featured: store.featured },
  });

  const toggleCategory = (id: string) => {
    setCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    try {
      await update.mutateAsync({ id: store.id, payload: { name: v.name, categories, featured: v.featured } });
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ الإعدادات. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-ink">إعدادات {store.name}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {submitError && <p className="rounded-[8px] bg-red-50 p-2.5 text-[12.5px] text-red">{submitError}</p>}

          <FieldWrapper label="اسم المتجر" required error={errors.name?.message}>
            <Input {...register('name')} error={!!errors.name} />
          </FieldWrapper>

          <FieldWrapper label="الفئات">
            <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto rounded-[8px] border border-border p-2.5">
              {(cats?.items ?? []).map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={categories.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="h-4 w-4 accent-wk-blue"
                  />
                  {c.nameAr}
                </label>
              ))}
            </div>
          </FieldWrapper>

          <label className="flex items-center justify-between rounded-[8px] border border-border px-3 py-2.5">
            <span className="text-[13px] font-medium text-ink">متجر مميّز (Featured)</span>
            <input type="checkbox" {...register('featured')} className="h-4 w-4 accent-wk-blue" />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-3.5 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2">إلغاء</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-[8px] bg-wk-blue px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
