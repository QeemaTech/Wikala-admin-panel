import { cn } from '@/lib/utils';

/** Shared store banner gradient (used by the card + detail header). */
export const STORE_BANNER_GRADIENT = 'linear-gradient(115deg,#226199 0%,#4d85bc 60%,#6da8d5 100%)';

/** Resolves the inline `background` for a store banner (image if present). */
export function storeBannerStyle(bannerUrl: string | null): { background: string } {
  return { background: bannerUrl ? `center/cover url(${bannerUrl})` : STORE_BANNER_GRADIENT };
}

interface StoreLogoProps {
  name: string;
  logoUrl: string | null;
  /** Tailwind size + position + font-size utilities (e.g. "h-14 w-14 text-[18px]"). */
  className?: string;
}

/** Store logo chip — image when available, else two-letter initials fallback. */
export function StoreLogo({ name, logoUrl, className }: StoreLogoProps) {
  return (
    <div
      className={cn(
        'grid place-items-center overflow-hidden rounded-[14px] border-[3px] border-white bg-white font-extrabold text-wk-blue shadow-md',
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
