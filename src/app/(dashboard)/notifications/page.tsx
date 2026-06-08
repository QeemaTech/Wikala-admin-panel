'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Tabs } from '@/components/ui/Tabs';
import { CampaignComposer } from '@/components/notifications/CampaignComposer';
import { CampaignTable } from '@/components/notifications/CampaignTable';
import { CampaignStatsDrawer } from '@/components/notifications/CampaignStatsDrawer';
import { useCampaignCounts, type CampaignDTO } from '@/features/notifications/use-campaigns';

type Tab = 'compose' | 'sent' | 'scheduled';

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('compose');
  const [statsFor, setStatsFor] = useState<CampaignDTO | null>(null);
  const counts = useCampaignCounts();

  const tabs = [
    { id: 'compose', label: 'إنشاء حملة' },
    { id: 'sent', label: 'المُرسلة', count: counts.sent },
    { id: 'scheduled', label: 'مجدوّلة', count: counts.scheduled },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="الإشعارات والحملات"
        sub="إرسال إشعارات Push مستهدفة للمستخدمين بناءً على الفئة، الموقع، أو السلوك"
      />

      <Tabs items={tabs} value={tab} onChange={(id) => setTab(id as Tab)} />

      {tab === 'compose' && <CampaignComposer />}
      {tab === 'sent' && <CampaignTable mode="sent" onViewStats={setStatsFor} />}
      {tab === 'scheduled' && <CampaignTable mode="scheduled" />}

      {statsFor && <CampaignStatsDrawer campaign={statsFor} onClose={() => setStatsFor(null)} />}
    </div>
  );
}
