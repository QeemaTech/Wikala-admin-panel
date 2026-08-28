import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShippingZonesPanel } from './ShippingZonesPanel';
import type { SystemSettingsDTO } from '@/features/settings/use-system-settings';

const settings = (commerce: Partial<SystemSettingsDTO['commerce']> = {}) =>
  ({
    commerce: {
      deliveryFeeMinor: 2000,
      freeShippingOverMinor: null,
      codEnabled: true,
      deliveryZones: [],
      ...commerce,
    },
  } as SystemSettingsDTO);

const cairo = {
  governorate: 'CAIRO',
  label: 'القاهرة',
  feeMinor: 1500,
  freeOverMinor: 50000,
  enabled: true,
};

describe('ShippingZonesPanel', () => {
  it('shows the default fee in pounds, not the minor units the API stores', () => {
    render(<ShippingZonesPanel settings={settings()} onChange={() => {}} />);
    // 2000 minor = 20 EGP. Showing "2000" would read as a 2,000-pound delivery.
    expect(screen.getByLabelText('سعر التوصيل الافتراضي')).toHaveValue(20);
  });

  it('converts an entered fee back to minor units', () => {
    const onChange = vi.fn();
    render(<ShippingZonesPanel settings={settings()} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('سعر التوصيل الافتراضي'), { target: { value: '35' } });
    expect(onChange.mock.calls[0][0].commerce.deliveryFeeMinor).toBe(3500);
  });

  it('says plainly when no zones are configured', () => {
    render(<ShippingZonesPanel settings={settings()} onChange={() => {}} />);
    expect(screen.getByText(/كل المحافظات تُشحن حاليًا بالسعر الافتراضي/)).toBeInTheDocument();
  });

  it('renders a configured zone with its own rate', () => {
    render(<ShippingZonesPanel settings={settings({ deliveryZones: [cairo] })} onChange={() => {}} />);
    expect(screen.getByLabelText('سعر التوصيل إلى القاهرة')).toHaveValue(15);
    expect(screen.getByLabelText('شحن مجاني إلى القاهرة فوق')).toHaveValue(500);
  });

  it('adding a governorate seeds it from the default rather than zero', () => {
    const onChange = vi.fn();
    render(<ShippingZonesPanel settings={settings()} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('أضف محافظة'), { target: { value: 'GIZA' } });

    const zones = onChange.mock.calls[0][0].commerce.deliveryZones;
    expect(zones).toHaveLength(1);
    // A new row defaulting to 0 would publish free delivery to that
    // governorate the moment someone saved.
    expect(zones[0]).toMatchObject({ governorate: 'GIZA', feeMinor: 2000, enabled: true });
  });

  it('a governorate that already has a rate cannot be added twice', () => {
    render(<ShippingZonesPanel settings={settings({ deliveryZones: [cairo] })} onChange={() => {}} />);
    const select = screen.getByLabelText('أضف محافظة') as HTMLSelectElement;
    const options = [...select.options].map((o) => o.value);
    // The backend 422s on duplicates; the picker should not offer one.
    expect(options).not.toContain('CAIRO');
    expect(options).toContain('GIZA');
  });

  it('removing a zone drops it so the governorate reverts to the default', () => {
    const onChange = vi.fn();
    render(<ShippingZonesPanel settings={settings({ deliveryZones: [cairo] })} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('احذف القاهرة'));
    expect(onChange.mock.calls[0][0].commerce.deliveryZones).toEqual([]);
  });

  it('an empty free-shipping box means no free shipping, not free at zero', () => {
    const onChange = vi.fn();
    render(<ShippingZonesPanel settings={settings({ freeShippingOverMinor: 50000 })} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('شحن مجاني فوق'), { target: { value: '' } });
    // 0 would mean "free over 0", i.e. always free — the opposite intent.
    expect(onChange.mock.calls[0][0].commerce.freeShippingOverMinor).toBeNull();
  });

  it('warns that an unserved governorate blocks checkout entirely', () => {
    render(
      <ShippingZonesPanel
        settings={settings({ deliveryZones: [{ ...cairo, enabled: false }] })}
        onChange={() => {}}
      />
    );
    expect(screen.getByText(/لن يستطيع العملاء هناك إتمام الطلب/)).toBeInTheDocument();
  });

  it('toggling COD off is sent as a boolean the API accepts', () => {
    const onChange = vi.fn();
    render(<ShippingZonesPanel settings={settings()} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('الدفع عند الاستلام'));
    expect(onChange.mock.calls[0][0].commerce.codEnabled).toBe(false);
  });
});
