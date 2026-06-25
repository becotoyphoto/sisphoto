# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-becotoy.spec.ts >> Controle de acesso — Cliente >> Cliente NÃO acessa /dashboard/fotografo (redireciona)
- Location: tests\audit-becotoy.spec.ts:229:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /dashboard\/cliente/
Received string:  "https://becotoy.com/dashboard/fotografo"
Timeout: 8000ms

Call log:
  - Expect "toHaveURL" with timeout 8000ms
    19 × unexpected value "https://becotoy.com/dashboard/fotografo"

```

```yaml
- navigation:
  - link:
    - /url: /
    - img: BecoToy
  - link "Início":
    - /url: /
  - link "Buscar fotos":
    - /url: /buscar
  - link "Categorias":
    - /url: /categorias
  - link "Sou fotógrafo":
    - /url: /fotografo
  - link "Carrinho":
    - /url: /carrinho
  - link "Cliente 1":
    - /url: /dashboard/cliente
  - button "Sair"
- main:
  - heading "Painel do Fotógrafo" [level=1]
  - paragraph: Gerencie seus eventos e acompanhe suas vendas
  - link "Criar Novo Evento":
    - /url: /dashboard/fotografo/eventos/novo
  - paragraph: Total Vendido
  - heading "R$ 0.00" [level=3]
  - paragraph: Ganhos
  - heading "R$ 0.00" [level=3]
  - paragraph: Fotos Vendidas
  - heading "0" [level=3]
  - paragraph: Eventos Ativos
  - heading "0" [level=3]
  - paragraph: Saldo disponível para saque
  - paragraph: R$ 0.00
  - link "Solicitar Saque":
    - /url: /dashboard/fotografo/saques
  - heading "Seus Eventos" [level=2]
- contentinfo:
  - link:
    - /url: /
    - img: BecoToy
  - paragraph: A BecoToy é uma plataforma de fotografia que conecta fotógrafos e clientes para venda de fotos online, com tecnologia de reconhecimento facial e suporte completo 24h.
  - paragraph: Avenida Dom Helder Camara, 6001, Engenho de Dentro, cep 20771035
  - heading "Nossos serviços" [level=3]
  - list:
    - listitem:
      - link "Buscar fotos":
        - /url: /buscar
    - listitem:
      - link "Vender fotos":
        - /url: /fotografo
    - listitem:
      - link "Baixar fotos":
        - /url: /dashboard/cliente
    - listitem:
      - link "Falar com suporte":
        - /url: /central-de-ajuda
  - heading "Empresa" [level=3]
  - list:
    - listitem:
      - link "Quem somos":
        - /url: /sobre
    - listitem:
      - link "Suporte":
        - /url: /central-de-ajuda
    - listitem:
      - link "Termos de uso":
        - /url: /termos-de-uso
    - listitem:
      - link "Política de privacidade":
        - /url: /politica-de-privacidade
  - heading "BECOTOY LTDA." [level=4]
  - paragraph: CNPJ em atualização cadastral.
  - heading "Contato" [level=4]
  - link "(21) 99785-3031":
    - /url: tel:+5521997853031
  - paragraph: contato@becotoy.com.br
  - heading "Redes Sociais" [level=4]
  - link "Instagram":
    - /url: https://www.instagram.com/becotoy/
  - link "Facebook":
    - /url: https://www.facebook.com/becotoy/
  - link "Tiktok":
    - /url: https://www.tiktok.com/@becotoy
  - paragraph: © 2026 BecoToy. Todos os direitos reservados.
- alert
```

# Test source

```ts
  134 | 
  135 |   test("Footer — CNPJ não é placeholder", async ({ page }) => {
  136 |     await page.goto(BASE);
  137 |     await expect(page.getByText("00.000.000/0001-00")).not.toBeVisible();
  138 |   });
  139 | 
  140 |   test("/fotografo — sem typo cirílico", async ({ page }) => {
  141 |     await page.goto(`${BASE}/fotografo`);
  142 |     const body = await page.locator("body").textContent();
  143 |     expect(body).not.toMatch(/фото/);
  144 |   });
  145 | });
  146 | 
  147 | // ═══════════════════════════════════════════════════════════════════════════
  148 | // 2. CONTROLE DE ACESSO — ADMIN
  149 | // ═══════════════════════════════════════════════════════════════════════════
  150 | test.describe("Controle de acesso — Admin", () => {
  151 |   for (const email of ADMINS) {
  152 |     test(`${email} — acessa /dashboard/admin`, async ({ page }) => {
  153 |       await login(page, email, SENHA);
  154 |       await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 10000 });
  155 |       await expect(page.getByRole("heading", { name: /painel administrativo/i })).toBeVisible({ timeout: 8000 });
  156 |       await logout(page);
  157 |     });
  158 |   }
  159 | 
  160 |   test("Admin NÃO acessa /dashboard/fotografo (redireciona)", async ({ page }) => {
  161 |     await login(page, ADMINS[0], SENHA);
  162 |     await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 10000 });
  163 |     await page.goto(`${BASE}/dashboard/fotografo`);
  164 |     await page.waitForLoadState("load");
  165 |     // RoleGuard redireciona admin para /dashboard/admin
  166 |     await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 8000 });
  167 |   });
  168 | 
  169 |   test("Admin NÃO acessa /dashboard/cliente (redireciona)", async ({ page }) => {
  170 |     await login(page, ADMINS[0], SENHA);
  171 |     await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 10000 });
  172 |     await page.goto(`${BASE}/dashboard/cliente`);
  173 |     await page.waitForLoadState("load");
  174 |     await expect(page).toHaveURL(/dashboard\/admin/, { timeout: 8000 });
  175 |   });
  176 | });
  177 | 
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
> 234 |     await expect(page).toHaveURL(/dashboard\/cliente/, { timeout: 8000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  278 |     expect(res.status()).toBe(403);
  279 |   });
  280 | });
  281 | 
```