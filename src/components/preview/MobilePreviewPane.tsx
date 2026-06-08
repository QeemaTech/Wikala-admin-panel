import type { ReactNode } from 'react';

interface MobilePreviewPaneProps {
  children: ReactNode;
  /** Visual scale of the phone frame (1 = 280px wide, per design `.phone`). */
  scale?: number;
  className?: string;
}

/**
 * Reusable phone-frame preview (design `.phone` / `.screen`). Consumed by the
 * banner preview (Week 10) and the push composer (Week 12). RTL-correct.
 */
export function MobilePreviewPane({ children, scale = 1, className }: MobilePreviewPaneProps) {
  return (
    <div
      className={className}
      style={{
        width: 280 * scale,
        aspectRatio: '9 / 16',
        borderRadius: 32 * scale,
        background: 'linear-gradient(135deg,#e5edf4,#cbd8e5)',
        padding: 14 * scale,
        boxShadow: '0 24px 60px rgba(13,27,46,.18)',
      }}
    >
      <div
        dir="rtl"
        style={{
          background: '#fff',
          borderRadius: 22 * scale,
          height: '100%',
          padding: `${18 * scale}px ${14 * scale}px`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}
