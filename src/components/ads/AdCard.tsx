'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { FavoriteBadge } from './FavoriteBadge';
import { formatNumber, formatRelativeTime } from '@/lib/i18n/format';
import { governorateLabel } from '@/lib/constants/enums';
import type { ModerationItemDTO, AiVerdict } from '@/features/ads/use-ads';

function fmtPrice(minor: number, currency: string): string {
  return `${formatNumber(Math.round(minor / 100))} ${currency}`;
}
function fmtRelative(iso: string | null): string {
  return iso ? formatRelativeTime(iso) : '';
}

type Tone = 'green' | 'red' | 'amber' | 'violet' | 'gray';

// Category-tinted image box (design `.ad-card .imgbox`), mapped from known Arabic
// category names with a deterministic fallback palette for the rest.
const NAMED_GRADIENTS: Record<string, string> = {
  'عقارات': 'linear-gradient(135deg,#a4c4e0,#d5d8b7)',
  'سيارات': 'linear-gradient(135deg,#5a7393,#2c4564)',
  'مركبات': 'linear-gradient(135deg,#5a7393,#2c4564)',
  'إلكترونيات': 'linear-gradient(135deg,#cfd7e0,#94a4b7)',
  'هواتف': 'linear-gradient(135deg,#cfd7e0,#94a4b7)',
  'ملابس وأزياء': 'linear-gradient(135deg,#e8b8c4,#b3829c)',
  'موضة': 'linear-gradient(135deg,#e8b8c4,#b3829c)',
};
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg,#c4dcc5,#7eac82)',
  'linear-gradient(135deg,#c8d6e4,#a7bbd0)',
  'linear-gradient(135deg,#e0d3c0,#bfa888)',
  'linear-gradient(135deg,#cdc4e0,#9a8bc0)',
];

function gradientFor(categoryName: string | null, categoryId: string | null): string {
  if (categoryName && NAMED_GRADIENTS[categoryName]) return NAMED_GRADIENTS[categoryName];
  const key = categoryId ?? categoryName ?? '';
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACK_GRADIENTS[h % FALLBACK_GRADIENTS.length];
}

// aiRiskScore is a 0–100 scale per API contract (line 2195: "risk_score 0-100").
function verdictBadge(verdict: AiVerdict, risk: number | null): { label: string; tone: Tone } {
  if (verdict === 'REJECT') return { label: 'رفض آلي', tone: 'red' };
  if (verdict === 'FLAG') return { label: 'مُعلَّم', tone: 'amber' };
  if (verdict === 'APPROVE') return { label: 'قبول آلي', tone: 'green' };
  const r = risk ?? 0;
  if (r >= 75) return { label: 'مخاطرة عالية', tone: 'red' };
  if (r >= 50) return { label: 'مخاطرة متوسطة', tone: 'amber' };
  return { label: 'قيد التقييم', tone: 'violet' };
}

function riskColor(risk: number | null): string {
  const r = risk ?? 0;
  return r >= 75 ? '#d44030' : r >= 50 ? '#d98a17' : '#178a8a';
}

interface AdCardProps {
  item: ModerationItemDTO;
  categoryName?: string | null;
  onApprove?: (adId: string) => void;
  onReject?: (adId: string) => void;
  onEscalate?: (adId: string) => void;
  onView?: (item: ModerationItemDTO) => void;
}

export function AdCard({ item, categoryName = null, onApprove, onReject, onEscalate, onView }: AdCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { ad } = item;
  const aiPct = Math.round(item.aiRiskScore ?? 0);
  const badge = verdictBadge(item.aiVerdict, item.aiRiskScore);
  const cover = ad.media?.find((m) => m.order === 0) ?? ad.media?.[0];
  const coverUrl = cover?.variants?.thumb || cover?.variants?.w720 || cover?.originalUrl || null;
  const sellerName = ad.seller?.name ?? 'بائع';
  const loc = [governorateLabel(ad.governorate), ad.district].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div
        className="relative grid h-40 place-items-center text-white"
        style={{ background: gradientFor(categoryName, ad.categoryId) }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={ad.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Icon name="image-frame" size={42} color="rgba(255,255,255,.85)" strokeWidth={1.2} />
        )}
        <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 rounded-[8px] bg-[rgba(13,42,68,.85)] px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Icon name="sparkles" size={11} />
          AI {aiPct}%
        </div>
        {ad.priceMinor != null && (
          <div className="absolute top-2.5 end-2.5 rounded-[8px] bg-white/95 px-2.5 py-1 font-mono text-[12px] font-bold text-wk-blue">
            {fmtPrice(ad.priceMinor, ad.currency)}
          </div>
        )}
      </div>

      <div className="p-3.5">
        <h4 className="text-[14.5px] font-bold text-ink">{ad.title}</h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Chip tone={badge.tone}>{badge.label}</Chip>
          {categoryName && <Chip tone="gray">{categoryName}</Chip>}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <Avatar name={sellerName} src={ad.seller?.avatarUrl} size={26} />
          <div className="flex-1 min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-ink">{sellerName}</div>
            <div className="truncate font-mono text-[11px] text-muted">{ad.id.slice(-6)} · {loc || '—'}</div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[11px] text-muted">{fmtRelative(item.createdAt)}</span>
            <FavoriteBadge count={ad.favCount} size={12} />
          </div>
        </div>
      </div>

      {item.aiReasons.length > 0 && (
        <div className="px-3.5 pb-3">
          {item.aiReasons.map((r, i) => (
            <div key={i} className="flex items-start gap-2 py-1 text-[12px] text-ink/80">
              <Icon name="alert-triangle" size={13} color={riskColor(item.aiRiskScore)} className="mt-0.5 shrink-0" />
              <span className="flex-1">{r}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-border bg-surface-2 px-3.5 py-3">
        {/* Approve/reject only apply to items still awaiting a decision. Already
            -decided items (APPROVED/REJECTED/ESCALATED) show only "view". */}
        {item.status === 'PENDING_HUMAN' && (
          <>
            <button
              type="button"
              onClick={() => onApprove?.(ad.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-green px-3 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-green/90"
            >
              <Icon name="check" size={14} /> قبول
            </button>
            <button
              type="button"
              onClick={() => onReject?.(ad.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-red px-3 py-[7px] text-[13px] font-medium text-white transition-colors hover:bg-red/90"
            >
              <Icon name="x" size={14} /> رفض
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onView?.(item)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 py-[7px] text-[13px] font-medium text-ink transition-colors hover:bg-surface-2"
        >
          <Icon name="eye" size={14} /> عرض
        </button>
        {onEscalate && item.status === 'PENDING_HUMAN' && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex h-full items-center justify-center rounded-[8px] border border-border bg-surface px-2.5 py-[7px] text-muted hover:bg-surface-2"
              aria-label="المزيد"
            >
              <Icon name="more-h" size={14} />
            </button>
            {menuOpen && (
              <div className="absolute end-0 bottom-full z-20 mb-1 w-28 rounded-[8px] border border-border bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onMouseDown={() => { onEscalate(ad.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12.5px] text-amber hover:bg-surface-2"
                >
                  <Icon name="arrow-up" size={12} />
                  تصعيد
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
