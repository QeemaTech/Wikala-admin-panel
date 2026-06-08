import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLoaderProps {
  /** Text under the mark. Pass null to hide it. */
  label?: string | null;
  /** Fill the viewport and center (route-level loaders). */
  fullscreen?: boolean;
  className?: string;
}

/**
 * Wikala-branded loading indicator — the logo on its white chip orbited by a
 * brand-blue ring with expanding pulses. Pure-CSS motion (server-safe) and a
 * reduced-motion fallback. Reuse for route `loading.tsx`, panels, and overlays.
 */
export function BrandLoader({ label = 'جارٍ التحميل', fullscreen = false, className }: BrandLoaderProps) {
  return (
    <div
      className={cn(
        'wkl flex flex-col items-center justify-center gap-5',
        fullscreen && 'min-h-screen w-full bg-bg',
        className,
      )}
    >
      <div className="wkl-stage relative grid h-[78px] w-[78px] place-items-center">
        <span aria-hidden className="wkl-pulse" />
        <span aria-hidden className="wkl-pulse wkl-pulse-2" />
        <span aria-hidden className="wkl-ring" />
        <div className="relative grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-white shadow-logo">
          <Image src="/assets/wikala-logo.png" alt="وكالة" width={34} height={34} priority />
        </div>
      </div>

      {label && (
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
          <span>{label}</span>
          <span className="wkl-dots inline-flex gap-1">
            <i /><i /><i />
          </span>
        </div>
      )}

      <span className="sr-only" role="status" aria-live="polite">{label ?? 'جارٍ التحميل'}</span>

      <style>{`
        .wkl-ring {
          position: absolute; inset: 0;
          border-radius: 9999px;
          border: 4px solid var(--wk-blue);
          opacity: .16;
        }
        .wkl-ring::after {
          content: ""; position: absolute; inset: -4px;
          border-radius: 9999px;
          border: 4px solid transparent;
          border-top-color: var(--wk-blue);
          border-inline-end-color: var(--wk-blue-400);
          animation: wklSpin 1s linear infinite;
        }
        @keyframes wklSpin { to { transform: rotate(360deg); } }

        .wkl-pulse {
          position: absolute; inset: 0;
          border-radius: 9999px;
          border: 2px solid var(--wk-blue-200);
          animation: wklPulse 1.8s cubic-bezier(.2,.6,.3,1) infinite;
        }
        .wkl-pulse-2 { animation-delay: .9s; }
        @keyframes wklPulse {
          0%   { transform: scale(.7); opacity: .55; }
          70%  { transform: scale(1.45); opacity: 0; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        .wkl-dots i {
          display: inline-block; width: 4px; height: 4px; border-radius: 9999px;
          background: var(--wk-blue);
          animation: wklBlink 1.2s ease-in-out infinite;
        }
        .wkl-dots i:nth-child(2) { animation-delay: .2s; }
        .wkl-dots i:nth-child(3) { animation-delay: .4s; }
        @keyframes wklBlink { 0%,100% { opacity: .25; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }

        @media (prefers-reduced-motion: reduce) {
          .wkl-ring::after, .wkl-pulse, .wkl-dots i { animation: none !important; }
          .wkl-pulse { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
