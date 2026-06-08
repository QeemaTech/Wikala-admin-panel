'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { VerificationSplitView } from '@/components/verifications/VerificationSplitView';
import { useVerifications, type VerificationTab } from '@/features/verifications/use-verifications';

const TAB_MAP: Record<string, VerificationTab> = {
  all: 'ALL',
  ind: 'INDIVIDUAL',
  store: 'STORE',
  returned: 'RETURNED',
};

export default function VerificationsPage() {
  const [tab, setTab] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useVerifications(TAB_MAP[tab]);
  const items = useMemo(() => data?.items ?? [], [data]);
  const counts = data?.meta.counts;

  // Auto-select the first item when the list loads (or the selection falls out of the list).
  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !items.some((v) => v.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const tabs: TabItem[] = [
    { id: 'all', label: 'الكل', count: counts?.all ?? null },
    { id: 'ind', label: 'فردي', count: counts?.individual ?? null },
    { id: 'store', label: 'متاجر', count: counts?.store ?? null },
    { id: 'returned', label: 'محتاج تعديل', count: counts?.returned ?? null },
  ];

  // After a decision, advance to the next request in the queue.
  const handleDecided = () => {
    const idx = items.findIndex((v) => v.id === selectedId);
    const next = items[idx + 1] ?? items.find((v) => v.id !== selectedId) ?? null;
    setSelectedId(next?.id ?? null);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="طلبات التوثيق"
        sub="SLA: 1–2 يوم عمل · المراجعة تشمل الهوية والصورة الشخصية وللمتاجر الوثائق التجارية"
      />
      <Tabs
        items={tabs}
        value={tab}
        onChange={(id) => {
          setTab(id);
          setSelectedId(null);
        }}
      />
      <VerificationSplitView
        items={items}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDecided={handleDecided}
      />
    </div>
  );
}
