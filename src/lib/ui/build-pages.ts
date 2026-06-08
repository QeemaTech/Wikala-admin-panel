/**
 * Builds a compact pagination range with ellipses, e.g. [1, '...', 4, 5, 6, '...', 20].
 * Always shows first/last and a window around the current page.
 */
export function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const show = new Set<number>([1, total]);
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) show.add(p);
  const sorted = [...show].sort((a, b) => a - b);
  const result: (number | '...')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) result.push('...');
  }
  return result;
}
