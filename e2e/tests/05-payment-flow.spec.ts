import { test, expect, Page } from "@playwright/test";
import path from "path";
import { getTestEventWithPhotos } from "../support/testData";
import { supabaseAdmin } from "../support/supabaseAdmin";

test.use({ storageState: path.resolve(__dirname, "..", ".auth", "client.json") });

// Adiciona a primeira foto ao carrinho e retorna o cartId
// para uso nos testes de pagamento/simulação.
async function addFirstPhotoToCart(page: Page): Promise<{ cartId: string }> {
  const { eventId } = getTestEventWithPhotos();
  await page.goto(`/evento/${eventId}`);

  const photos = page.getByAltText("Foto do evento");
  await expect(photos.first()).toBeVisible();

  const photoImg = photos.first();
  const photoCard = photoImg.locator("xpath=..");

  // Captura a chamada de API do carrinho
  const addToCartResponse = page.waitForResponse(
    (res) => res.url().includes("/rest/v1/cart_items") && res.request().method() === "POST"
  );

  const gridAddButton = photoCard.locator('button[title="Adicionar ao carrinho"]');
  await photoCard.hover();
  await expect(gridAddButton).toBeVisible();
  await gridAddButton.click();

  const response = await addToCartResponse;
  // Extrai o cart_id do corpo da requisição
  const reqBody = response.request().postDataJSON();
  const cartId = reqBody?.cart_id as string | undefined;

  if (!cartId) {
    // Fallback: busca o cart ativo do cliente logado
    const { data: { user } } = await supabaseAdmin.auth.admin.listUsers();
    const client = user.find(u => u.email === process.env.TEST_CLIENT_EMAIL);
    if (client) {
      const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id')
        .eq('user_id', client.id)
        .eq('status', 'active')
        .maybeSingle();
      if (cart) return { cartId: cart.id };
    }
    throw new Error("Não foi possível obter o cartId após adicionar ao carrinho.");
  }

  return { cartId };
}

test.describe("Pagamento via Pix", () => {
  test("gera QR code Pix e libera a foto após o pagamento ser confirmado", async ({ page, request }) => {
    const { cartId } = await addFirstPhotoToCart(page);
    await page.goto("/carrinho");

    const pixResponse = page.waitForResponse(
      (res) => res.url().includes("/api/pagamentos/pix") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /pagar com pix/i }).click();
    const response = await pixResponse;
    expect(response.status(), "criação do pagamento Pix deve retornar 200").toBe(200);

    const pixData = await response.json();
    expect(pixData, "resposta deve conter o id do pagamento").toHaveProperty("payment_id");
    expect(pixData, "resposta deve conter o código copia-e-cola").toHaveProperty("qr_code");

    // O QR code precisa aparecer pro cliente escanear.
    await expect(page.getByTestId("pix-qr-code")).toBeVisible();
    await expect(page.getByText(/copia e cola/i)).toBeVisible();

    // Simula a notificação de pagamento aprovado (cartId é necessário
    // para o processarConfirmacaoPagamento saber o que faturar)
    const simulateResponse = await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "approved", cartId },
    });
    expect(simulateResponse.ok(), "simulação de webhook deve ser aceita (200)").toBeTruthy();

    // Confirma a fonte da verdade: o pedido foi marcado como pago no banco
    const { data: pedido, error } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("mercadopago_id", String(pixData.payment_id))
      .single();
    expect(error, "pedido deve existir no banco").toBeNull();
    expect(pedido?.status).toBe("paid");

    // Só então confirma na UI que o download em alta resolução foi liberado.
    // Escopamos ao card de resumo do carrinho para não conflitar com
    // o link global "Baixar fotos" do footer.
    const resumoCard = page.getByRole("heading", { name: "Resumo" }).locator("..");
    await page.reload();
    await expect(resumoCard.getByRole("link", { name: /baixar foto/i })).toBeVisible({ timeout: 10000 });
  });

  test("não duplica a liberação ao receber a mesma notificação de pagamento duas vezes", async ({
    page,
    request,
  }) => {
    const { cartId } = await addFirstPhotoToCart(page);
    await page.goto("/carrinho");

    const pixResponse = page.waitForResponse(
      (res) => res.url().includes("/api/pagamentos/pix") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /pagar com pix/i }).click();
    const response = await pixResponse;
    const pixData = await response.json();

    // Primeira notificação
    const first = await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "approved", cartId },
    });
    expect(first.ok(), "primeira notificação deve ser aceita").toBeTruthy();

    // Segunda notificação (mesmo paymentId – deve ser idempotente)
    const second = await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "approved", cartId },
    });
    // A rota de teste retorna { alreadyProcessed: true } com status 200
    expect(second.ok(), "segunda notificação não deve causar erro").toBeTruthy();
    const secondBody = await second.json();
    expect(secondBody.alreadyProcessed, "deve indicar que já foi processado").toBe(true);

    const { data: pedidos, error } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("mercadopago_id", String(pixData.payment_id));
    expect(error).toBeNull();
    expect(pedidos?.length, "não deve haver pedidos duplicados para o mesmo pagamento").toBe(1);
  });

  test("não libera a foto se o pagamento for rejeitado", async ({ page, request }) => {
    const { cartId } = await addFirstPhotoToCart(page);
    await page.goto("/carrinho");

    const pixResponse = page.waitForResponse(
      (res) => res.url().includes("/api/pagamentos/pix") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /pagar com pix/i }).click();
    const response = await pixResponse;
    const pixData = await response.json();

    // Simula pagamento rejeitado
    await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "rejected", cartId },
    });

    // Escopa ao card de resumo para não conflitar com link global do footer
    const resumoCard = page.getByRole("heading", { name: "Resumo" }).locator("..");
    await page.reload();
    await expect(resumoCard.getByRole("link", { name: /baixar foto/i })).not.toBeVisible();
    await expect(page.getByText(/pagamento (recusado|não aprovado)/i)).toBeVisible();
  });
});
