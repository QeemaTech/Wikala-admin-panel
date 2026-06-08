'use client';

import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { formatRelativeTime } from '@/lib/i18n/format';
import { cn } from '@/lib/utils';
import type { VerificationDTO } from '@/features/verifications/use-verifications';

interface VerificationQueueProps {
  items: VerificationDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function VerificationQueue({ items, selectedId, onSelect, isLoading }: VerificationQueueProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return items;
    return items.filter((v) => (v.user?.name ?? '').includes(q) || v.id.includes(q));
  }, [items, search]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Icon name="search" size={14} className="text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الرقم..."
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[64px] border-b border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid h-full place-items-center p-8 text-center text-[13px] text-muted">
            لا توجد طلبات توثيق
          </div>
        ) : (
          filtered.map((v) => {
            const isStore = v.kind === 'STORE';
            const name = v.user?.name ?? 'مستخدم محذوف';
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-start transition-colors hover:bg-surface-2',
                  v.id === selectedId && 'bg-wk-blue-50',
                )}
              >
                <Avatar
                  name={name}
                  src={v.user?.avatarUrl ?? null}
                  size={36}
                  square
                  color={isStore ? '#7a4cc4' : '#226199'}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-ink">{name}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted">
                    <Chip tone={isStore ? 'violet' : 'blue'}>{isStore ? 'متجر' : 'فردي'}</Chip>
                    {v.user?.governorate && <span className="truncate">{v.user.governorate}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {v.submittedAt && (
                    <span className="font-mono text-[10.5px] text-muted">{formatRelativeTime(v.submittedAt)}</span>
                  )}
                  {v.status === 'RETURNED' && <Chip tone="amber">إعادة</Chip>}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
