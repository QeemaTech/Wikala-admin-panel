import { useInfiniteQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api/client';

export interface ActivityLogEntry {
  id: string;
  actor: { id: string | null; type: string; name: string | null };
  action: string;
  subjectType: string | null;
  subjectId: string | null;
  subjectName: string | null;
  detail: string | null;
  tone: string;
  createdAt: string;
}

interface ActivityLogPage {
  items: ActivityLogEntry[];
  nextCursor: string | null;
}

interface ActivityLogFilters {
  actorId?: string;
  actionType?: string;
  tone?: string;
}

function buildQuery(filters: ActivityLogFilters, cursor?: string): string {
  const params = new URLSearchParams();
  params.set('pageSize', '50');
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.actionType) params.set('actionType', filters.actionType);
  if (filters.tone) params.set('tone', filters.tone);
  if (cursor) params.set('cursor', cursor);
  return params.toString();
}

export function useActivityLog(filters: ActivityLogFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['activity-log', filters],
    queryFn: ({ pageParam }) =>
      apiRequest<ActivityLogPage>(
        `/admin/activity-log?${buildQuery(filters, pageParam as string | undefined)}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
