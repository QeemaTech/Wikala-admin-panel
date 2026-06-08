'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { FieldWrapper, Input, Select } from '@/components/forms/Field';
import { useZodForm, applyServerErrors } from '@/lib/forms/use-zod-form';
import { ApiError } from '@/lib/api/errors';
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  type CurrencyDTO,
  type CurrencyStatus,
} from '@/features/settings/use-currencies';

const FLAGS: Record<string, string> = {
  EGP: '🇪🇬', USD: '🇺🇸', SAR: '🇸🇦', AED: '🇦🇪', EUR: '🇪🇺', GBP: '🇬🇧', KWD: '🇰🇼', QAR: '🇶🇦',
};

const fmtRate = (n: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(n);

interface CurrencyTableProps {
  /** Base currency code — its rate is locked at 1.00 and labelled "أساسية". */
  baseCurrency: string;
}

export function CurrencyTable({ baseCurrency }: CurrencyTableProps) {
  const { data: currencies, isLoading, isError } = useCurrencies();
  const [editing, setEditing] = useState<CurrencyDTO | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <Card
      title="إدارة العملات"
      sub={`${baseCurrency} افتراضي · يمكن إضافة عملات إضافية`}
      pad={false}
      actions={
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-[7px] border border-border px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-surface"
        >
          <Icon name="plus" size={12} /> إضافة عملة
        </button>
      }
    >
      {isError ? (
        <div className="p-6 text-center text-[13px] text-muted">تعذّر تحميل العملات.</div>
      ) : isLoading ? (
        <div className="animate-pulse p-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-11 border-b border-border last:border-0" />)}
        </div>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-5 py-2.5 text-start font-medium">العملة</th>
              <th className="px-5 py-2.5 text-start font-medium">الكود</th>
              <th className="px-5 py-2.5 text-start font-medium">سعر التحويل ({baseCurrency})</th>
              <th className="px-5 py-2.5 text-start font-medium">الحالة</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {(currencies ?? []).length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-muted">لا توجد عملات</td></tr>
            ) : (
              (currencies ?? []).map((c) => {
                const isBase = c.code === baseCurrency;
                return (
                  <tr key={c.code} className="border-b border-border last:border-0">
                    <td className="px-5 py-3"><b className="font-semibold text-ink">{c.nameAr}</b> {FLAGS[c.code] ?? ''}</td>
                    <td className="px-5 py-3 font-mono text-ink">{c.code}</td>
                    <td className="px-5 py-3 font-mono text-ink">
                      {isBase ? '1.00 (افتراضي)' : fmtRate(c.exchangeRateToBase)}
                    </td>
                    <td className="px-5 py-3">
                      {isBase ? (
                        <Chip tone="green" dot>أساسية</Chip>
                      ) : c.status === 'ACTIVE' ? (
                        <Chip tone="green" dot>نشطة</Chip>
                      ) : (
                        <Chip tone="gray">مسودة</Chip>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setEditing(c)}
                        className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface-2 hover:text-ink"
                        aria-label="تعديل العملة"
                      >
                        <Icon name="more-h" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {adding && <CurrencyForm onClose={() => setAdding(false)} />}
      {editing && (
        <CurrencyForm
          currency={editing}
          rateLocked={editing.code === baseCurrency}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

const createSchema = z.object({
  code: z.string().trim().toUpperCase().length(3, 'كود من 3 أحرف (ISO)'),
  nameAr: z.string().trim().min(1, 'الاسم بالعربية مطلوب'),
  nameEn: z.string().trim().min(1, 'الاسم بالإنجليزية مطلوب'),
  exchangeRateToBase: z.coerce.number().positive('سعر التحويل يجب أن يكون أكبر من صفر'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type CurrencyFormValues = z.infer<typeof createSchema>;

interface CurrencyFormProps {
  currency?: CurrencyDTO;
  rateLocked?: boolean;
  onClose: () => void;
}

function CurrencyForm({ currency, rateLocked = false, onClose }: CurrencyFormProps) {
  const isEdit = !!currency;
  const create = useCreateCurrency();
  const update = useUpdateCurrency();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useZodForm(createSchema, {
    defaultValues: {
      code: currency?.code ?? '',
      nameAr: currency?.nameAr ?? '',
      nameEn: currency?.nameEn ?? '',
      exchangeRateToBase: currency?.exchangeRateToBase ?? 1,
      status: (currency?.status ?? 'ACTIVE') as CurrencyStatus,
    },
  });

  const onSubmit = handleSubmit(async (v: CurrencyFormValues) => {
    setSubmitError(null);
    try {
      if (isEdit && currency) {
        await update.mutateAsync({
          code: currency.code,
          payload: {
            nameAr: v.nameAr,
            nameEn: v.nameEn,
            ...(rateLocked ? {} : { exchangeRateToBase: v.exchangeRateToBase }),
            status: v.status,
          },
        });
      } else {
        await create.mutateAsync(v);
      }
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        applyServerErrors(setError as never, e);
        setSubmitError(e.message);
      } else {
        setSubmitError('تعذّر حفظ العملة. حاول مرة أخرى.');
      }
    }
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-[12px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold text-ink">{isEdit ? `تعديل ${currency?.code}` : 'إضافة عملة'}</h2>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-7 w-7 place-items-center rounded-[6px] text-muted hover:bg-surface hover:text-ink">
            <Icon name="x" size={15} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-5">
          {submitError && <p className="rounded-[8px] bg-red/5 px-3 py-2 text-[12.5px] text-red border border-red/20">{submitError}</p>}

          <FieldWrapper label="الكود (ISO)" required error={errors.code?.message} hint={isEdit ? 'لا يمكن تغيير الكود' : 'مثال: USD'}>
            <Input {...register('code')} dir="ltr" className="text-start uppercase" maxLength={3} error={!!errors.code} disabled={isEdit} />
          </FieldWrapper>

          <FieldWrapper label="الاسم بالعربية" required error={errors.nameAr?.message}>
            <Input {...register('nameAr')} placeholder="الدولار الأمريكي" error={!!errors.nameAr} />
          </FieldWrapper>

          <FieldWrapper label="الاسم بالإنجليزية" required error={errors.nameEn?.message}>
            <Input {...register('nameEn')} placeholder="US Dollar" dir="ltr" className="text-start" error={!!errors.nameEn} />
          </FieldWrapper>

          <FieldWrapper
            label="سعر التحويل للعملة الأساسية"
            required={!rateLocked}
            error={errors.exchangeRateToBase?.message}
            hint={rateLocked ? 'العملة الأساسية ثابتة عند 1.00' : undefined}
          >
            <Input
              {...register('exchangeRateToBase')}
              type="number"
              step="0.0001"
              dir="ltr"
              className="text-start font-mono"
              error={!!errors.exchangeRateToBase}
              disabled={rateLocked}
            />
          </FieldWrapper>

          <FieldWrapper label="الحالة" error={errors.status?.message}>
            <Select {...register('status')} error={!!errors.status}>
              <option value="ACTIVE">نشطة</option>
              <option value="INACTIVE">مسودة</option>
            </Select>
          </FieldWrapper>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface">إلغاء</button>
            <button type="submit" disabled={isSubmitting || create.isPending || update.isPending} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50">
              {isSubmitting || create.isPending || update.isPending ? 'جارٍ الحفظ…' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
