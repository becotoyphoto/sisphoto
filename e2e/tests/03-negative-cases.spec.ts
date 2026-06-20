import { test, expect } from "@playwright/test";
import path from "path";
import { getTestEvent } from "../support/testData";

test.describe("Casos negativos", () => {
  test("login com senha errada mostra erro e não navega para o dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(process.env.TEST_CLIENT_EMAIL!);
    await page.locator('input[type="password"]').fill("senha-incorreta-123");
    await page.getByRole("button", { name: /entrar/i }).click();

    // AJUSTE: mensagem de erro real exibida pelo seu formulário de login.
    await expect(page.getByText(/e-mail ou senha incorretos/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test("acessar evento inexistente retorna mensagem apropriada (não quebra a página)", async ({ page }) => {
    await page.goto("/evento/00000000-0000-0000-0000-000000000000");
    // AJUSTE: texto/estado real de "não encontrado" no seu app.
    await expect(page.getByText(/evento não encontrado/i)).toBeVisible();
  });

  test("upload de arquivo que não é imagem é rejeitado", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "..", ".auth", "photographer.json"),
    });
    const page = await context.newPage();

    const { eventId } = getTestEvent();
    await page.goto(`/dashboard/fotografo/eventos/${eventId}`);

    await page.setInputFiles('input[type="file"]', {
      name: "arquivo.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("isto não é uma imagem"),
    });

    // Verifica se o aviso aparece e o arquivo txt é listado nele.
    await expect(page.getByText(/1 arquivo\(s\) ignorado\(s\)/i)).toBeVisible();
    await expect(page.getByText(/arquivo.txt/i)).toBeVisible();
    
    await context.close();
  });

  test("fotógrafo não consegue acessar evento de outro fotógrafo", async ({ browser }) => {
    const { otherEventId } = getTestEvent();

    const context = await browser.newContext({
      storageState: path.resolve(__dirname, "..", ".auth", "photographer.json"),
    });
    const page = await context.newPage();

    await page.goto(`/dashboard/fotografo/eventos/${otherEventId}`);
    await expect(page.getByText(/acesso restrito/i)).toBeVisible();

    await context.close();
  });
});
