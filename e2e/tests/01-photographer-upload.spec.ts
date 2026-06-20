import { test, expect } from "@playwright/test";
import path from "path";
import { getTestEvent } from "../support/testData";

test.use({ storageState: path.resolve(__dirname, "..", ".auth", "photographer.json") });

test.describe("Fotógrafo — upload de fotos", () => {
  test("aplica marca d'água e envia fotos para o evento de teste", async ({ page }) => {
    const { eventId, eventName } = getTestEvent();

    await page.goto(`/dashboard/fotografo/eventos/${eventId}`);
    await expect(page.getByRole("heading", { name: "Upload de Fotos" })).toBeVisible();

    // Fixtures fixas no repo (e2e/fixtures/photos), em vez de um caminho
    // local do Windows que só existe numa máquina.
    const fixturesDir = path.resolve(__dirname, "..", "fixtures", "photos");
    const files = ["foto-1.jpg", "foto-2.jpg", "foto-3.jpg"].map((f) => path.join(fixturesDir, f));

    await page.setInputFiles('input[type="file"]', files);

    // AJUSTE: troque pelo texto/seletor real que indica quantas fotos
    // estão na fila no seu componente de upload.
    await expect(page.getByText("3 fotos selecionadas")).toBeVisible();

    await page.getByRole("button", { name: /aplicar marca d.água/i }).click();
    // AJUSTE: texto/indicador real de que o watermark terminou de processar.
    await expect(page.getByText(/marca d.água aplicada/i)).toBeVisible({ timeout: 20000 });

    await page.getByRole("button", { name: /enviar para o servidor/i }).click();
    
    // Valida que TODAS as 3 fotos foram enviadas com sucesso
    await expect(page.getByText(/3 foto\(s\) enviada\(s\) com sucesso/i)).toBeVisible({ timeout: 30000 });
  });
});
