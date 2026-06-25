# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-becotoy.spec.ts >> Segurança >> /api/dev/seed-users retorna 403 em produção
- Location: tests\audit-becotoy.spec.ts:276:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 403
Received: 200
```

# Test source

```ts
  178 | // ═══════════════════════════════════════════════════════════════════════════
  179 | // 3. CONTROLE DE ACESSO — FOTÓGRAFO
  180 | // ═══════════════════════════════════════════════════════════════════════════
  181 | test.describe("Controle de acesso — Fotógrafo", () => {
  182 |   for (const email of FOTOGRAFOS) {
  183 |     test(`${email} — acessa /dashboard/fotografo`, async ({ page }) => {
  184 |       await login(page, email, SENHA);
  185 |       await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 10000 });
  186 |       await expect(page.getByRole("heading", { name: /painel do fotógrafo/i })).toBeVisible({ timeout: 8000 });
  187 |       await logout(page);
  188 |     });
  189 |   }
  190 | 
  191 |   test("Fotógrafo NÃO acessa /dashboard/admin (redireciona)", async ({ page }) => {
  192 |     await login(page, FOTOGRAFOS[0], SENHA);
  193 |     await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 10000 });
  194 |     await page.goto(`${BASE}/dashboard/admin`);
  195 |     await page.waitForLoadState("load");
  196 |     await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 8000 });
  197 |   });
  198 | 
  199 |   test("Fotógrafo NÃO acessa /dashboard/cliente (redireciona)", async ({ page }) => {
  200 |     await login(page, FOTOGRAFOS[0], SENHA);
  201 |     await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 10000 });
  202 |     await page.goto(`${BASE}/dashboard/cliente`);
  203 |     await page.waitForLoadState("load");
  204 |     await expect(page).toHaveURL(/dashboard\/fotografo/, { timeout: 8000 });
  205 |   });
  206 | });
  207 | 
  208 | // ═══════════════════════════════════════════════════════════════════════════
  209 | // 4. CONTROLE DE ACESSO — CLIENTE
  210 | // ═══════════════════════════════════════════════════════════════════════════
  211 | test.describe("Controle de acesso — Cliente", () => {
  212 |   for (const email of CLIENTES) {
  213 |     test(`${email} — acessa /dashboard/cliente`, async ({ page }) => {
  214 |       await login(page, email, SENHA);
  215 |       await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 10000 });
  216 |       await expect(page.getByRole("heading", { name: /minha conta/i })).toBeVisible({ timeout: 8000 });
  217 |       await logout(page);
  218 |     });
  219 |   }
  220 | 
  221 |   test("Cliente NÃO acessa /dashboard/admin (redireciona)", async ({ page }) => {
  222 |     await login(page, CLIENTES[0], SENHA);
  223 |     await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 10000 });
  224 |     await page.goto(`${BASE}/dashboard/admin`);
  225 |     await page.waitForLoadState("load");
  226 |     await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 8000 });
  227 |   });
  228 | 
  229 |   test("Cliente NÃO acessa /dashboard/fotografo (redireciona)", async ({ page }) => {
  230 |     await login(page, CLIENTES[0], SENHA);
  231 |     await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 10000 });
  232 |     await page.goto(`${BASE}/dashboard/fotografo`);
  233 |     await page.waitForLoadState("load");
  234 |     await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 8000 });
  235 |   });
  236 | });
  237 | 
  238 | // ═══════════════════════════════════════════════════════════════════════════
  239 | // 5. SEO / META TAGS
  240 | // ═══════════════════════════════════════════════════════════════════════════
  241 | test.describe("SEO", () => {
  242 |   const paginasSeo = ["/", "/buscar", "/fotografo", "/sobre", "/login"];
  243 | 
  244 |   test("Títulos únicos por página", async ({ page }) => {
  245 |     const titulos: Record<string, string> = {};
  246 |     for (const p of paginasSeo) {
  247 |       await page.goto(`${BASE}${p}`);
  248 |       const titulo = await page.title();
  249 |       if (titulos[titulo]) {
  250 |         expect.soft(false, `Duplicado "${titulo}" em ${p} e ${titulos[titulo]}`).toBeTruthy();
  251 |       }
  252 |       titulos[titulo] = p;
  253 |     }
  254 |   });
  255 | 
  256 |   test("Meta descriptions únicas", async ({ page }) => {
  257 |     const descs: Record<string, string> = {};
  258 |     for (const p of paginasSeo) {
  259 |       await page.goto(`${BASE}${p}`);
  260 |       const desc = await page
  261 |         .locator('meta[name="description"]')
  262 |         .getAttribute("content")
  263 |         .catch(() => "");
  264 |       if (desc && descs[desc]) {
  265 |         expect.soft(false, `Duplicada em ${p} e ${descs[desc]}`).toBeTruthy();
  266 |       }
  267 |       if (desc) descs[desc] = p;
  268 |     }
  269 |   });
  270 | });
  271 | 
  272 | // ═══════════════════════════════════════════════════════════════════════════
  273 | // 6. ROTA DEV BLOQUEADA EM PRODUÇÃO
  274 | // ═══════════════════════════════════════════════════════════════════════════
  275 | test.describe("Segurança", () => {
  276 |   test("/api/dev/seed-users retorna 403 em produção", async ({ request }) => {
  277 |     const res = await request.post(`${BASE}/api/dev/seed-users`);
> 278 |     expect(res.status()).toBe(403);
      |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  279 |   });
  280 | });
  281 | 
```