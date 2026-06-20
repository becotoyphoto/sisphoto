# Suíte E2E — FotoEvento Brasil

Scaffold de testes automatizados com Playwright para substituir o teste manual
em etapas. Resolve os pontos que ficaram em aberto no teste manual:

- **Bug do carrinho**: o spec `02-client-purchase-flow.spec.ts` não confia só
  em texto na tela — ele captura a resposta da API (`POST /api/carrinho`) e
  confirma o registro direto no banco via Supabase admin. Se isso passar e o
  texto da UI ainda não aparecer, o bug é de render/seletor, não de dado.
- **Fixtures fixas**: `fixtures/photos/foto-1.jpg`, `foto-2.jpg`, `foto-3.jpg`
  já estão no repo (geradas como imagens de teste), nada de caminho local do
  Windows.
- **Teardown automático**: `global-teardown.ts` apaga o evento, fotos e itens
  de carrinho de teste do Supabase (e do Storage) mesmo se um teste falhar no
  meio do caminho.
- **Screenshot/vídeo/trace na falha**: configurado em `playwright.config.ts`
  (`only-on-failure` / `retain-on-failure`), sem precisar reproduzir o bug
  manualmente para investigar.
- **Sem credenciais em texto puro**: tudo vem de `e2e/.env` (nunca commitado).
- **Casos negativos**: `03-negative-cases.spec.ts` cobre senha errada, evento
  inexistente, upload inválido e acesso cruzado entre fotógrafos.

## ⚠️ O que precisa ajustar antes de rodar

Eu não tenho acesso ao seu código-fonte, então marquei com `// AJUSTE` (ou
`AJUSTE:` em comentário) todo ponto que depende do seu projeto real:

1. **Seletores de UI** — labels de login, texto de confirmação de upload,
   texto de "marca d'água aplicada", mensagens de erro etc. Trocar texto
   solto por `data-testid` sempre que possível deixa os testes muito mais
   estáveis (ex: `data-testid="carrinho-item"`).
2. **Nomes de tabela/coluna no Supabase** — usei `profiles`, `eventos`,
   `fotos`, `carrinho_itens` como suposição. Ajuste em `global-setup.ts`,
   `global-teardown.ts` e `02-client-purchase-flow.spec.ts`.
3. **Nome do bucket de Storage** — usei `fotos-eventos` em
   `global-teardown.ts`.
4. **Rotas de API** — assumi `POST /api/fotos` e `POST /api/carrinho`;
   ajuste para o path real usado pelo seu front-end.

## Instalação

```bash
cd e2e
npm init -y
npm install -D @playwright/test dotenv
npm install @supabase/supabase-js
npx playwright install --with-deps chromium
```

## Configuração

```bash
cp .env.example .env
```

Preencha `e2e/.env` com:
- `BASE_URL` (local, preview do Vercel, ou staging — **nunca produção**)
- Credenciais de **duas contas dedicadas de teste** (não reutilize
  `fotografo3@`/`cliente3@`). Crie essas contas uma vez no Supabase Auth.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
  Essa chave só é usada em Node (setup/teardown), nunca no browser.

## Rodando

```bash
npx playwright test          # roda tudo
npx playwright test --ui     # modo interativo, ótimo pra ajustar seletores
npx playwright show-report   # abre o relatório HTML da última execução
```

## Por que não está mais misturando "testar" com "corrigir"

A suíte só testa — não aplica fix nenhum no app. O fluxo recomendado:

1. Roda a suíte → ela reporta o que falhou (com screenshot/trace).
2. Você revisa e aplica a correção no código.
3. Roda a suíte de novo do zero, contra o estado limpo (evento novo, sessão
   nova) — assim você sabe que o fix realmente resolveu, sem efeito colateral
   de estado deixado por uma execução anterior.

## Adicionando ao CI (opcional)

Se quiser rodar isso a cada push (GitHub Actions), me avisa — dá pra gerar o
workflow `.github/workflows/e2e.yml` usando os mesmos secrets do `.env` como
GitHub Secrets.
