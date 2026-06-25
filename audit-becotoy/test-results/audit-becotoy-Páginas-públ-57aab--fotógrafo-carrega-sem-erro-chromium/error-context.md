# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-becotoy.spec.ts >> Páginas públicas >> /contratar-fotografo — "Contratar fotógrafo" carrega sem erro
- Location: tests\audit-becotoy.spec.ts:82:9

# Error details

```
Error: Erros em /contratar-fotografo: HTTP 404: https://becotoy.com/contratar-fotografo

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 1
Received array:  ["HTTP 404: https://becotoy.com/contratar-fotografo"]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - navigation [ref=e2]:
    - generic [ref=e4]:
      - link [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e7]:
          - generic [ref=e16]: BecoToy
      - generic [ref=e18]:
        - link "Início" [ref=e19] [cursor=pointer]:
          - /url: /
        - link "Buscar fotos" [ref=e20] [cursor=pointer]:
          - /url: /buscar
        - link "Categorias" [ref=e21] [cursor=pointer]:
          - /url: /categorias
        - link "Sou fotógrafo" [ref=e22] [cursor=pointer]:
          - /url: /fotografo
      - generic [ref=e23]:
        - link "Carrinho" [ref=e24] [cursor=pointer]:
          - /url: /carrinho
          - img [ref=e25]
        - link "Criar conta" [ref=e29] [cursor=pointer]:
          - /url: /cadastrar
          - img [ref=e30]
          - text: Criar conta
        - link "Entrar" [ref=e33] [cursor=pointer]:
          - /url: /login
          - img [ref=e34]
          - text: Entrar
  - main [ref=e37]:
    - generic [ref=e39]:
      - heading "404" [level=1] [ref=e40]
      - heading "This page could not be found." [level=2] [ref=e42]
  - contentinfo [ref=e43]:
    - generic [ref=e44]:
      - generic [ref=e45]:
        - generic [ref=e46]:
          - link [ref=e48] [cursor=pointer]:
            - /url: /
            - img [ref=e49]:
              - generic [ref=e58]: BecoToy
          - paragraph [ref=e59]: A BecoToy é uma plataforma de fotografia que conecta fotógrafos e clientes para venda de fotos online, com tecnologia de reconhecimento facial e suporte completo 24h.
          - paragraph [ref=e61]:
            - img [ref=e62]
            - text: Avenida Dom Helder Camara, 6001, Engenho de Dentro, cep 20771035
        - generic [ref=e65]:
          - heading "Nossos serviços" [level=3] [ref=e66]
          - list [ref=e67]:
            - listitem [ref=e68]:
              - link "Buscar fotos" [ref=e69] [cursor=pointer]:
                - /url: /buscar
            - listitem [ref=e70]:
              - link "Vender fotos" [ref=e71] [cursor=pointer]:
                - /url: /fotografo
            - listitem [ref=e72]:
              - link "Baixar fotos" [ref=e73] [cursor=pointer]:
                - /url: /dashboard/cliente
            - listitem [ref=e74]:
              - link "Falar com suporte" [ref=e75] [cursor=pointer]:
                - /url: /central-de-ajuda
        - generic [ref=e76]:
          - heading "Empresa" [level=3] [ref=e77]
          - list [ref=e78]:
            - listitem [ref=e79]:
              - link "Quem somos" [ref=e80] [cursor=pointer]:
                - /url: /sobre
            - listitem [ref=e81]:
              - link "Suporte" [ref=e82] [cursor=pointer]:
                - /url: /central-de-ajuda
            - listitem [ref=e83]:
              - link "Termos de uso" [ref=e84] [cursor=pointer]:
                - /url: /termos-de-uso
            - listitem [ref=e85]:
              - link "Política de privacidade" [ref=e86] [cursor=pointer]:
                - /url: /politica-de-privacidade
      - generic [ref=e88]:
        - generic [ref=e89]:
          - heading "BECOTOY LTDA." [level=4] [ref=e90]
          - paragraph [ref=e91]: CNPJ em atualização cadastral.
        - generic [ref=e92]:
          - heading "Contato" [level=4] [ref=e93]
          - link "(21) 99785-3031" [ref=e94] [cursor=pointer]:
            - /url: tel:+5521997853031
            - img [ref=e95]
            - text: (21) 99785-3031
          - paragraph [ref=e97]:
            - img [ref=e98]
            - text: contato@becotoy.com.br
        - generic [ref=e101]:
          - heading "Redes Sociais" [level=4] [ref=e102]
          - generic [ref=e103]:
            - link "Instagram" [ref=e104] [cursor=pointer]:
              - /url: https://www.instagram.com/becotoy/
            - link "Facebook" [ref=e105] [cursor=pointer]:
              - /url: https://www.facebook.com/becotoy/
            - link "Tiktok" [ref=e106] [cursor=pointer]:
              - /url: https://www.tiktok.com/@becotoy
      - paragraph [ref=e108]: © 2026 BecoToy. Todos os direitos reservados.
  - alert [ref=e109]
```

# Test source

