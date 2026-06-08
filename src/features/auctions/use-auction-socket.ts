import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/lib/socket/use-socket-event';
import type { AuctionDTO, AuctionStatus } from './use-auctions';

export interface AuctionLiveMonitorEvent {
  auctionId: string;
  currentPriceMinor: number;
  bidCount: number;
  endTime: string | null;
  /** Present only on terminal transitions (ENDED_WON / ENDED_NO_BIDS). */
  status?: AuctionStatus;
}

type AuctionsPage = { items: AuctionDTO[]; meta: unknown };

function isAuctionsPage(v: unknown): v is AuctionsPage {
  return !!v && typeof v === 'object' && Array.isArray((v as AuctionsPage).items);
}

/**
 * Subscribes to `auction:live-monitor` on the /admin namespace (room
 * `admin:auctions-live`, auto-joined for AUCTIONS_RULES staff). Patches the
 * matching row's price / bid count / end-time across every cached auctions
 * page via `setQueriesData` (prefix match) — no refetch storm despite the
 * 1/sec-per-auction throttle. Terminal events invalidate so the row leaves
 * its tab and the KPIs refresh. Cleans up on unmount.
 */
export function useAuctionMonitorSocket(): void {
  const qc = useQueryClient();

  const onMonitor = useCallback(
    (evt: AuctionLiveMonitorEvent) => {
      // The ['auctions'] prefix also covers the kpi and bids queries — guard the
      // updater so it only touches list pages ({ items: AuctionDTO[] }).
      qc.setQueriesData<unknown>({ queryKey: ['auctions'] }, (old: unknown) => {
        if (!isAuctionsPage(old)) return old;
        let changed = false;
        const items = old.items.map((a) => {
          if (a.id !== evt.auctionId) return a;
          changed = true;
          return {
            ...a,
            currentPriceMinor: evt.currentPriceMinor,
            bidCount: evt.bidCount,
            endTime: evt.endTime ?? a.endTime,
            ...(evt.status ? { status: evt.status } : {}),
          };
        });
        return changed ? { ...old, items } : old;
      });

      // An ended auction moves between tabs and changes the KPI totals.
      if (evt.status === 'ENDED_WON' || evt.status === 'ENDED_NO_BIDS') {
        qc.invalidateQueries({ queryKey: ['auctions'] });
        qc.invalidateQueries({ queryKey: ['auctions-count'] });
      }
    },
    [qc],
  );

  useSocketEvent<AuctionLiveMonitorEvent>('auction:live-monitor', onMonitor);
}
