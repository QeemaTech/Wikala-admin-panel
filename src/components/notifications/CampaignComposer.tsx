'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { FieldWrapper, Input, Textarea, Select } from '@/components/forms/Field';
import { ApiError } from '@/lib/api/errors';
import { formatNumber } from '@/lib/i18n/format';
import { AudienceTargeting } from './AudienceTargeting';
import { NotificationPreview } from './NotificationPreview';
import { useAudiencePreview } from '@/features/notifications/use-audience-preview';
import { useCreateCampaign, type CampaignAction } from '@/features/notifications/use-campaign-send';
import {
  CAMPAIGN_TYPE_LABEL,
  CAMPAIGN_PRIORITY_LABEL,
  type AudienceQuery,
  type CampaignType,
  type CampaignPriority,
} from '@/features/notifications/use-campaigns';

const TYPES = Object.keys(CAMPAIGN_TYPE_LABEL) as CampaignType[];
const PRIORITIES = Object.keys(CAMPAIGN_PRIORITY_LABEL) as CampaignPriority[];

export const campaignSchema = z.object({
  title: z.string().trim().min(3, 'العنوان من 3 إلى 120 حرفًا').max(120, 'العنوان من 3 إلى 120 حرفًا'),
  body: z.string().trim().min(5, 'النص من 5 إلى 300 حرفًا').max(300, 'النص من 5 إلى 300 حرفًا'),
  type: z.enum(['PROMO', 'AUCTION_REMINDER', 'GEO', 'PLATFORM']),
  priority: z.enum(['NORMAL', 'HIGH_BYPASS_QUIET']),
});

export type CampaignFormValues = z.output<typeof campaignSchema>;

type Pending = { mode: 'send'; values: CampaignFormValues } | { mode: 'schedule'; values: CampaignFormValues } | null;

export function CampaignComposer() {
  const create = useCreateCampaign();
  const [audience, setAudience] = useState<AudienceQuery>({});
  const [pending, setPending] = useState<Pending>(null);
  const [scheduleAt, setScheduleAt] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: estimate, isFetching: estimating } = useAudiencePreview(audience);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useZodForm(campaignSchema, {
    defaultValues: { title: '', body: '', type: 'PROMO', priority: 'NORMAL' },
  });

  const liveTitle = watch('title');
  const liveBody = watch('body');

  const doCreate = async (values: CampaignFormValues, action: CampaignAction, scheduledAt?: string) => {
    setSubmitError(null);
    try {
      await create.mutateAsync({ ...values, audienceQuery: audience, action, scheduledAt });
      reset();
      setAudience({});
      setPending(null);
      setScheduleAt('');
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر تنفيذ العملية. حاول مرة أخرى.');
      }
    }
  };

  const onSaveDraft = handleSubmit((v) => doCreate(v, 'SAVE_DRAFT'));
  const onSendClick = handleSubmit((v) => setPending({ mode: 'send', values: v }));
  const onScheduleClick = handleSubmit((v) => setPending({ mode: 'schedule', values: v }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card
          title="حملة إشعارات جديدة"
          actions={
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
            >
              <Icon name="archive" size={13} /> حفظ كمسودة
            </button>
          }
        >
          <div className="space-y-4">
            <FieldWrapper label="عنوان الإشعار (يظهر للمستخدم)" required error={errors.title?.message}>
              <Input {...register('title')} error={!!errors.title} placeholder="🔥 عروض الصيف بدأت — خصومات حتى 60%" />
            </FieldWrapper>

            <FieldWrapper label="نص الإشعار" required error={errors.body?.message}>
              <Textarea {...register('body')} error={!!errors.body} placeholder="اكتب نص الإشعار..." />
            </FieldWrapper>

            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper label="نوع الحملة" required error={errors.type?.message}>
                <Select {...register('type')} error={!!errors.type}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>{CAMPAIGN_TYPE_LABEL[t]}</option>
                  ))}
                </Select>
              </FieldWrapper>
              <FieldWrapper label="الأولوية" required error={errors.priority?.message}>
                <Select {...register('priority')} error={!!errors.priority}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{CAMPAIGN_PRIORITY_LABEL[p]}</option>
                  ))}
                </Select>
              </FieldWrapper>
            </div>

            <AudienceTargeting value={audience} onChange={setAudience} count={estimate} loading={estimating} />

            {/* Body-level error only when no dialog is open (else it would sit behind the overlay). */}
            {submitError && !pending && <p className="text-[12.5px] text-red">{submitError}</p>}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onSendClick}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-60"
              >
                <Icon name="send" size={14} /> إرسال الآن
              </button>
              <button
                type="button"
                onClick={onScheduleClick}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
              >
                <Icon name="clock" size={14} /> جدولة لاحقاً
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => { reset(); setAudience({}); setSubmitError(null); }}
                className="rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
              >
                إلغاء
              </button>
            </div>
          </div>
        </Card>
      </div>

      <Card title="معاينة على جهاز المستخدم">
        <NotificationPreview title={liveTitle} body={liveBody} />
      </Card>

      {pending?.mode === 'send' && (
        <ConfirmSendDialog
          estimate={estimate ?? 0}
          pending={create.isPending}
          error={submitError}
          onCancel={() => { setPending(null); setSubmitError(null); }}
          onConfirm={() => doCreate(pending.values, 'SEND_NOW')}
        />
      )}

      {pending?.mode === 'schedule' && (
        <ScheduleDialog
          value={scheduleAt}
          onChange={setScheduleAt}
          pending={create.isPending}
          error={submitError}
          onCancel={() => { setPending(null); setScheduleAt(''); setSubmitError(null); }}
          onConfirm={() => doCreate(pending.values, 'SCHEDULE', new Date(scheduleAt).toISOString())}
        />
      )}
    </div>
  );
}

function ConfirmSendDialog({
  estimate, pending, error, onCancel, onConfirm,
}: { estimate: number; pending: boolean; error: string | null; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-wk-blue-50 text-wk-blue">
            <Icon name="send" size={20} />
          </div>
          <h3 className="text-[15px] font-semibold text-ink">تأكيد الإرسال</h3>
        </div>
        <p className="mb-4 text-[13px] text-ink-2">
          سيُرسل هذا الإشعار إلى <b className="font-mono text-ink">~ {formatNumber(estimate)}</b> مستخدم الآن. هل أنت متأكد؟
        </p>
        {error && <p className="mb-2 text-[12px] text-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">إلغاء</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {pending ? 'جارٍ الإرسال...' : 'إرسال الآن'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ScheduleDialog({
  value, onChange, pending, error, onCancel, onConfirm,
}: { value: string; onChange: (v: string) => void; pending: boolean; error: string | null; onCancel: () => void; onConfirm: () => void }) {
  const valid = !!value && new Date(value).getTime() > Date.now();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-amber-50 text-amber">
            <Icon name="clock" size={20} />
          </div>
          <h3 className="text-[15px] font-semibold text-ink">جدولة الإرسال</h3>
        </div>
        <label className="mb-1.5 block text-[13px] font-medium text-ink">وقت الإرسال</label>
        <Input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} />
        {!valid && value && <p className="mt-1 text-[12px] text-red">اختر وقتًا في المستقبل</p>}
        {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">إلغاء</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || !valid}
            className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {pending ? 'جارٍ الجدولة...' : 'جدولة'}
          </button>
        </div>
      </div>
    </div>
  );
}
