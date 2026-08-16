'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@/components/ui/Icon';
import { useAiRules, useSaveAiRules } from '@/features/moderation/use-ai-rules';
import type { TextRule, ImageRule, AiRulesSavePayload } from '@/features/moderation/use-ai-rules';

const schema = z
  .object({
    thresholdReview: z
      .number({ invalid_type_error: 'يجب أن يكون رقماً' })
      .min(0, 'الحد الأدنى 0')
      .max(100, 'الحد الأقصى 100'),
    thresholdReject: z
      .number({ invalid_type_error: 'يجب أن يكون رقماً' })
      .min(0, 'الحد الأدنى 0')
      .max(100, 'الحد الأقصى 100'),
    textRules: z.array(
      z.object({
        pattern: z.string().min(1, 'مطلوب'),
        action: z.enum(['FLAG', 'REJECT']),
        // Carried through untouched. Zod strips unknown keys, so without this
        // the first save from this dialog would silently drop the label off
        // every built-in rule and leave moderators reading raw regex.
        reason: z.string().nullish(),
      }),
    ),
    imageRules: z.array(
      z.object({
        category: z.string().min(1, 'مطلوب'),
        action: z.enum(['FLAG', 'REJECT']),
      }),
    ),
  })
  .refine((d) => d.thresholdReject > d.thresholdReview, {
    message: 'يجب أن يكون حد الرفض أعلى من حد المراجعة',
    path: ['thresholdReject'],
  });

type FormData = z.infer<typeof schema>;

// Backend accepts only this fixed set (rulesService KNOWN_IMAGE_CATEGORIES).
const IMAGE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'NSFW', label: 'محتوى للبالغين (NSFW)' },
  { value: 'VIOLENCE', label: 'عنف' },
  { value: 'WEAPONS', label: 'أسلحة' },
  { value: 'SCAM', label: 'احتيال' },
  { value: 'GRAPHIC', label: 'محتوى صادم' },
];

interface AiRulesEditorProps {
  onClose: () => void;
}

export function AiRulesEditor({ onClose }: AiRulesEditorProps) {
  const { data, isLoading } = useAiRules();
  const save = useSaveAiRules();
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      thresholdReview: 60,
      thresholdReject: 85,
      textRules: [],
      imageRules: [],
    },
  });

  const textFields = useFieldArray({ control, name: 'textRules' });
  const imageFields = useFieldArray({ control, name: 'imageRules' });

  useEffect(() => {
    if (data) {
      reset({
        thresholdReview: data.thresholdReview,
        thresholdReject: data.thresholdReject,
        textRules: data.textRules,
        imageRules: data.imageRules,
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: FormData) => {
    setSaveError(null);
    const payload: AiRulesSavePayload = {
      thresholdReview: values.thresholdReview,
      thresholdReject: values.thresholdReject,
      textRules: values.textRules as TextRule[],
      imageRules: values.imageRules as ImageRule[],
    };
    try {
      await save.mutateAsync(payload);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'تعذّر حفظ الإعدادات.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-[14px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-ink">إعداد قواعد AI</h2>
            <p className="text-[12.5px] text-muted">عتبات المراجعة والرفض التلقائي</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[8px] p-1.5 text-muted hover:bg-surface-2"
            aria-label="إغلاق"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Icon name="refresh" size={22} className="animate-spin text-muted" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Thresholds */}
              <div>
                <h3 className="mb-3 text-[13.5px] font-semibold text-ink">عتبات المراجعة</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-ink">
                      عتبة المراجعة البشرية (0–100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      {...register('thresholdReview', { valueAsNumber: true })}
                      className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                    {errors.thresholdReview && (
                      <p className="mt-1 text-[11.5px] text-red">{errors.thresholdReview.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-[12.5px] font-medium text-ink">
                      عتبة الرفض التلقائي (0–100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      {...register('thresholdReject', { valueAsNumber: true })}
                      className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                    />
                    {errors.thresholdReject && (
                      <p className="mt-1 text-[11.5px] text-red">{errors.thresholdReject.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Rules */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13.5px] font-semibold text-ink">قواعد النص</h3>
                  <button
                    type="button"
                    onClick={() => textFields.append({ pattern: '', action: 'FLAG', reason: null })}
                    className="flex items-center gap-1 rounded-[8px] border border-border px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2"
                  >
                    <Icon name="plus" size={13} /> إضافة قاعدة
                  </button>
                </div>
                <div className="space-y-2">
                  {textFields.fields.map((field, i) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          {...register(`textRules.${i}.pattern`)}
                          placeholder="النمط (regex أو نص)"
                          // A regex is LTR text. Inside this RTL panel the browser
                          // reorders it bidirectionally — `(\+?20|0020)?` renders as
                          // `?(0020|20?+\)` at the wrong end of the field, which is
                          // unreadable and looks like corrupted data. dir="ltr" pins
                          // it; textAlign keeps it starting at the left edge.
                          dir="ltr"
                          style={{ textAlign: 'left' }}
                          spellCheck={false}
                          autoComplete="off"
                          autoCapitalize="off"
                          autoCorrect="off"
                          className="w-full rounded-[8px] border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                        />
                        {/* The regex is unreadable at a glance; the label is what
                            a moderator recognises when it appears on a flagged ad. */}
                        {field.reason && (
                          <p className="mt-1 text-[11px] text-muted" dir="ltr" style={{ textAlign: 'left' }}>
                            {field.reason}
                          </p>
                        )}
                      </div>
                      <select
                        {...register(`textRules.${i}.action`)}
                        className="rounded-[8px] border border-border bg-surface px-2 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                      >
                        <option value="FLAG">تعليم</option>
                        <option value="REJECT">رفض</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => textFields.remove(i)}
                        className="mt-1 text-muted hover:text-red"
                        aria-label="حذف"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                  {textFields.fields.length === 0 && (
                    <p className="text-[12.5px] text-red">
                      لا توجد قواعد نصية حالياً — لا يوجد فحص تلقائي للنصوص.
                    </p>
                  )}
                </div>
              </div>

              {/* Image Rules */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13.5px] font-semibold text-ink">قواعد الصور</h3>
                  <button
                    type="button"
                    onClick={() => imageFields.append({ category: 'NSFW', action: 'FLAG' })}
                    className="flex items-center gap-1 rounded-[8px] border border-border px-3 py-1.5 text-[12px] font-medium text-ink hover:bg-surface-2"
                  >
                    <Icon name="plus" size={13} /> إضافة قاعدة
                  </button>
                </div>
                <div className="space-y-2">
                  {imageFields.fields.map((field, i) => (
                    <div key={field.id} className="flex items-start gap-2">
                      <select
                        {...register(`imageRules.${i}.category`)}
                        className="flex-1 rounded-[8px] border border-border bg-surface px-3 py-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                      >
                        {IMAGE_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <select
                        {...register(`imageRules.${i}.action`)}
                        className="rounded-[8px] border border-border bg-surface px-2 py-2 text-[12.5px] text-ink outline-none focus:border-brand"
                      >
                        <option value="FLAG">تعليم</option>
                        <option value="REJECT">رفض</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => imageFields.remove(i)}
                        className="mt-1 text-muted hover:text-red"
                        aria-label="حذف"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  ))}
                  {imageFields.fields.length === 0 && (
                    <p className="text-[12.5px] text-muted">لا توجد قواعد للصور حالياً</p>
                  )}
                </div>
              </div>

              {saveError && (
                <p className="rounded-[8px] border border-red/30 bg-red-50 px-3 py-2 text-[12.5px] text-red">
                  {saveError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!isDirty || !isValid || save.isPending}
                className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {save.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
