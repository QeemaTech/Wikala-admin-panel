import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders the sidebar navigation, topbar and page content', () => {
    renderWithProviders(
      <AppShell>
        <p>محتوى الصفحة</p>
      </AppShell>,
    );

    // sidebar nav groups
    for (const group of ['الرئيسية', 'الإشراف', 'الأشخاص', 'المحتوى', 'النمو', 'النظام']) {
      expect(screen.getByText(group)).toBeInTheDocument();
    }

    // topbar global search
    expect(screen.getByPlaceholderText('بحث عن مستخدم، إعلان، بلاغ...')).toBeInTheDocument();

    // page content slot
    expect(screen.getByText('محتوى الصفحة')).toBeInTheDocument();
  });

  it('marks the dashboard nav item active on the root route', () => {
    renderWithProviders(
      <AppShell>
        <p>محتوى</p>
      </AppShell>,
    );

    const dashboardLink = screen.getByRole('link', { name: 'لوحة التحكم' });
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });
});
