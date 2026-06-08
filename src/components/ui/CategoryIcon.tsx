'use client';

import { Icon as Iconify } from '@iconify/react';
import '@/lib/icons/fluent';
import { DEFAULT_CATEGORY_ICON } from '@/lib/constants/category-icons';

/** Resolve a stored `glyph` to an Iconify id, or null if it's a legacy emoji char. */
export function resolveGlyph(glyph?: string | null): string | null {
  if (!glyph) return DEFAULT_CATEGORY_ICON;
  if (glyph.includes(':')) return glyph;                 // already an iconify id
  if (/^[a-z][a-z0-9-]*$/.test(glyph)) return `fluent-emoji:${glyph}`; // bare fluent name
  return null;                                            // legacy emoji char → render as text
}

interface CategoryIconProps {
  glyph?: string | null;
  size?: number;
  className?: string;
}

/**
 * Renders a category's 3D Fluent Emoji icon from its stored `glyph` (an Iconify
 * id like `fluent-emoji:automobile`). Falls back to rendering a legacy emoji
 * character as text, then to a default package icon.
 */
export function CategoryIcon({ glyph, size = 24, className }: CategoryIconProps) {
  const id = resolveGlyph(glyph);
  if (id) return <Iconify icon={id} width={size} height={size} className={className} />;
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {glyph || '📦'}
    </span>
  );
}
