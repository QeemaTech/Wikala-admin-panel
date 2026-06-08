import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime, actionToTone, toneColor, formatActivityEntry } from '@/lib/i18n/format';
import type { ActivityEntry } from '@/features/dashboard/use-dashboard';

interface ActivityFeedCardProps {
  entries: ActivityEntry[];
}

export function ActivityFeedCard({ entries }: ActivityFeedCardProps) {
  return (
    <Card title="آخر النشاطات" sub="أحدث 6 إجراءات إدارية">
      <div className="space-y-1">
        {entries.length === 0 && (
          <p className="py-4 text-center text-[13px] text-muted">لا توجد نشاطات</p>
        )}
        {entries.slice(0, 6).map((entry) => {
          const tone = actionToTone(entry.action);
          const color = toneColor(tone);
          const parts = formatActivityEntry(
            entry.action,
            entry.actor.name,
            entry.actor.type,
            entry.subjectType,
            entry.subjectId,
            entry.detail,
            entry.subjectName,
          );
          return (
            <div key={entry.id} className="flex items-start gap-3 rounded-[8px] px-2 py-2.5">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center">
                {entry.actor.name ? (
                  <Avatar name={entry.actor.name} size={32} />
                ) : (
                  <span
                    className="flex h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] leading-[1.45] text-ink">
                  <span className="font-semibold">{parts.actor}</span>
                  {' '}
                  <span style={{ color }}>{parts.verb}</span>
                  {parts.ref && <span className="text-muted"> — {parts.ref}</span>}
                  {parts.extra && <span className="text-muted"> — {parts.extra}</span>}
                </p>
              </div>
              <time className="shrink-0 text-[11px] text-muted" dateTime={entry.createdAt}>
                {entry.createdAt ? formatRelativeTime(entry.createdAt) : '—'}
              </time>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
