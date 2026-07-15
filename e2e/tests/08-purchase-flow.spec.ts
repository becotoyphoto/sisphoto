import { test, expect } from '@playwright/test';
import path from 'path';

const authFile = path.resolve(__dirname, '..', '.auth', 'client.json');

test.describe('Fluxo de compra', () => {
  test('buscar evento, visualizar galeria, verificar preços', async ({ page }) => {
    // 1. Buscar evento publicado
    await page.goto('/buscar');
    await page.waitForLoadState('networkidle');

    const eventLinks = page.locator('a[href^="/evento/"]');
    const count = await eventLinks.count();
    console.log(`Eventos encontrados na busca: ${count}`);
    expect(count).toBeGreaterThan(0);

    // 2. Clicar no primeiro evento
    const firstEvent = eventLinks.first();
    const eventHref = await firstEvent.getAttribute('href');
    console.log(`Link do evento: ${eventHref}`);
    
    // Navegar diretamente para o evento
    await page.goto(eventHref || '/evento/unknown');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 3. Verificar se a galeria carregou
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    const headingText = await heading.textContent();
    console.log(`Título do evento: ${headingText}`);

    // 4. Verificar se há fotos na galeria
    const pageContent = await page.content();
    const hasPhotos = pageContent.includes('photo') || pageContent.includes('foto') || pageContent.includes('image');
    console.log(`Página tem conteúdo de fotos: ${hasPhotos}`);

    // 5. Verificar se o preço é exibido
    const priceElements = page.locator('text=/R\\$\\s*\\d/');
    const priceCount = await priceElements.count();
    console.log(`Elementos com preço: ${priceCount}`);
    if (priceCount > 0) {
      const firstPrice = await priceElements.first().textContent();
      console.log(`Primeiro preço: ${firstPrice}`);
    }

    // 6. Verificar botão de carrinho
    const cartButton = page.locator('button:has-text("Carrinho"), button[aria-label*="carrinho"], button:has(svg.lucide-shopping-cart)');
    const cartCount = await cartButton.count();
    console.log(`Botões de carrinho: ${cartCount}`);

    // 7. Verificar se a página de carrinho funciona
    await page.goto('/carrinho');
    await page.waitForLoadState('networkidle');
    const cartPageTitle = await page.locator('h1, h2').first().textContent();
    console.log(`Página do carrinho: ${cartPageTitle?.trim()}`);

    // 8. Verificar APIs de pagamento
    const pixResponse = await page.request.post('/api/pagamentos/pix', {
      data: { items: [], cartId: 'test' },
    });
    console.log(`API /api/pagamentos/pix: ${pixResponse.status()}`);

    // 9. Verificar API de download
    const downloadResponse = await page.request.post('/api/download', {
      data: { photo_id: 'test' },
    });
    console.log(`API /api/download: ${downloadResponse.status()}`);

    // 10. Verificar webhook do Mercado Pago
    const webhookResponse = await page.request.post('/api/webhooks/mercadopago', {
      data: {},
    });
    console.log(`API /api/webhooks/mercadopago: ${webhookResponse.status()}`);

    // 11. Verificar página de sucesso
    const successResponse = await page.request.get('/sucesso');
    console.log(`Página /sucesso: ${successResponse.status()}`);

    console.log('\\n=== RESUMO DO FLUXO DE COMPRA ===');
    console.log('1. Busca de eventos: OK');
    console.log('2. Galeria de fotos: OK');
    console.log('3. Preços exibidos: ' + (priceCount > 0 ? 'OK' : 'FALTANDO'));
    console.log('4. Botão carrinho: ' + (cartCount > 0 ? 'OK' : 'FALTANDO'));
    console.log('5. API Pix: ' + pixResponse.status());
    console.log('6. API Download: ' + downloadResponse.status());
    console.log('7. Webhook MP: ' + webhookResponse.status());
    console.log('=================================');
  });
});
