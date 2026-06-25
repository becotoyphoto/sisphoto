import { test, expect, Page } from "@playwright/test";

const BASE = "https://becotoy.com";
const SENHA = "moraes00";

// ─── Contas ────────────────────────────────────────────────────────────────
const ADMINS = [
  "becotoy@gmail.com",
  "admin2@fotoevento.com",
  "admin3@fotoevento.com",
];
const FOTOGRAFOS = [
  "fotografo1@fotoevento.com",
  "fotografo2@fotoevento.com",
  "fotografo3@fotoevento.com",
];
const CLIENTES = [
  "cliente1@fotoevento.com",
  "cliente2@fotoevento.com",
  "cliente3@fotoevento.com",
];

// ─── Helper: login ──────────────────────────────────────────────────────────
async function login(page: Page, email: string, senha: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("load");
  // Espera o formulário hidratar
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 8000 });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').fill(senha);
  await page.locator('button[type="submit"]').click();
}

// ─── Helper: logout ─────────────────────────────────────────────────────────
async function logout(page: Page) {
  try {
    await page.getByRole("button", { name: /sair/i }).click({ timeout: 3000 });
    await page.waitForLoadState("load");
  } catch {
    await page.goto(`${BASE}/login`);
  }
}

// ─── Helper: espera conteúdo aparecer ───────────────────────────────────────
async function waitForContent(page: Page, timeout = 8000) {
  await expect
    .poll(
      async () => {
        const text = await page
          .locator("main")
          .first()
          .textContent()
          .catch(() => "");
        return text?.trim().length ?? 0;
      },
      { timeout, intervals: [200, 500, 1000] }
    )
    .toBeGreaterThan(20);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PÁGINAS PÚBLICAS
// ═══════════════════════════════════════════════════════════════════════════
test.describe("Páginas públicas", () => {
  const paginas = [
    { path: "/", desc: "Home", mustHave: [/encontre suas fotos/i, /categorias/i] },
    { path: "/buscar", desc: "Buscar", mustHave: [/buscar/i] },
    { path: "/categorias", desc: "Categorias", mustHave: [/categor/i] },
    { path: "/fotografo", desc: "Para fotógrafos", mustHave: [/fotógraf/i] },
    { path: "/fotografo/cadastro", desc: "Cadastro fotógrafo", mustHave: [/cadastr/i] },
    { path: "/cadastrar", desc: "Cadastro cliente", mustHave: [/cadastr/i, /conta/i] },
    { path: "/login", desc: "Login", mustHave: [/e-?mail/i, /senha/i] },
    { path: "/sobre", desc: "Sobre", mustHave: [/miss/i] },
    { path: "/termos-de-uso", desc: "Termos de uso", mustHave: [/termos/i] },
    { path: "/politica-de-privacidade", desc: "Política de privacidade", mustHave: [/privacidade/i] },
    { path: "/central-de-ajuda", desc: "Central de ajuda", mustHave: [/ajuda|como funciona/i] },
    { path: "/contratar-fotografo", desc: "Contratar fotógrafo", mustHave: [/fotógraf|contratar/i] },
  ];

  for (const p of paginas) {
    test(`${p.path} — "${p.desc}" carrega sem erro`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`JS ERROR: ${e.message}`));
      page.on("response", (r) => {
        if (r.status() >= 400) {
          const url = r.url();
          if (url.includes(BASE) && !url.includes(`_rsc=`)) {
            errors.push(`HTTP ${r.status()}: ${url}`);
          }
        }
      });

      await page.goto(`${BASE}${p.path}`);
      await page.waitForLoadState("load");

      // Espera hidratação com polling em vez de timeout fixo
      await waitForContent(page);

      // Conteúdo esperado
      for (const pattern of p.mustHave) {
        await expect(page.getByText(pattern).first()).toBeVisible({
          timeout: 8000,
        });
      }

      // Sem erros JS críticos
      const criticalErrors = errors.filter(
        (e) => !e.includes("Minified React error") && !e.includes("@vite/client")
      );
      expect(
        criticalErrors,
        `Erros em ${p.path}: ${criticalErrors.join(", ")}`
      ).toHaveLength(0);
    });
  }

  test("/buscar — campo de busca funcional", async ({ page }) => {
    await page.goto(`${BASE}/buscar`);
    await page.waitForLoadState("load");
    const input = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="evento" i]').first();
    await expect(input).toBeVisible({ timeout: 8000 });
    await input.fill("corrida");
    await page.keyboard.press("Enter");
    await page.waitForLoadState("load");
    await waitForContent(page);
  });

  test("Header — carrinho visível", async ({ page }) => {
    await page.goto(BASE);
    const linkCarrinho = page.locator('a[href="/carrinho"]');
    await expect(linkCarrinho.first()).toBeVisible();
  });

  test("Footer — CNPJ não é placeholder", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByText("00.000.000/0001-00")).not.toBeVisible();
  });

  test("/fotografo — sem typo cirílico", async ({ page }) => {
    await page.goto(`${BASE}/fotografo`);
    const body = await page.locator("body").textContent();
    expect(body).not.toMatch(/фото/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. CONTROLE DE ACESSO — ADMIN
// ═══════════════════════════════════════════════════════════════════════════
test.describe("Controle de acesso — Admin", () => {
  for (const email of ADMINS) {
    test(`${email} — acessa /dashboard/admin`, async ({ page }) => {
      await login(page, email, SENHA);
      await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: /painel administrativo/i })).toBeVisible({ timeout: 8000 });
      await logout(page);
    });
  }

  test("Admin NÃO acessa /dashboard/fotografo (redireciona)", async ({ page }) => {
    await login(page, ADMINS[0], SENHA);
    await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 10000 });
    await page.goto(`${BASE}/dashboard/fotografo`);
    await page.waitForLoadState("load");
    // RoleGuard redireciona admin para /dashboard/admin
    await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 8000 });
  });

  test("Admin NÃO acessa /dashboard/cliente (redireciona)", async ({ page }) => {
    await login(page, ADMINS[0], SENHA);
    await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 10000 });
    await page.goto(`${BASE}/dashboard/cliente`);
    await page.waitForLoadState("load");
    await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 8000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. CONTROLE DE ACESSO — FOTÓGRAFO
