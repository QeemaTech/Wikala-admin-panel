'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { FieldWrapper, Input, Textarea, Select, Switch } from '@/components/forms/Field';
import { Icon } from '@/components/ui/Icon';
import { ApiError } from '@/lib/api/errors';
import { useCreateContentPage, useUpdateContentPage } from '@/features/content-pages/use-content-page-mutations';
import type { ContentPageDTO, ContentPageKind } from '@/features/content-pages/use-content-pages';

const KINDS: ContentPageKind[] = ['LEGAL', 'HELP', 'ABOUT', 'FAQ', 'OTHER'];
const KIND_LABELS: Record<ContentPageKind, string> = {
  LEGAL: 'قانوني',
  HELP: 'مساعدة',
  ABOUT: 'عن التطبيق',
  FAQ: 'أسئلة شائعة',
  OTHER: 'أخرى',
};

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'يجب أن يكون بالإنجليزية (kebab-case) مثل privacy-policy'),
  titleAr: z.string().min(1, 'العنوان بالعربية مطلوب').max(200, 'حتى 200 حرف'),
  titleEn: z.string().max(200, 'حتى 200 حرف').optional().or(z.literal('')),
  bodyAr: z.string().optional().or(z.literal('')),
  bodyEn: z.string().optional().or(z.literal('')),
  kind: z.enum(KINDS as unknown as [ContentPageKind, ...ContentPageKind[]]),
  icon: z.string().optional().or(z.literal('')),
  order: z.coerce.number().int('رقم صحيح').min(0, 'لا يقل عن 0').optional(),
  showInAppMenu: z.boolean().optional(),
});

type FormValues = z.output<typeof schema>;

interface FaqItem {
  questionAr: string;
  questionEn: string;
  answerAr: string;
  answerEn: string;
  order: number;
}

interface ContentPageFormProps {
  page?: ContentPageDTO | null;
  onClose: () => void;
}

