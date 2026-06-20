import { test, expect } from "@playwright/test";
import path from "path";
import { getTestEvent } from "../support/testData";
import { supabaseAdmin } from "../support/supabaseAdmin";

test.use({ storageState: path.resolve(__dirname, "..", ".auth", "client.json") });

test.describe("Cliente — visualizar e comprar fotos", () => {
  test("adiciona uma foto ao carrinho e confirma a persistência", async ({ page }) => {
    const { eventId } = getTestEvent();

    await page.goto(`/evento/${eventId}`);
    const photos = page.getByAltText("Foto do evento");
    await expect(photos.first()).toBeVisible();

    await photos.first().click({ force: true });
    // Espera o botão "Adicionar" do visualizador aparecer.
    const addButton = page.getByText("Adicionar", { exact: true });
    await expect(addButton).toBeVisible();

    // Isto é o que faltou no teste manual: em vez de procurar texto solto
    // tipo "1 item" no carrinho, capturamos a resposta real da API...
    const addToCartResponse = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/cart_items") && res.request().method() === "POST"
    );
    await addButton.click();
    const response = await addToCartResponse;
    expect(response.status(), "POST para cart_items deve retornar 201").toBe(201);

    const requestBody = response.request().postDataJSON();
    
    // ...e confirmamos a fonte da verdade: o registro existe no banco.
    const { data: cartItem, error } = await supabaseAdmin
      .from("cart_items")
      .select("id")
      .eq("photo_id", requestBody.photo_id)
      .limit(1)
      .single();
    expect(error, "item do carrinho deve existir no banco").toBeNull();
    expect(cartItem).not.toBeNull();

    await page.goto("/carrinho");
    await expect(page.getByRole("heading", { name: "Resumo" })).toBeVisible();
  });

  test("adiciona foto ao carrinho pelo grid sem abrir o visualizador", async ({ page }) => {
    const { eventId } = getTestEvent();

    await page.goto(`/evento/${eventId}`);
    
    // Espera as fotos carregarem
    await expect(page.getByAltText("Foto do evento").first()).toBeVisible();

    // Pega o SEGUNDO card de foto no grid
    const photoImg = page.getByAltText("Foto do evento").nth(1);
    await expect(photoImg).toBeVisible();

    const photoCard = photoImg.locator("xpath=..");
    const gridAddButton = photoCard.locator('button[title="Adicionar ao carrinho"]');
    
    // Captura a chamada de API do carrinho
    const addToCartResponse = page.waitForResponse(
      (res) => res.url().includes("/rest/v1/cart_items") && res.request().method() === "POST"
    );

    await photoCard.hover();
    await expect(gridAddButton).toBeVisible();
    await gridAddButton.click();

    const response = await addToCartResponse;
    expect(response.status(), "POST para cart_items deve retornar 201").toBe(201);

    // Verifica que o visualizador não abriu (não estamos na URL com ?midia_id=)
    expect(page.url()).not.toContain('midia_id=');
  });
});
