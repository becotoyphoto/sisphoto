import { chromium, FullConfig } from "@playwright/test";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./support/supabaseAdmin";

const AUTH_DIR = path.resolve(__dirname, ".auth");
const STATE_FILE = path.resolve(AUTH_DIR, "test-state.json");

async function loginAndSaveState(
  baseURL: string,
  email: string,
  password: string,
  outFile: string
) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  // AJUSTE: troque pelos seletores reais do seu formulário de login se
  // os labels não baterem exatamente com "email" / "senha".
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();

  try {
    await page.waitForURL(/dashboard/, { timeout: 15000 });
  } catch (err) {
    const bodyText = await page.innerText('body');
    console.error(`Falha no login para ${email}. Conteúdo da página:`, bodyText);
    throw err;
  }
  await page.context().storageState({ path: outFile });
  await browser.close();
}

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const baseURL = (config.projects[0].use.baseURL as string) || "http://localhost:3000";

  for (const key of [
    "TEST_PHOTOGRAPHER_EMAIL",
    "TEST_PHOTOGRAPHER_PASSWORD",
    "TEST_CLIENT_EMAIL",
    "TEST_CLIENT_PASSWORD",
  ]) {
    if (!process.env[key]) {
      throw new Error(`Variável de ambiente ${key} não definida. Copie e2e/.env.example para e2e/.env.`);
    }
  }

  // 1) Acha ou cria o fotógrafo de teste no Supabase Auth.
  let photographerId;
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    throw new Error(`Erro ao listar usuários: ${listError.message}`);
  }

  const existingPhotographer = users.find(u => u.email === process.env.TEST_PHOTOGRAPHER_EMAIL);
  
  if (existingPhotographer) {
    photographerId = existingPhotographer.id;
    // Garante a senha correta
    await supabaseAdmin.auth.admin.updateUserById(photographerId, { password: process.env.TEST_PHOTOGRAPHER_PASSWORD });
  } else {
    // Cria o fotógrafo
    const { data: newPhotographer, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: process.env.TEST_PHOTOGRAPHER_EMAIL,
      password: process.env.TEST_PHOTOGRAPHER_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Fotógrafo de Teste E2E",
        role: "photographer",
      }
    });

    if (createError || !newPhotographer.user) {
      throw new Error(`Falha ao criar fotógrafo: ${createError?.message}`);
    }
    photographerId = newPhotographer.user.id;

    // Garante que o profile existe e está aprovado
    await supabaseAdmin.from('profiles').upsert({
      id: photographerId,
      full_name: "Fotógrafo de Teste E2E",
      role: "photographer",
      is_approved: true
    });
  }

  // Acha ou cria o cliente de teste
  const existingClient = users.find(u => u.email === process.env.TEST_CLIENT_EMAIL);
  if (!existingClient) {
    const { data: newClient, error: createClientError } = await supabaseAdmin.auth.admin.createUser({
      email: process.env.TEST_CLIENT_EMAIL,
      password: process.env.TEST_CLIENT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: "Cliente de Teste E2E",
        role: "client",
      }
    });

    if (createClientError || !newClient.user) {
      throw new Error(`Falha ao criar cliente: ${createClientError?.message}`);
    }
    
    await supabaseAdmin.from('profiles').upsert({
      id: newClient.user.id,
      full_name: "Cliente de Teste E2E",
      role: "client",
      is_approved: true
    });
  } else {
    // Garante a senha correta
    await supabaseAdmin.auth.admin.updateUserById(existingClient.id, { password: process.env.TEST_CLIENT_PASSWORD });
  }

  // 2) Cria um evento de teste isolado e descartável — não depende mais de
  //    "Corrida do Engenhão" existir previamente em produção/staging.
  const eventName = `[E2E] Evento de Teste ${Date.now()}`;
  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .insert({ name: eventName, photographer_id: photographerId, city: 'Rio de Janeiro', state: 'RJ', date: new Date().toISOString().split('T')[0], status: 'published' })
    .select("id")
    .single();

  if (eventError || !event) {
    throw new Error(`Falha ao criar evento de teste: ${eventError?.message}`);
  }

  // 2b) Cria um SEGUNDO fotógrafo com evento próprio (para testes de acesso cruzado)
  const otherPhotographerEmail = "fotografo4-e2e@fotoevento.com";
  const otherPhotographerPassword = "123456";
  const existingOther = users.find(u => u.email === otherPhotographerEmail);

  let otherPhotographerId: string;
  if (existingOther) {
    otherPhotographerId = existingOther.id;
    await supabaseAdmin.auth.admin.updateUserById(otherPhotographerId, { password: otherPhotographerPassword });
  } else {
    const { data: newOther, error: createOtherError } = await supabaseAdmin.auth.admin.createUser({
      email: otherPhotographerEmail,
      password: otherPhotographerPassword,
      email_confirm: true,
      user_metadata: { full_name: "Fotógrafo 4 E2E", role: "photographer" }
    });
    if (createOtherError || !newOther.user) {
      throw new Error(`Falha ao criar fotógrafo 4: ${createOtherError?.message}`);
    }
    otherPhotographerId = newOther.user.id;
    await supabaseAdmin.from('profiles').upsert({
      id: otherPhotographerId,
      full_name: "Fotógrafo 4 E2E",
      role: "photographer",
      is_approved: true
    });
  }

  const otherEventName = `[E2E] Evento Outro Fotógrafo ${Date.now()}`;
  const { data: otherEvent, error: otherEventError } = await supabaseAdmin
    .from("events")
    .insert({ name: otherEventName, photographer_id: otherPhotographerId, city: 'São Paulo', state: 'SP', date: new Date().toISOString().split('T')[0], status: 'published' })
    .select("id")
    .single();

  if (otherEventError || !otherEvent) {
    throw new Error(`Falha ao criar evento do 2º fotógrafo: ${otherEventError?.message}`);
  }

  // 3) Loga as duas personas uma única vez e salva a sessão (storageState),
  //    pra cada spec não precisar refazer login do zero.
  await loginAndSaveState(
    baseURL,
    process.env.TEST_PHOTOGRAPHER_EMAIL!,
    process.env.TEST_PHOTOGRAPHER_PASSWORD!,
    path.resolve(AUTH_DIR, "photographer.json")
  );
  await loginAndSaveState(
    baseURL,
    process.env.TEST_CLIENT_EMAIL!,
    process.env.TEST_CLIENT_PASSWORD!,
    path.resolve(AUTH_DIR, "client.json")
  );

  fs.writeFileSync(STATE_FILE, JSON.stringify({
    eventId: event.id,
    eventName,
    otherPhotographerId,
    otherEventId: otherEvent.id,
  }, null, 2));
}
