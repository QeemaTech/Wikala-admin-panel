'use client';

import { useState } from 'react';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/forms/Field';
import { formatNumber, formatPercent } from '@/lib/i18n/format';
import { buildPages } from '@/lib/ui/build-pages';
import {
  useCampaigns,
  campaignTypeLabel,
  CAMPAIGN_TYPE_TONE,
  type CampaignDTO,
  type CampaignType,
} from '@/features/notifications/use-campaigns';
import { useCancelCampaign, useRescheduleCampaign } from '@/features/notifications/use-campaign-send';

const AR_GREG = 'ar-SA-u-ca-gregory';
const BIDI = /[‎‏‪-‮⁦-⁩]/g;
function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat(AR_GREG, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    .format(new Date(iso))
    .replace(BIDI, '');
}

function typeChip(type: CampaignType) {
  return <Chip tone={CAMPAIGN_TYPE_TONE[type] ?? 'gray'}>{campaignTypeLabel(type)}</Chip>;
}

interface CampaignTableProps {
  mode: 'sent' | 'scheduled';
  onViewStats?: (campaign: CampaignDTO) => void;
}

export function CampaignTable({ mode, onViewStats }: CampaignTableProps) {
  const [page, setPage] = useState(1);
  const [rescheduling, setRescheduling] = useState<CampaignDTO | null>(null);
  const { data, isLoading, isError } = useCampaigns(mode === 'sent' ? 'SENT' : 'SCHEDULED', page);

  if (isError) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface p-8 text-center text-[13px] text-muted">
        تعذّر تحميل الحملات
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-[var(--radius)] border border-border bg-surface">
        {[...Array(5)].map((_, i) => <div key={i} className="h-[56px] border-b border-border last:border-0" />)}
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * 20 + 1;
  const to = Math.min(from + items.length - 1, total);
  const isSent = mode === 'sent';

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-4 py-3 text-start font-medium text-muted">الحملة</th>
              <th className="px-4 py-3 text-start font-medium text-muted">النوع</th>
              <th className="px-4 py-3 text-start font-medium text-muted">الجمهور</th>
              {isSent ? (
                <>
                  <th className="px-4 py-3 text-start font-medium text-muted">تم الإرسال</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">تم الفتح</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">معدل الفتح</th>
                  <th className="px-4 py-3 text-start font-medium text-muted">التاريخ</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-start font-medium text-muted">موعد الإرسال</th>
                  <th className="px-4 py-3" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={isSent ? 7 : 5} className="py-12 text-center text-muted">
                  {isSent ? 'لا توجد حملات مُرسلة' : 'لا توجد حملات مجدولة'}
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr
                  key={c.id}
                  className={`border-b border-border last:border-0 hover:bg-surface/60 ${isSent ? 'cursor-pointer' : ''}`}
                  onClick={isSent ? () => onViewStats?.(c) : undefined}
                >
                  <td className="px-4 py-3 font-semibold text-ink">{c.title}</td>
                  <td className="px-4 py-3">{typeChip(c.type)}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatNumber(c.targetCountEstimate)}</td>
                  {isSent ? (
                    <>
                      <td className="px-4 py-3 font-mono text-ink">{formatNumber(c.stats.delivered)}</td>
                      <td className="px-4 py-3 font-mono text-ink">{formatNumber(c.stats.opened)}</td>
                      <td className="px-4 py-3"><Chip tone="green">{formatPercent(c.stats.ctr)}</Chip></td>
                      <td className="px-4 py-3 text-muted">{fmtDate(c.sentAt ?? c.createdAt)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-muted">{fmtDate(c.scheduledAt)}</td>
                      <td className="px-4 py-3">
                        <ScheduledActions
                          campaign={c}
                          onReschedule={() => setRescheduling(c)}
                        />
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-border px-[18px] py-3 text-[12px] text-muted">
          <span>تعرض {formatNumber(from)}–{formatNumber(to)} من {formatNumber(total)} حملة</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40">
              <Icon name="chevron-end" size={12} />
            </button>
            {buildPages(page, pages).map((p, i) =>
              p === '...' ? (
                <span key={`e-${i}`} className="grid h-7 min-w-[28px] place-items-center text-ink-2">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`grid h-7 min-w-[28px] place-items-center rounded-[7px] border px-1 text-[12px] transition-colors ${p === page ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-ink-2 hover:bg-surface-2'}`}
                >
                  {formatNumber(p)}
                </button>
              ),
            )}
            <button onClick={() => setPage(page + 1)} disabled={page >= pages} className="grid h-7 w-7 place-items-center rounded-[7px] border border-border bg-surface text-ink-2 hover:bg-surface-2 disabled:opacity-40">
              <Icon name="chevron-start" size={12} />
            </button>
          </div>
        </div>
      )}

      {rescheduling && (
        <RescheduleDialog campaign={rescheduling} onClose={() => setRescheduling(null)} />
      )}
    </div>
  );
}

function ScheduledActions({ campaign, onReschedule }: { campaign: CampaignDTO; onReschedule: () => void }) {
  const cancel = useCancelCampaign();
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={onReschedule}
        className="flex items-center gap-1 rounded-[6px] border border-border px-2 py-[5px] text-[12px] font-medium text-ink hover:bg-surface-2"
      >
        <Icon name="clock" size={12} /> إعادة جدولة
      </button>
      <button
        type="button"
        onClick={() => cancel.mutate(campaign.id)}
        disabled={cancel.isPending}
        className="flex items-center gap-1 rounded-[6px] border border-red/30 px-2 py-[5px] text-[12px] font-medium text-red hover:bg-red/5 disabled:opacity-50"
      >
        <Icon name="x" size={12} /> {cancel.isPending ? 'جارٍ…' : 'إلغاء'}
      </button>
    </div>
  );
}

function RescheduleDialog({ campaign, onClose }: { campaign: CampaignDTO; onClose: () => void }) {
  const reschedule = useRescheduleCampaign();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const valid = !!value && new Date(value).getTime() > Date.now();

  const submit = () => {
    setError(null);
    reschedule.mutate(
      { id: campaign.id, scheduledAt: new Date(value).toISOString() },
      { onSuccess: onClose, onError: (e) => setError(e instanceof Error ? e.message : 'تعذّرت إعادة الجدولة.') },
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-amber-50 text-amber"><Icon name="clock" size={20} /></div>
          <div>
            <h3 className="text-[15px] font-semibold text-ink">إعادة جدولة</h3>
            <p className="text-[12px] text-muted">{campaign.title}</p>
          </div>
        </div>
        <label className="mb-1.5 block text-[13px] font-medium text-ink">الموعد الجديد</label>
        <Input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />
        {!valid && value && <p className="mt-1 text-[12px] text-red">اختر وقتًا في المستقبل</p>}
        {error && <p className="mt-1 text-[12px] text-red">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-[8px] border border-border px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">إلغاء</button>
          <button onClick={submit} disabled={reschedule.isPending || !valid} className="rounded-[8px] bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand/90 disabled:opacity-50">
            {reschedule.isPending ? 'جارٍ…' : 'حفظ الموعد'}
          </button>
        </div>
      </div>
    </div>
  );
}
