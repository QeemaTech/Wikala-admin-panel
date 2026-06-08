'use client';

import { VerificationQueue } from './VerificationQueue';
import { VerificationDetailPanel } from './VerificationDetailPanel';
import type { VerificationDTO } from '@/features/verifications/use-verifications';

interface VerificationSplitViewProps {
  items: VerificationDTO[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDecided: () => void;
}

/** Split layout: scrollable queue column on the left, detail panel on the right. */
export function VerificationSplitView({
  items,
  isLoading,
  selectedId,
  onSelect,
  onDecided,
}: VerificationSplitViewProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]"
      style={{ minHeight: 'calc(100vh - 230px)' }}
    >
      <VerificationQueue items={items} selectedId={selectedId} onSelect={onSelect} isLoading={isLoading} />
      <div className="min-w-0">
        <VerificationDetailPanel id={selectedId} onDecided={onDecided} />
      </div>
    </div>
  );
}
