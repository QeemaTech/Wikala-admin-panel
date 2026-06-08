'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/icon-map';
import { cn } from '@/lib/utils';

interface ThumbnailProps {
  src?: string | null;
  alt?: string;
  /** Fallback icon shown when there is no image or it fails to load. */
  icon: IconName;
  iconSize?: number;
  /** Sizing + gradient background classes for the frame. */
  className?: string;
}

/**
 * Square/rect image cell that degrades to a centered icon over the frame's
 * gradient background when `src` is missing or fails to load — so a broken
 * URL never shows the browser's broken-image glyph.
 */
export function Thumbnail({ src, alt = '', icon, iconSize = 20, className }: ThumbnailProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  return (
    <div className={cn('grid shrink-0 place-items-center overflow-hidden', className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <Icon name={icon} size={iconSize} className="text-white" />
      )}
    </div>
  );
}
