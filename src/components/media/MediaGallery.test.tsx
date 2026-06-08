import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test/render';
import { MediaGallery, reorderMedia } from './MediaGallery';
import type { AdMediaDTO } from '@/features/ads/use-ads';

function media(id: string, order: number): AdMediaDTO {
  return {
    id,
    cloudinaryPublicId: `pub_${id}`,
    originalUrl: `https://example.com/${id}.jpg`,
    variants: { w1080: null, w720: null, thumb: `https://example.com/${id}-thumb.jpg` },
    mimeType: 'image/jpeg',
    width: 100,
    height: 100,
    order,
  };
}

describe('reorderMedia', () => {
  it('moves an item and renumbers order (primary = 0)', () => {
    const list = [media('a', 0), media('b', 1), media('c', 2)];
    const next = reorderMedia(list, 2, 0);
    expect(next.map((m) => m.id)).toEqual(['c', 'a', 'b']);
    expect(next.map((m) => m.order)).toEqual([0, 1, 2]);
  });

  it('is a no-op for out-of-range or identical indices', () => {
    const list = [media('a', 0), media('b', 1)];
    expect(reorderMedia(list, 1, 1)).toBe(list);
    expect(reorderMedia(list, 0, 5)).toBe(list);
  });
});

describe('MediaGallery', () => {
  it('removes an item after confirmation and emits the renumbered list', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <MediaGallery value={[media('a', 0), media('b', 1)]} onChange={onChange} editable contextId="ad1" />,
    );

    // Open the confirm overlay on the first item, then confirm.
    fireEvent.click(screen.getAllByLabelText('حذف')[0]);
    fireEvent.click(screen.getByText('حذف'));

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as AdMediaDTO[];
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('b');
    expect(next[0].order).toBe(0);
  });
});
