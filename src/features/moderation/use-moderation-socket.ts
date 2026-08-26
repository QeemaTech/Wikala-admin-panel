import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import type { ModerationItemDTO } from '@/features/ads/use-ads';

/** Payload of 'moderation:resolved' — someone else decided on an ad. */
export interface ModerationResolvedDTO {
  adId: string;
  decision: 'APPROVE' | 'REJECT' | 'ESCALATE';
  reviewerId: string;
}

/**
 * Keeps the moderation queue in step with what other moderators are doing.
 *
 * Two events, not one. 'moderation:new' was already handled, so arrivals
 * showed up live — but nothing listened for 'moderation:resolved', so
 * *departures* never did. An ad another moderator had already approved stayed
 * on your screen indefinitely, and clicking Approve on it returned
 * "Moderation queue entry not found": the row was gone from the queue, and
 * only your list still believed it was there.
 *
 * That is the normal case, not an edge one — a shared queue is the whole point
 * of the screen, and a stale row reads as a backend bug rather than as someone
 * else having got there first.
 *
 * Cleans up on unmount — no memory leak.
 */
export function useModerationSocket(): void {
  const qc = useQueryClient();

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['moderation'] }); // queue + stats (prefix match)
    // ['moderation-count'] is a SEPARATE key — ['moderation'] does not
    // prefix-match it, so the tab badges go stale unless invalidated too.
    qc.invalidateQueries({ queryKey: ['moderation-count'] });
  }, [qc]);

  const onNew = useCallback((_item: ModerationItemDTO) => refresh(), [refresh]);

  const onResolved = useCallback(
    (_payload: ModerationResolvedDTO) => {
      refresh();
      // An approved ad leaves the queue and joins the live catalogue, so the
      // ads list and the dashboard KPIs are stale as well.
      qc.invalidateQueries({ queryKey: ['admin-ads'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
    [refresh, qc],
  );

  useSocketEvent<ModerationItemDTO>('moderation:new', onNew);
  useSocketEvent<ModerationResolvedDTO>('moderation:resolved', onResolved);
}
