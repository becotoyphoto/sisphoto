import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./support/supabaseAdmin";

const AUTH_DIR = path.resolve(__dirname, ".auth");
const STATE_FILE = path.resolve(AUTH_DIR, "test-state.json");

export default async function globalTeardown() {
  if (!fs.existsSync(STATE_FILE)) return;

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  const { eventId, eventWithPhotosId } = state;

  // Lista de eventos a limpar
  const eventIdsToClean = [eventId, eventWithPhotosId].filter(Boolean);

  for (const eid of eventIdsToClean) {
    // 1. Limpa itens de carrinho do evento
    await supabaseAdmin.from("cart_items").delete().eq("event_id", eid);

    // 2. Busca fotos para remover do Storage
    const { data: photos } = await supabaseAdmin
      .from("photos")
      .select("storage_path_original, storage_path_watermark")
      .eq("event_id", eid);

    // 3. Remove fotos e evento do banco
    await supabaseAdmin.from("photos").delete().eq("event_id", eid);
    await supabaseAdmin.from("events").delete().eq("id", eid);

    // 4. Remove arquivos do Storage
    if (photos && photos.length > 0) {
      const pathsToRemove: string[] = [];
      photos.forEach((p) => {
        if (p.storage_path_original) pathsToRemove.push(p.storage_path_original);
        if (p.storage_path_watermark) pathsToRemove.push(p.storage_path_watermark);
      });
      if (pathsToRemove.length > 0) {
        await supabaseAdmin.storage.from("photos").remove(pathsToRemove);
      }
    }
  }

  // 5. Deleta usuários de teste do Auth para manter o ambiente limpo
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  
  const testEmails = [
    process.env.TEST_PHOTOGRAPHER_EMAIL!,
    process.env.TEST_CLIENT_EMAIL!,
    "fotografo4-e2e@fotoevento.com",
  ];

  for (const email of testEmails) {
    const user = users.find(u => u.email === email);
    if (user) {
      await supabaseAdmin.from('profiles').delete().eq('id', user.id);
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  }

  fs.rmSync(STATE_FILE, { force: true });
}
