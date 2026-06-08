import { expect, test } from '@playwright/test';

test('admin shell renders on the dashboard route', async ({ page }) => {
  await page.goto('/');

  // RTL document
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

  // dashboard heading
  await expect(page.getByRole('heading', { name: 'لوحة التحكم', level: 1 })).toBeVisible();

  // sidebar navigation is present
  await expect(page.getByRole('link', { name: 'مراجعة الإعلانات' })).toBeVisible();

  // topbar global search is present
  await expect(page.getByPlaceholder('بحث عن مستخدم، إعلان، بلاغ...')).toBeVisible();
});
