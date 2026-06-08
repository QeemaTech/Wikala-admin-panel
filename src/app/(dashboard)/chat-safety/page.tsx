'use client';

import { useState } from 'react';
import { PageHead } from '@/components/ui/PageHead';
import { Icon } from '@/components/ui/Icon';
import { ChatSafetyKpiStrip } from '@/components/chat-safety/ChatSafetyKpiStrip';
import { FlaggedThreadsTable } from '@/components/chat-safety/FlaggedThreadsTable';
import { ThreadReviewDrawer } from '@/components/chat-safety/ThreadReviewDrawer';
import { DetectionRulesPanel } from '@/components/chat-safety/DetectionRulesPanel';
import type { FlaggedThreadDTO } from '@/features/chat-safety/use-flagged-threads';

export default function ChatSafetyPage() {
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<FlaggedThreadDTO | null>(null);
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-7 pb-14 pt-6">
      <PageHead
        title="حماية المحادثات"
        sub="مراقبة آلية للروابط الخارجية والصور المشبوهة في محادثات المستخدمين"
        actions={
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            <Icon name="sliders" size={14} /> قواعد الكشف
          </button>
        }
      />

      <div className="mb-4">
        <ChatSafetyKpiStrip />
      </div>

      <FlaggedThreadsTable
        params={{ status: 'all', page }}
        onPageChange={setPage}
        onOpen={setActive}
      />

      {active && <ThreadReviewDrawer thread={active} onClose={() => setActive(null)} />}
      {showRules && <DetectionRulesPanel onClose={() => setShowRules(false)} />}
    </div>
  );
}
