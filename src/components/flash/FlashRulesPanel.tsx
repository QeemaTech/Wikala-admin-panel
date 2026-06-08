'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Select, Input } from '@/components/forms/Field';
import { useFlashRules, useUpdateFlashRules, type FlashRules } from '@/features/flash/use-flash-rules';

function RuleRow({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-ink">{title}</div>
        <div className="mt-0.5 text-[12px] text-muted">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function FlashRulesPanel() {
  const { data, isLoading, isError } = useFlashRules();
  const update = useUpdateFlashRules();
  const [form, setForm] = useState<FlashRules | null>(null);
  const [initial, setInitial] = useState<FlashRules | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm(data);
      setInitial(data);
    }
  }, [data]);

  const set = <K extends keyof FlashRules>(key: K, value: FlashRules[K]) => {
    setForm((p) => (p ? { ...p, [key]: value } : p));
    setError(null);
  };

  const isValid = !!form && form.maxConcurrent >= 1 && form.defaultDurationHours >= 1;
  const isDirty = useMemo(
    () => !!form && !!initial && JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );

  const save = () => {
    if (!form || !isValid) {
      setError('تحقّق من القيم: الحد الأقصى والمدة يجب أن يكونا 1 على الأقل.');
      return;
    }
    update.mutate(form, {
      onSuccess: (flash) => setInitial(flash),
      onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر حفظ القواعد.'),
    });
  };

  return (
    <Card
      title="قواعد العرض"
      sub="إعدادات العروض الفلاش الافتراضية"
      actions={
        <button
          onClick={save}
          disabled={!isDirty || !isValid || update.isPending}
          className="rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {update.isPending ? 'جارٍ الحفظ...' : 'حفظ القواعد'}
        </button>
      }
    >
      {isError ? (
        <div className="py-8 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل قواعد العرض</p>
        </div>
      ) : isLoading || !form ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-[8px] bg-surface" />)}
        </div>
      ) : (
        <>
          <RuleRow title="المصدر الافتراضي" desc="من أين تأتي العروض الفلاش افتراضيًا">
            <Select value={form.defaultSource} onChange={(e) => set('defaultSource', e.target.value as FlashRules['defaultSource'])} className="w-[180px]">
              <option value="ADMIN">تنسيق إداري (وكالة)</option>
              <option value="SELLER_PAID">طلب بائع مدفوع</option>
            </Select>
          </RuleRow>
          <RuleRow title="أقصى عدد عروض متزامنة" desc="عدد العروض النشطة في وقت واحد">
            <Input
              type="number"
              min={1}
              value={form.maxConcurrent}
              onChange={(e) => set('maxConcurrent', e.target.valueAsNumber || 0)}
              className="w-[120px] font-mono"
            />
          </RuleRow>
          <RuleRow title="المدة الافتراضية (ساعات)" desc="مدة العرض الفلاش عند عدم تحديدها">
            <Input
              type="number"
              min={1}
              value={form.defaultDurationHours}
              onChange={(e) => set('defaultDurationHours', e.target.valueAsNumber || 0)}
              className="w-[120px] font-mono"
            />
          </RuleRow>
          {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}
        </>
      )}
    </Card>
  );
}
