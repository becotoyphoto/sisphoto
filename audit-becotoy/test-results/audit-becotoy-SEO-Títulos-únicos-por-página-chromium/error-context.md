# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: audit-becotoy.spec.ts >> SEO >> Títulos únicos por página
- Location: tests\audit-becotoy.spec.ts:244:7

# Error details

```
Error: Duplicado "BecoToy | Suas memórias em alta resolução" em /sobre e /

expect(received).toBeTruthy()

Received: false
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
      - generic [ref=e40]:
        - img [ref=e42]
        - heading "Bem-vindo de volta" [level=1] [ref=e45]
        - paragraph [ref=e46]: Entre para acessar suas fotos e pedidos
      - generic [ref=e47]:
        - generic [ref=e48]:
          - generic [ref=e49]: E-mail
          - generic [ref=e50]:
            - img [ref=e51]
            - textbox "exemplo@email.com" [ref=e54]
        - generic [ref=e55]:
          - generic [ref=e56]: Senha
          - generic [ref=e57]:
            - img [ref=e58]
            - textbox "••••••••" [ref=e61]
        - button "Entrar" [ref=e62]:
          - text: Entrar
          - img [ref=e63]
      - link "Criar conta" [ref=e66] [cursor=pointer]:
        - /url: /cadastrar
        - img [ref=e67]
        - text: Criar conta
      - paragraph [ref=e70]:
        - text: Não tem uma conta?
        - button "Cadastre-se" [ref=e71]
  - contentinfo [ref=e72]:
    - generic [ref=e73]:
      - generic [ref=e74]:
        - generic [ref=e75]:
          - link [ref=e77] [cursor=pointer]:
            - /url: /
            - img [ref=e78]:
              - generic [ref=e87]: BecoToy
          - paragraph [ref=e88]: A BecoToy é uma plataforma de fotografia que conecta fotógrafos e clientes para venda de fotos online, com tecnologia de reconhecimento facial e suporte completo 24h.
          - paragraph [ref=e90]:
            - img [ref=e91]
            - text: Avenida Dom Helder Camara, 6001, Engenho de Dentro, cep 20771035
        - generic [ref=e94]:
          - heading "Nossos serviços" [level=3] [ref=e95]
          - list [ref=e96]:
            - listitem [ref=e97]:
              - link "Buscar fotos" [ref=e98] [cursor=pointer]:
                - /url: /buscar
            - listitem [ref=e99]:
              - link "Vender fotos" [ref=e100] [cursor=pointer]:
                - /url: /fotografo
            - listitem [ref=e101]:
              - link "Baixar fotos" [ref=e102] [cursor=pointer]:
                - /url: /dashboard/cliente
            - listitem [ref=e103]:
              - link "Falar com suporte" [ref=e104] [cursor=pointer]:
                - /url: /central-de-ajuda
        - generic [ref=e105]:
          - heading "Empresa" [level=3] [ref=e106]
          - list [ref=e107]:
            - listitem [ref=e108]:
              - link "Quem somos" [ref=e109] [cursor=pointer]:
                - /url: /sobre
            - listitem [ref=e110]:
              - link "Suporte" [ref=e111] [cursor=pointer]:
                - /url: /central-de-ajuda
            - listitem [ref=e112]:
              - link "Termos de uso" [ref=e113] [cursor=pointer]:
                - /url: /termos-de-uso
            - listitem [ref=e114]:
              - link "Política de privacidade" [ref=e115] [cursor=pointer]:
                - /url: /politica-de-privacidade
      - generic [ref=e117]:
        - generic [ref=e118]:
          - heading "BECOTOY LTDA." [level=4] [ref=e119]
          - paragraph [ref=e120]: CNPJ em atualização cadastral.
        - generic [ref=e121]:
          - heading "Contato" [level=4] [ref=e122]
          - link "(21) 99785-3031" [ref=e123] [cursor=pointer]:
            - /url: tel:+5521997853031
            - img [ref=e124]
            - text: (21) 99785-3031
          - paragraph [ref=e126]:
            - img [ref=e127]
            - text: contato@becotoy.com.br
        - generic [ref=e130]:
          - heading "Redes Sociais" [level=4] [ref=e131]
          - generic [ref=e132]:
            - link "Instagram" [ref=e133] [cursor=pointer]:
              - /url: https://www.instagram.com/becotoy/
            - link "Facebook" [ref=e134] [cursor=pointer]:
              - /url: https://www.facebook.com/becotoy/
            - link "Tiktok" [ref=e135] [cursor=pointer]:
              - /url: https://www.tiktok.com/@becotoy
      - paragraph [ref=e137]: © 2026 BecoToy. Todos os direitos reservados.
  - alert [ref=e138]
```

# Test source

```ts
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
> 250 |         expect.soft(false, `Duplicado "${titulo}" em ${p} e ${titulos[titulo]}`).toBeTruthy();
      |                                                                                  ^ Error: Duplicado "BecoToy | Suas memórias em alta resolução" em /sobre e /
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