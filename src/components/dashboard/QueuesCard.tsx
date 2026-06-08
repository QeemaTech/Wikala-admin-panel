import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { BarRow } from '@/components/ui/BarRow';
import type { DashboardQueues } from '@/features/dashboard/use-dashboard';

interface QueuesCardProps {
  queues: DashboardQueues;
}

export function QueuesCard({ queues }: QueuesCardProps) {
  const items = [
    { label: 'إعلانات للمراجعة', value: queues.moderation, color: '#d44030', right: `${queues.moderation} إعلان` },
    { label: 'طلبات توثيق فردي', value: queues.verificationsIndividual, color: '#226199', right: `${queues.verificationsIndividual} طلب` },
    { label: 'طلبات توثيق متجر', value: queues.verificationsStore, color: '#7a4cc4', right: `${queues.verificationsStore} طلب` },
    { label: 'بلاغات نشطة', value: queues.reportsOpen, color: '#d98a17', right: `${queues.reportsOpen} بلاغ` },
    { label: 'مزادات تنتهي اليوم', value: queues.auctionsEndingToday, color: '#178a8a', right: `${queues.auctionsEndingToday} مزاد` },
  ];

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card title="قوائم الانتظار" sub="مهام تحتاج تدخل بشري">
      <div className="space-y-3">
        {items.map((item) => (
          <BarRow
            key={item.label}
            label={item.label}
            value={item.value}
            max={max}
            color={item.color}
            right={item.right}
          />
        ))}
        <div className="border-t border-border pt-3">
          <Link
            href="/moderation"
            className="flex w-full items-center justify-center rounded-[8px] bg-wk-blue px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            فتح طابور الإشراف
          </Link>
        </div>
      </div>
    </Card>
  );
}