export function ContentPageForm({ page, onClose }: ContentPageFormProps) {
  const isEdit = !!page;
  const create = useCreateContentPage();
  const update = useUpdateContentPage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showInAppMenu, setShowInAppMenu] = useState(page?.showInAppMenu ?? true);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(
    page?.faqItems?.map((f) => ({
      questionAr: f.questionAr,
      questionEn: f.questionEn,
      answerAr: f.answerAr,
      answerEn: f.answerEn,
      order: f.order,
    })) ?? [],
  );
  const [bodyPreview, setBodyPreview] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useZodForm(schema, {
    defaultValues: page
      ? {
          slug: page.slug,
          titleAr: page.titleAr,
          titleEn: page.titleEn ?? '',
          bodyAr: page.bodyAr ?? '',
          bodyEn: page.bodyEn ?? '',
          kind: page.kind,
          icon: page.icon ?? '',
          order: page.order,
          showInAppMenu: page.showInAppMenu,
        }
      : { slug: '', titleAr: '', kind: 'LEGAL' as ContentPageKind, order: 0, showInAppMenu: true },
  });

  const selectedKind = watch('kind');
  const bodyArValue = watch('bodyAr');

  const addFaqItem = () => {
    setFaqItems((prev) => [
      ...prev,
      { questionAr: '', questionEn: '', answerAr: '', answerEn: '', order: prev.length },
    ]);
  };

  const removeFaqItem = (index: number) => {
    setFaqItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFaqItem = (index: number, field: keyof FaqItem, value: string | number) => {
    setFaqItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const onSubmit = handleSubmit(async (v: FormValues) => {
    setSubmitError(null);
    const payload = {
      slug: v.slug,
      titleAr: v.titleAr,
      ...(v.titleEn ? { titleEn: v.titleEn } : {}),
      ...(v.bodyAr ? { bodyAr: v.bodyAr } : {}),
      ...(v.bodyEn ? { bodyEn: v.bodyEn } : {}),
      kind: v.kind,
      ...(v.icon ? { icon: v.icon } : {}),
      order: v.order ?? 0,
      showInAppMenu,
      ...(selectedKind === 'FAQ' ? { faqItems } : {}),
    };
    try {
      if (isEdit && page) await update.mutateAsync({ id: page.id, payload });
      else await create.mutateAsync(payload);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ الصفحة. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4 py-6" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[12px] bg-white shadow-xl">
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-ink">
              {isEdit ? 'تعديل صفحة المحتوى' : 'إنشاء صفحة محتوى'}
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
            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="المعرّف (slug)" required error={errors.slug?.message}>
                <Input {...register('slug')} placeholder="privacy-policy" dir="ltr" error={!!errors.slug} />
              </FieldWrapper>

              <FieldWrapper label="التصنيف" required error={errors.kind?.message}>
                <Select {...register('kind')} error={!!errors.kind}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{KIND_LABELS[k]}</option>
                  ))}
                </Select>
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldWrapper label="العنوان بالعربية" required error={errors.titleAr?.message}>
                <Input {...register('titleAr')} error={!!errors.titleAr} />
              </FieldWrapper>
              <FieldWrapper label="العنوان بالإنجليزية" error={errors.titleEn?.message}>
                <Input {...register('titleEn')} dir="ltr" error={!!errors.titleEn} />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FieldWrapper label="أيقونة" error={errors.icon?.message} hint="اسم أيقونة مثل lock, doc, help">
                <Input {...register('icon')} dir="ltr" error={!!errors.icon} />
              </FieldWrapper>
              <FieldWrapper label="الترتيب" error={errors.order?.message}>
                <Input type="number" {...register('order')} error={!!errors.order} />
              </FieldWrapper>
              <div className="flex items-end pb-1">
                <Switch
                  checked={showInAppMenu}
                  onChange={setShowInAppMenu}
                  label="إظهار في التطبيق"
                />
              </div>
            </div>

            {/* Body fields with preview */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[13px] font-medium text-ink">المحتوى (Markdown)</span>
                <button
                  type="button"
                  onClick={() => setBodyPreview((v) => !v)}
                  className="rounded border border-border px-2 py-0.5 text-[11px] text-muted hover:bg-surface"
                >
                  {bodyPreview ? 'تحرير' : 'معاينة'}
                </button>
              </div>
              {bodyPreview ? (
                <div
                  className="prose prose-sm min-h-[120px] max-w-none rounded-[8px] border border-border bg-surface p-3 text-[13px]"
                  dir="rtl"
                >
                  <pre className="whitespace-pre-wrap text-ink">{bodyArValue || 'لا يوجد محتوى'}</pre>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <FieldWrapper label="المحتوى بالعربية" error={errors.bodyAr?.message}>
                    <Textarea {...register('bodyAr')} rows={8} error={!!errors.bodyAr} />
                  </FieldWrapper>
                  <FieldWrapper label="المحتوى بالإنجليزية" error={errors.bodyEn?.message}>
                    <Textarea {...register('bodyEn')} dir="ltr" rows={8} error={!!errors.bodyEn} />
                  </FieldWrapper>
                </div>
              )}
            </div>

            {/* FAQ items repeater */}
            {selectedKind === 'FAQ' && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink">الأسئلة الشائعة</span>
                  <button
                    type="button"
                    onClick={addFaqItem}
                    className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[12px] text-ink hover:bg-surface"
                  >
                    <Icon name="plus" size={12} /> إضافة سؤال
                  </button>
                </div>
                <div className="space-y-3">
                  {faqItems.map((item, i) => (
                    <div key={i} className="rounded-[8px] border border-border bg-surface p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[12px] font-medium text-muted">سؤال #{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(i)}
                          className="text-muted hover:text-red"
                          aria-label="حذف السؤال"
                        >
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <FieldWrapper label="السؤال بالعربية">
                          <Input
                            value={item.questionAr}
                            onChange={(e) => updateFaqItem(i, 'questionAr', e.target.value)}
                          />
                        </FieldWrapper>
                        <FieldWrapper label="السؤال بالإنجليزية">
                          <Input
                            value={item.questionEn}
                            dir="ltr"
                            onChange={(e) => updateFaqItem(i, 'questionEn', e.target.value)}
                          />
                        </FieldWrapper>
                        <FieldWrapper label="الجواب بالعربية">
                          <Textarea
                            value={item.answerAr}
                            rows={3}
                            onChange={(e) => updateFaqItem(i, 'answerAr', e.target.value)}
                          />
                        </FieldWrapper>
                        <FieldWrapper label="الجواب بالإنجليزية">
                          <Textarea
                            value={item.answerEn}
                            dir="ltr"
                            rows={3}
                            onChange={(e) => updateFaqItem(i, 'answerEn', e.target.value)}
                          />
                        </FieldWrapper>
                      </div>
                    </div>
                  ))}
                  {faqItems.length === 0 && (
                    <p className="py-4 text-center text-[12px] text-muted">لا توجد أسئلة بعد. اضغط «إضافة سؤال» للبدء.</p>
                  )}
                </div>
              </div>
            )}

            {submitError && (
              <p className="rounded bg-red-50 px-3 py-2 text-[12px] text-red">{submitError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-muted hover:bg-surface"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {isSubmitting ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء الصفحة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
