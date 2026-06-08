import { useQuery } from '@tanstack/react-query';
import { get, getPaged, type PageMeta } from '@/lib/api/client';

export type ChatSafetyReason = 'external_url' | 'phone_in_text' | 'no_watermark' | 'fraud_match';
export type ChatSafetySeverity = 'high' | 'med' | 'low';
export type ChatSafetyAutoAction = 'warn' | 'hide_phone' | 'block_link' | 'flag';
export type ReviewerDecision = 'CONFIRM_BLOCK' | 'DISMISS' | 'WARN_USER' | 'BAN_USER';

export interface Party {
  id: string;
  name: string | null;
}

export interface FlaggedThreadAd {
  id: string;
  title: string | null;
  slug: string | null;
}

/** Row in the "محادثات مرفوعة للمراجعة" table (API §7.29 ChatSafetyFlagDTO, enriched). */
export interface FlaggedThreadDTO {
  id: string;
  messageId: string | null;
  chatId: string | null;
  reason: ChatSafetyReason;
  severity: ChatSafetySeverity;
  autoAction: ChatSafetyAutoAction;
  reviewerId: string | null;
  reviewerDecision: ReviewerDecision | null;
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  parties: { sender: Party | null; recipient: Party | null };
  ad: FlaggedThreadAd | null;
  messagePreview: string | null;
}

export interface ThreadContextMessage {
  id: string;
  senderId: string | null;
  senderName: string | null;
  body: string | null;
  type: string;
  scamFlags: string[];
  createdAt: string | null;
  isFlagged: boolean;
}

export interface FlaggedThreadDetailDTO extends FlaggedThreadDTO {
  message: { id: string; body: string | null; type: string; senderId: string | null; createdAt: string | null } | null;
  context: ThreadContextMessage[];
}

export interface ChatSafetyStats {
  chatsToday: number;
  autoBlockedUrls: number;
  chatReports: number;
  voipCallsToday: number;
}

export type FlaggedStatusFilter = 'pending' | 'all' | ReviewerDecision;

export interface FlaggedThreadsParams {
  reason?: ChatSafetyReason | 'ALL';
  status?: FlaggedStatusFilter;
  page?: number;
}

function buildQuery(params: FlaggedThreadsParams): string {
  const q = new URLSearchParams();
  if (params.reason && params.reason !== 'ALL') q.set('reason', params.reason);
  if (params.status && params.status !== 'all') q.set('status', params.status);
  if (params.page && params.page > 1) q.set('page', String(params.page));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function useFlaggedThreads(params: FlaggedThreadsParams = {}) {
  return useQuery({
    queryKey: ['chat-safety', 'flagged', params],
    queryFn: () => getPaged<FlaggedThreadDTO>(`/admin/chat-safety/flagged${buildQuery(params)}`),
    staleTime: 15_000,
  });
}

export function useChatSafetyStats() {
  return useQuery({
    queryKey: ['chat-safety', 'stats'],
    queryFn: () => get<ChatSafetyStats>('/admin/chat-safety/stats'),
    staleTime: 30_000,
  });
}

export function useFlagDetail(flagId: string | null) {
  return useQuery({
    queryKey: ['chat-safety', 'flag', flagId],
    queryFn: () => get<FlaggedThreadDetailDTO>(`/admin/chat-safety/flags/${flagId}`),
    enabled: !!flagId,
    staleTime: 10_000,
  });
}

export type { PageMeta };
