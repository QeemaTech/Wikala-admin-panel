import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import type { ModerationItemDTO } from '@/features/ads/use-ads';

/**
 * Subscribes to 'moderation:new' on the /admin Socket.IO namespace.
 * Invalidates the moderation query cache so new items appear without a manual refresh.
 * Cleans up on unmount — no memory leak.
 */
export function useModerationSocket(): void {
  const qc = useQueryClient();

  const onNew = useCallback(
    (_item: ModerationItemDTO) => {
      qc.invalidateQueries({ queryKey: ['moderation'] });
      qc.invalidateQueries({ queryKey: ['moderation-count'] });
    },
    [qc],
  );

  useSocketEvent<ModerationItemDTO>('moderation:new', onNew);
}
