import { test, expect, Page } from "@playwright/test";
import path from "path";
import { getTestEventWithPhotos } from "../support/testData";
import { supabaseAdmin } from "../support/supabaseAdmin";

test.use({ storageState: path.resolve(__dirname, "..", ".auth", "client.json") });

// Reaproveita o fluxo já validado em 02-client-purchase-flow.spec.ts para colocar
// uma foto no carrinho antes de cada teste de pagamento.
async function addFirstPhotoToCart(page: Page) {
  const { eventId } = getTestEventWithPhotos();
  await page.goto(`/evento/${eventId}`);

  // Espera as fotos carregarem
  const photos = page.getByAltText("Foto do evento");
  await expect(photos.first()).toBeVisible();

  // Usa o mesmo fluxo validado no spec 02: hover no card de foto e clicar
  // no botão "Adicionar ao carrinho" do grid (que tem stopPropagation).
  const photoImg = photos.first();
  const photoCard = photoImg.locator("xpath=..");
  const gridAddButton = photoCard.locator('button[title="Adicionar ao carrinho"]');

  // Captura a chamada de API do carrinho
  const addToCartResponse = page.waitForResponse(
    (res) => res.url().includes("/rest/v1/cart_items") && res.request().method() === "POST"
  );

  await photoCard.hover();
  await expect(gridAddButton).toBeVisible();
  await gridAddButton.click();

  await addToCartResponse;
  // O PostgREST retorna 201 com corpo vazio quando não há 'Prefer: return=representation'.
  // O registro existe no banco — não precisamos do body para os testes de pagamento.

  return { added: true };
}

test.describe("Pagamento via Pix", () => {
  test("gera QR code Pix e libera a foto após o pagamento ser confirmado", async ({ page, request }) => {
    await addFirstPhotoToCart(page);
    await page.goto("/carrinho");

    // AJUSTE: texto real do botão que inicia o pagamento.
    const pixResponse = page.waitForResponse(
      (res) => res.url().includes("/api/pagamentos/pix") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /pagar com pix/i }).click();
    const response = await pixResponse;
    expect(response.status(), "criação do pagamento Pix deve retornar 200").toBe(200);

    // AJUSTE: confirme os nomes de campo reais devolvidos pela sua rota.
    const pixData = await response.json();
    expect(pixData, "resposta deve conter o id do pagamento").toHaveProperty("payment_id");
    expect(pixData, "resposta deve conter o código copia-e-cola").toHaveProperty("qr_code");

    // O QR code precisa aparecer pro cliente escanear.
    // AJUSTE: seletor real do componente de QR code / texto copia-e-cola.
    await expect(page.getByTestId("pix-qr-code")).toBeVisible();
    await expect(page.getByText(/copia e cola/i)).toBeVisible();

    // Em vez de esperar o sandbox do Mercado Pago confirmar via webhook real
    // (lento e fora do nosso controle), simulamos a notificação diretamente
    // contra a mesma lógica que o webhook real aciona.
    const simulateResponse = await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "approved" },
    });
    expect(simulateResponse.ok(), "simulação de webhook deve ser aceita (200)").toBeTruthy();

    // Confirma a fonte da verdade: o pedido foi marcado como pago no banco,
    // não só que a chamada retornou 200.
    const { data: pedido, error } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("mercadopago_id", String(pixData.payment_id))
      .single();
    expect(error, "pedido deve existir no banco").toBeNull();
    expect(pedido?.status).toBe("paid");

    // Só então confirma na UI que o download em alta resolução foi liberado.
    await page.reload();
    // AJUSTE: seletor/texto real do link/botão de download pós-pagamento.
    await expect(page.getByRole("link", { name: /baixar foto/i })).toBeVisible({ timeout: 10000 });
  });

  test("não duplica a liberação ao receber a mesma notificação de pagamento duas vezes", async ({
    page,
    request,
  }) => {
    // O Mercado Pago reenvia notificações de verdade (não é cenário hipotético),
    // então o backend precisa lidar com isso sem liberar/cobrar duas vezes.
    await addFirstPhotoToCart(page);
    await page.goto("/carrinho");

    const pixResponse = page.waitForResponse(
      (res) => res.url().includes("/api/pagamentos/pix") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /pagar com pix/i }).click();
    const response = await pixResponse;
    const pixData = await response.json();

    await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "approved" },
    });
    const second = await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "approved" },
    });
    expect(second.ok(), "segunda notificação não deve causar erro").toBeTruthy();

    const { data: pedidos, error } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("mercadopago_id", String(pixData.payment_id));
    expect(error).toBeNull();
    expect(pedidos?.length, "não deve haver pedidos duplicados para o mesmo pagamento").toBe(1);
  });

  test("não libera a foto se o pagamento for rejeitado", async ({ page, request }) => {
    await addFirstPhotoToCart(page);
    await page.goto("/carrinho");

    const pixResponse = page.waitForResponse(
      (res) => res.url().includes("/api/pagamentos/pix") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /pagar com pix/i }).click();
    const response = await pixResponse;
    const pixData = await response.json();

    await request.post("/api/test/simular-webhook-pagamento", {
      data: { paymentId: pixData.payment_id, status: "rejected" },
    });

    await page.reload();
    await expect(page.getByRole("link", { name: /baixar foto/i })).not.toBeVisible();
    // AJUSTE: texto real exibido para pagamento recusado/não aprovado.
    await expect(page.getByText(/pagamento (recusado|não aprovado)/i)).toBeVisible();
  });
});
