import { test, expect } from '@playwright/test';

test('debug - check multiple routes', async ({ page }) => {
  const routes = [
    { path: '/', expect: 'Encontre' },
    { path: '/buscar', expect: 'buscar' },
    { path: '/evento/2eab7d56-d384-4ab8-984a-73df29ffd7aa', expect: 'Arena' },
    { path: '/login', expect: 'Entrar' },
    { path: '/carrinho', expect: 'carrinho' },
  ];

  for (const route of routes) {
    await page.goto(route.path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const h1 = await page.locator('h1, h2').first().textContent().catch(() => 'N/A');
    const hasExpected = h1?.toLowerCase().includes(route.expect.toLowerCase()) || false;
    console.log(`${route.path} → H1: "${h1}" | Expected "${route.expect}": ${hasExpected ? 'OK' : 'MISS'}`);
  }
});
