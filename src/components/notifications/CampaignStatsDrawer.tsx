'use client';

import { Icon } from '@/components/ui/Icon';
import { formatNumber, formatPercent } from '@/lib/i18n/format';
import { useCampaignStats } from '@/features/notifications/use-campaign-stats';
import { campaignTypeLabel, type CampaignDTO } from '@/features/notifications/use-campaigns';

interface CampaignStatsDrawerProps {
  campaign: CampaignDTO | null;
  onClose: () => void;
}

function Bar({ label, value, max, color, right }: { label: string; value: number; max: number; color: string; right: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[12.5px]">
        <span className="text-ink-2">{label}</span>
        <span className="font-mono text-muted">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function CampaignStatsDrawer({ campaign, onClose }: CampaignStatsDrawerProps) {
  const { data: stats, isLoading, isError } = useCampaignStats(campaign?.id ?? null);

  if (!campaign) return null;

  return (
    <div className="animate-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div
        className="animate-scale-in flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[16px] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-ink">{campaign.title}</h3>
            <p className="mt-0.5 text-[12px] text-muted">{campaignTypeLabel(campaign.type)} · إحصائيات التسليم</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] border border-border text-muted hover:bg-surface hover:text-ink">
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-[10px] bg-surface-2" />)}</div>
              <div className="h-24 rounded-[10px] bg-surface-2" />
            </div>
          ) : isError || !stats ? (
            <p className="py-8 text-center text-[13px] text-muted">تعذّر تحميل الإحصائيات</p>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-3 gap-3">
                <Stat label="تم التسليم" value={formatNumber(stats.delivered)} />
                <Stat label="تم الفتح" value={formatNumber(stats.opened)} />
                <Stat label="معدل الفتح" value={formatPercent(stats.ctr)} tone="text-green" />
              </div>

              {/* A campaign that reached nobody looks identical to one that has
                  not been opened yet: every number is 0. Say which it is — the
                  usual answer is that the audience has no registered devices,
                  because a push goes to a device and not to an account. */}
              {stats.delivered === 0 && campaign.status === 'SENT' && (
                <div className="mb-4 rounded-[10px] bg-red/10 px-3.5 py-3 text-[12.5px] text-ink-2">
                  <b className="text-red">لم يصل هذا الإشعار إلى أي جهاز.</b>
                  {(stats.unreachable ?? 0) > 0 && (
                    <> {formatNumber(stats.unreachable ?? 0)} مستخدم من الجمهور المستهدف ليس لديه جهاز مسجَّل.</>
                  )}
                  {(stats.failed ?? 0) > 0 && (
                    <> ورفضت خدمة الإشعارات {formatNumber(stats.failed ?? 0)} محاولة إرسال (رمز جهاز غير صالح أو منتهٍ).</>
                  )}
                  <br />
                  يُسجَّل الجهاز عند فتح التطبيق على الهاتف، ولا يمكن إرسال إشعار إلى حساب بدون جهاز.
                </div>
              )}

              <div className="rounded-[var(--radius)] border border-border p-4">
                <div className="mb-3 text-[13px] font-semibold text-ink">تفصيل التسليم</div>
                <Bar
                  label="تم التسليم من الجمهور المستهدف"
                  value={stats.delivered}
                  max={campaign.targetCountEstimate || stats.delivered}
                  color="#226199"
                  right={`${formatNumber(stats.delivered)} / ${formatNumber(campaign.targetCountEstimate || stats.delivered)}`}
                />
                <Bar
                  label="تم الفتح من المُسلَّم"
                  value={stats.opened}
                  max={stats.delivered}
                  color="#1f9c63"
                  right={`${formatNumber(stats.opened)} / ${formatNumber(stats.delivered)}`}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-3 text-center">
      <p className={`font-mono text-[20px] font-bold leading-none ${tone ?? 'text-ink'}`}>{value}</p>
      <p className="mt-1.5 text-[11.5px] text-muted">{label}</p>
    </div>
  );
}
