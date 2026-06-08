import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from './Icon';
import { ICON_PATHS } from './icon-map';

describe('Icon', () => {
  it('renders an svg with a 24x24 viewBox', () => {
    const { container } = render(<Icon name="grid" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('applies the requested size', () => {
    const { container } = render(<Icon name="bell" size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('exposes a title as an accessible label when provided', () => {
    const { container } = render(<Icon name="search" title="بحث" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('بحث');
  });

  it('resolves a glyph for every icon name in the prototype set', () => {
    for (const name of Object.keys(ICON_PATHS)) {
      expect(ICON_PATHS[name as keyof typeof ICON_PATHS].length).toBeGreaterThan(0);
    }
  });
});
