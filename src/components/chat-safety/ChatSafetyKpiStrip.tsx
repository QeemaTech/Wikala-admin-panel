'use client';

import { KpiCard } from '@/components/ui/KpiCard';
import { Icon } from '@/components/ui/Icon';
import { useChatSafetyStats } from '@/features/chat-safety/use-flagged-threads';

/**
 * Four-card KPI strip for the Chat-Safety page (design: pages-system ChatSafety).
 * All values are "today" (since start of the current UTC day), from
 * GET /admin/chat-safety/stats.
 */
export function ChatSafetyKpiStrip() {
  const { data, isLoading, isError } = useChatSafetyStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[104px] rounded-[var(--radius)] bg-surface" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-surface py-8 text-center">
        <Icon name="alert-triangle" size={22} className="mx-auto text-red" />
        <p className="mt-2 text-[12.5px] text-muted">تعذّر تحميل مؤشرات حماية المحادثات</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
      <KpiCard
        label="محادثات اليوم"
        value={data.chatsToday}
        icon={<Icon name="message-square" size={18} />}
        tintColor="#226199"
      />
      <KpiCard
        label="روابط محظورة تلقائياً"
        value={data.autoBlockedUrls}
        icon={<Icon name="shield-alert" size={18} />}
        tintColor="#d44030"
      />
      <KpiCard
        label="بلاغات من محادثات"
        value={data.chatReports}
        icon={<Icon name="flag" size={18} />}
        tintColor="#d98a17"
      />
      <KpiCard
        label="مكالمات VoIP اليوم"
        value={data.voipCallsToday}
        icon={<Icon name="phone" size={18} />}
        tintColor="#1f9c63"
      />
    </div>
  );
}