// ═══════════════════════════════════════════════════════════════════════════
test.describe("Controle de acesso — Fotógrafo", () => {
  for (const email of FOTOGRAFOS) {
    test(`${email} — acessa /dashboard/fotografo`, async ({ page }) => {
      await login(page, email, SENHA);
      await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: /painel do fotógrafo/i })).toBeVisible({ timeout: 8000 });
      await logout(page);
    });
  }

  test("Fotógrafo NÃO acessa /dashboard/admin (redireciona)", async ({ page }) => {
    await login(page, FOTOGRAFOS[0], SENHA);
    await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 10000 });
    await page.goto(`${BASE}/dashboard/admin`);
    await page.waitForLoadState("load");
    await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 8000 });
  });

  test("Fotógrafo NÃO acessa /dashboard/cliente (redireciona)", async ({ page }) => {
    await login(page, FOTOGRAFOS[0], SENHA);
    await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 10000 });
    await page.goto(`${BASE}/dashboard/cliente`);
    await page.waitForLoadState("load");
    await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 8000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CONTROLE DE ACESSO — CLIENTE
// ═══════════════════════════════════════════════════════════════════════════
test.describe("Controle de acesso — Cliente", () => {
  for (const email of CLIENTES) {
    test(`${email} — acessa /dashboard/cliente`, async ({ page }) => {
      await login(page, email, SENHA);
      await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: /minha conta/i })).toBeVisible({ timeout: 8000 });
      await logout(page);
    });
  }

  test("Cliente NÃO acessa /dashboard/admin (redireciona)", async ({ page }) => {
    await login(page, CLIENTES[0], SENHA);
    await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 10000 });
    await page.goto(`${BASE}/dashboard/admin`);
    await page.waitForLoadState("load");
    await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 8000 });
  });

  test("Cliente NÃO acessa /dashboard/fotografo (redireciona)", async ({ page }) => {
    await login(page, CLIENTES[0], SENHA);
    await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 10000 });
    await page.goto(`${BASE}/dashboard/fotografo`);
    await page.waitForLoadState("load");
    await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 8000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. SEO / META TAGS
// ═══════════════════════════════════════════════════════════════════════════
test.describe("SEO", () => {
  const paginasSeo = ["/", "/buscar", "/fotografo", "/sobre", "/login"];

  test("Títulos únicos por página", async ({ page }) => {
    const titulos: Record<string, string> = {};
    for (const p of paginasSeo) {
      await page.goto(`${BASE}${p}`);
      const titulo = await page.title();
      if (titulos[titulo]) {
        expect.soft(false, `Duplicado "${titulo}" em ${p} e ${titulos[titulo]}`).toBeTruthy();
      }
      titulos[titulo] = p;
    }
  });

  test("Meta descriptions únicas", async ({ page }) => {
    const descs: Record<string, string> = {};
    for (const p of paginasSeo) {
      await page.goto(`${BASE}${p}`);
      const desc = await page
        .locator('meta[name="description"]')
        .getAttribute("content")
        .catch(() => "");
      if (desc && descs[desc]) {
        expect.soft(false, `Duplicada em ${p} e ${descs[desc]}`).toBeTruthy();
      }
      if (desc) descs[desc] = p;
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. ROTA DEV BLOQUEADA EM PRODUÇÃO
// ═══════════════════════════════════════════════════════════════════════════
test.describe("Segurança", () => {
  test("/api/dev/seed-users retorna 403 em produção", async ({ request }) => {
    const res = await request.post(`${BASE}/api/dev/seed-users`);
    expect(res.status()).toBe(403);
  });
});
