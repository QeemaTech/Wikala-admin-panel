'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Select, Input, Switch } from '@/components/forms/Field';
import { useAuctionRules, useUpdateAuctionRules, type AuctionRulesRaw } from '@/features/auctions/use-auction-rules';

interface RulesForm {
  defaultDurationDays: number;
  maxDurationDays: number;
  minIncrementMajor: number; // shown in major units (e.g. EGP), persisted as minor
  verifiedOnly: boolean;
  autoExtendEnabled: boolean;
  outbidPushEnabled: boolean;
}

function toForm(r: AuctionRulesRaw): RulesForm {
  return {
    defaultDurationDays: r.default_duration_days,
    maxDurationDays: r.max_duration_days,
    minIncrementMajor: r.min_bid_increment_minor / 100,
    verifiedOnly: r.verified_only,
    autoExtendEnabled: r.auto_extend_enabled,
    outbidPushEnabled: r.outbid_push_enabled,
  };
}

/** Builds a sorted, unique day-option list that always includes the current value. */
function dayOptions(base: number[], current: number): number[] {
  return Array.from(new Set([...base, current])).sort((a, b) => a - b);
}

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

export function AuctionRulesEditor() {
  const { data, isLoading, isError } = useAuctionRules();
  const update = useUpdateAuctionRules();
  const [form, setForm] = useState<RulesForm | null>(null);
  const [initial, setInitial] = useState<RulesForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      const f = toForm(data);
      setForm(f);
      setInitial(f);
    }
  }, [data]);

  const set = <K extends keyof RulesForm>(key: K, value: RulesForm[K]) => {
    setForm((p) => (p ? { ...p, [key]: value } : p));
    setError(null);
  };

  const minIncrementMinor = form ? Math.round(form.minIncrementMajor * 100) : 0;
  const isValid = Number.isInteger(minIncrementMinor) && minIncrementMinor >= 1 && minIncrementMinor <= 100000;
  const isDirty = useMemo(
    () => !!form && !!initial && JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );

  const save = () => {
    if (!form || !isValid) {
      setError('الحد الأدنى للمزايدة يجب أن يكون رقمًا موجبًا (حتى 1000).');
      return;
    }
    update.mutate(
      {
        defaultDurationDays: form.defaultDurationDays,
        maxDurationDays: form.maxDurationDays,
        minBidIncrementMinor: minIncrementMinor,
        verifiedOnly: form.verifiedOnly,
        autoExtendEnabled: form.autoExtendEnabled,
        outbidPushEnabled: form.outbidPushEnabled,
      },
      {
        onSuccess: (raw) => setInitial(toForm(raw)),
        onError: (e) => setError(e instanceof Error ? e.message : 'تعذّر حفظ القواعد.'),
      },
    );
  };

  return (
    <Card
      title="قواعد المزاد العامة"
      sub="تنطبق على جميع المزادات الجديدة (PRD §5.4.3)"
      actions={
        <button
          onClick={save}
          disabled={!isDirty || !isValid || update.isPending}
          className="flex items-center gap-1.5 rounded-[8px] bg-brand px-3.5 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50"
        >
          {update.isPending ? 'جارٍ الحفظ...' : 'حفظ القواعد'}
        </button>
      }
    >
      {isError ? (
        <div className="py-8 text-center text-[13px] text-muted">
          <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
          <p className="mt-2">تعذّر تحميل قواعد المزاد</p>
        </div>
      ) : isLoading || !form ? (
        <div className="animate-pulse space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-[8px] bg-surface" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-x-8 md:grid-cols-2">
            <div>
              <RuleRow title="مدة المزاد الافتراضية" desc="المدة المطبقة تلقائيًا على المزادات الجديدة">
                <Select
                  value={form.defaultDurationDays}
                  onChange={(e) => set('defaultDurationDays', Number(e.target.value))}
                  className="w-[140px]"
                >
                  {dayOptions([3, 7, 14], form.defaultDurationDays).map((d) => (
                    <option key={d} value={d}>{d} أيام</option>
                  ))}
                </Select>
              </RuleRow>
              <RuleRow title="الحد الأدنى للمزايدة" desc="المقدار الذي يُضاف عند كل مزايدة">
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={1}
                    step="0.01"
                    value={form.minIncrementMajor}
                    onChange={(e) => set('minIncrementMajor', e.target.valueAsNumber || 0)}
                    error={!isValid}
                    className="w-[120px] font-mono"
                  />
                  <span className="text-[12px] text-muted">EGP</span>
                </div>
              </RuleRow>
              <RuleRow title="المزايدة للموثقين فقط" desc="يمنع غير الموثقين من المزايدة">
                <Switch checked={form.verifiedOnly} onChange={(c) => set('verifiedOnly', c)} />
              </RuleRow>
            </div>
            <div>
              <RuleRow title="الحد الأقصى للمدة" desc="أطول مدة يمكن طلبها للمزاد">
                <Select
                  value={form.maxDurationDays}
                  onChange={(e) => set('maxDurationDays', Number(e.target.value))}
                  className="w-[140px]"
                >
                  {dayOptions([7, 14, 30], form.maxDurationDays).map((d) => (
                    <option key={d} value={d}>{d} يوم</option>
                  ))}
                </Select>
              </RuleRow>
              <RuleRow title="تمديد المزاد عند مزايدة لحظية" desc="إضافة وقت إذا تمت مزايدة في آخر دقيقة">
                <Switch checked={form.autoExtendEnabled} onChange={(c) => set('autoExtendEnabled', c)} />
              </RuleRow>
              <RuleRow title='إشعار "تم تجاوزك" Outbid' desc="إرسال Push فوري لمن تم تجاوزه">
                <Switch checked={form.outbidPushEnabled} onChange={(c) => set('outbidPushEnabled', c)} />
              </RuleRow>
            </div>
          </div>
          {error && <p className="mt-3 text-[12.5px] text-red">{error}</p>}
        </>
      )}
    </Card>
  );
}
