'use client';

import { MobilePreviewPane } from '@/components/preview/MobilePreviewPane';
import { Icon } from '@/components/ui/Icon';

interface NotificationPreviewProps {
  title: string;
  body: string;
}

/**
 * Live lock-screen preview of the composed push notification (design Notifications).
 * The MobilePreviewPane renders a white screen, so a gradient panel is bled to the
 * inner edges (negative margins counter the pane's 18px/14px padding at scale 1).
 */
export function NotificationPreview({ title, body }: NotificationPreviewProps) {
  return (
    <div className="flex justify-center">
      <MobilePreviewPane>
        <div
          className="flex flex-col"
          style={{
            margin: '-18px -14px',
            minHeight: 'calc(100% + 36px)',
            borderRadius: 22,
            padding: '20px 14px',
            background: 'linear-gradient(180deg,#0d2a44,#226199)',
          }}
        >
          <div className="mb-2 text-center font-mono text-[11px] text-white/80">
            10:24 ص — اليوم
          </div>

          <div className="flex items-start gap-2.5 rounded-[14px] bg-white/95 p-3 shadow-lg backdrop-blur">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-wk-blue text-white">
              <Icon name="bell" size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[12.5px] font-bold text-ink">
                {title || 'عنوان الإشعار'}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-ink-2">
                {body || 'نص الإشعار يظهر هنا...'}
              </div>
              <div className="mt-1 text-[10.5px] text-muted">وكالة · الآن</div>
            </div>
          </div>

          <div className="mt-3 rounded-[10px] bg-white/10 p-2.5 text-white">
            <div className="text-[11px] text-white/70">إشعار سابق · أمس</div>
            <div className="mt-1 text-[12px]">تم رفع 4 إعلانات جديدة قرب موقعك</div>
          </div>
        </div>
      </MobilePreviewPane>
    </div>
  );
}