```ts
  14  |   "fotografo2@fotoevento.com",
  15  |   "fotografo3@fotoevento.com",
  16  | ];
  17  | const CLIENTES = [
  18  |   "cliente1@fotoevento.com",
  19  |   "cliente2@fotoevento.com",
  20  |   "cliente3@fotoevento.com",
  21  | ];
  22  | 
  23  | // ─── Helper: login ──────────────────────────────────────────────────────────
  24  | async function login(page: Page, email: string, senha: string) {
  25  |   await page.goto(`${BASE}/login`);
  26  |   await page.waitForLoadState("load");
  27  |   // Espera o formulário hidratar
  28  |   const emailInput = page.locator('input[type="email"]');
  29  |   await expect(emailInput).toBeVisible({ timeout: 8000 });
  30  |   await emailInput.fill(email);
  31  |   await page.locator('input[type="password"]').fill(senha);
  32  |   await page.locator('button[type="submit"]').click();
  33  | }
  34  | 
  35  | // ─── Helper: logout ─────────────────────────────────────────────────────────
  36  | async function logout(page: Page) {
  37  |   try {
  38  |     await page.getByRole("button", { name: /sair/i }).click({ timeout: 3000 });
  39  |     await page.waitForLoadState("load");
  40  |   } catch {
  41  |     await page.goto(`${BASE}/login`);
  42  |   }
  43  | }
  44  | 
  45  | // ─── Helper: espera conteúdo aparecer ───────────────────────────────────────
  46  | async function waitForContent(page: Page, timeout = 8000) {
  47  |   await expect
  48  |     .poll(
  49  |       async () => {
  50  |         const text = await page
  51  |           .locator("main")
  52  |           .first()
  53  |           .textContent()
  54  |           .catch(() => "");
  55  |         return text?.trim().length ?? 0;
  56  |       },
  57  |       { timeout, intervals: [200, 500, 1000] }
  58  |     )
  59  |     .toBeGreaterThan(20);
  60  | }
  61  | 
  62  | // ═══════════════════════════════════════════════════════════════════════════
  63  | // 1. PÁGINAS PÚBLICAS
  64  | // ═══════════════════════════════════════════════════════════════════════════
  65  | test.describe("Páginas públicas", () => {
  66  |   const paginas = [
  67  |     { path: "/", desc: "Home", mustHave: [/encontre suas fotos/i, /categorias/i] },
  68  |     { path: "/buscar", desc: "Buscar", mustHave: [/buscar/i] },
  69  |     { path: "/categorias", desc: "Categorias", mustHave: [/categor/i] },
  70  |     { path: "/fotografo", desc: "Para fotógrafos", mustHave: [/fotógraf/i] },
  71  |     { path: "/fotografo/cadastro", desc: "Cadastro fotógrafo", mustHave: [/cadastr/i] },
  72  |     { path: "/cadastrar", desc: "Cadastro cliente", mustHave: [/cadastr/i, /conta/i] },
  73  |     { path: "/login", desc: "Login", mustHave: [/e-?mail/i, /senha/i] },
  74  |     { path: "/sobre", desc: "Sobre", mustHave: [/miss/i] },
  75  |     { path: "/termos-de-uso", desc: "Termos de uso", mustHave: [/termos/i] },
  76  |     { path: "/politica-de-privacidade", desc: "Política de privacidade", mustHave: [/privacidade/i] },
  77  |     { path: "/central-de-ajuda", desc: "Central de ajuda", mustHave: [/ajuda|como funciona/i] },
  78  |     { path: "/contratar-fotografo", desc: "Contratar fotógrafo", mustHave: [/fotógraf|contratar/i] },
  79  |   ];
  80  | 
  81  |   for (const p of paginas) {
  82  |     test(`${p.path} — "${p.desc}" carrega sem erro`, async ({ page }) => {
  83  |       const errors: string[] = [];
  84  |       page.on("pageerror", (e) => errors.push(`JS ERROR: ${e.message}`));
  85  |       page.on("response", (r) => {
  86  |         if (r.status() >= 400) {
  87  |           const url = r.url();
  88  |           if (url.includes(BASE) && !url.includes(`_rsc=`)) {
  89  |             errors.push(`HTTP ${r.status()}: ${url}`);
  90  |           }
  91  |         }
  92  |       });
  93  | 
  94  |       await page.goto(`${BASE}${p.path}`);
  95  |       await page.waitForLoadState("load");
  96  | 
  97  |       // Espera hidratação com polling em vez de timeout fixo
  98  |       await waitForContent(page);
  99  | 
  100 |       // Conteúdo esperado
  101 |       for (const pattern of p.mustHave) {
  102 |         await expect(page.getByText(pattern).first()).toBeVisible({
  103 |           timeout: 8000,
  104 |         });
  105 |       }
  106 | 
  107 |       // Sem erros JS críticos
  108 |       const criticalErrors = errors.filter(
  109 |         (e) => !e.includes("Minified React error") && !e.includes("@vite/client")
  110 |       );
  111 |       expect(
  112 |         criticalErrors,
  113 |         `Erros em ${p.path}: ${criticalErrors.join(", ")}`
> 114 |       ).toHaveLength(0);
      |         ^ Error: Erros em /contratar-fotografo: HTTP 404: https://becotoy.com/contratar-fotografo
  115 |     });
  116 |   }
  117 | 
  118 |   test("/buscar — campo de busca funcional", async ({ page }) => {
  119 |     await page.goto(`${BASE}/buscar`);
  120 |     await page.waitForLoadState("load");
  121 |     const input = page.locator('input[type="search"], input[placeholder*="buscar" i], input[placeholder*="evento" i]').first();
  122 |     await expect(input).toBeVisible({ timeout: 8000 });
  123 |     await input.fill("corrida");
  124 |     await page.keyboard.press("Enter");
  125 |     await page.waitForLoadState("load");
  126 |     await waitForContent(page);
  127 |   });
  128 | 
  129 |   test("Header — carrinho visível", async ({ page }) => {
  130 |     await page.goto(BASE);
  131 |     const linkCarrinho = page.locator('a[href="/carrinho"]');
  132 |     await expect(linkCarrinho.first()).toBeVisible();
  133 |   });
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
```