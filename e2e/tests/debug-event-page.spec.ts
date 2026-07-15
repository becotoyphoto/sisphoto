import { test, expect } from '@playwright/test';

test('debug - event page render', async ({ page }) => {
  await page.goto('/evento/2eab7d56-d384-4ab8-984a-73df29ffd7aa');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('Title:', title);

  const h1 = await page.locator('h1').first().textContent().catch(() => 'N/A');
  console.log('H1:', h1);

  const bodyText = await page.locator('body').innerText();
  console.log('Body (first 1000):', bodyText.substring(0, 1000));

  // Check for error messages
  const errorText = await page.locator('text=/erro|error|não encontrada/i').count();
  console.log('Error messages:', errorText);

  // Check for photos
  const images = await page.locator('img').count();
  console.log('Images:', images);

  expect(true).toBe(true);
});
