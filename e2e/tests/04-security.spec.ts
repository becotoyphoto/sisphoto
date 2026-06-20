import { test, expect } from "@playwright/test";
import path from "path";
import { supabaseAdmin } from "../support/supabaseAdmin";
import { getTestEventWithPhotos } from "../support/testData";

test.use({ storageState: path.resolve(__dirname, "..", ".auth", "client.json") });

test.describe("Segurança e RLS", () => {
  test("não permite leitura cruzada de carrinhos via REST API", async ({ page, request }) => {
    // 1. Pega o fotógrafo de teste que não é o cliente logado
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const photographer = users.find(u => u.email === process.env.TEST_PHOTOGRAPHER_EMAIL);
    if (!photographer) throw new Error("Fotógrafo não encontrado");

    // 2. Cria um carrinho e item para o fotógrafo via admin (bypassa RLS)
    const { data: cart } = await supabaseAdmin
      .from('carts')
      .insert({ user_id: photographer.id, status: 'active' })
      .select('id')
      .single();

    expect(cart).toBeDefined();

    // Pega uma foto qualquer, se não existir cria uma
    const { eventId } = getTestEventWithPhotos();
    let { data: photo } = await supabaseAdmin
      .from('photos')
      .select('id')
      .eq('event_id', eventId)
      .limit(1)
      .single();

    if (!photo) {
      const { data: newPhoto } = await supabaseAdmin.from('photos').insert({
        event_id: eventId,
        storage_path_original: 'dummy',
        storage_path_watermark: 'dummy',
        price: 15.0
      }).select('id').single();
      photo = newPhoto;
    }

    const { data: cartItem } = await supabaseAdmin
      .from('cart_items')
      .insert({ cart_id: cart!.id, photo_id: photo!.id, price: 15.0 })
      .select('id')
      .single();

    expect(cartItem).toBeDefined();

    // 3. Loga como cliente3 e tenta ler o item via REST direto do teste (Node)
    const { data: clientAuth } = await supabaseAdmin.auth.signInWithPassword({
      email: process.env.TEST_CLIENT_EMAIL!,
      password: process.env.TEST_CLIENT_PASSWORD!
    });

    expect(clientAuth.session).toBeDefined();

    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/cart_items?cart_id=eq.${cart!.id}`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${clientAuth.session!.access_token}`
      }
    });

    const status = res.status;
    const data = await res.json();

    // Se o RLS estiver correto, deve retornar array vazio (200 com array vazio) ou erro 403
    if (status === 200) {
      expect(data).toHaveLength(0);
    } else {
      expect([401, 403]).toContain(status);
    }
  });
});
