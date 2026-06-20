/**
 * Cria um pagamento Pix direto via API do Mercado Pago.
 *
 * Diferente do Checkout Pro (Preference), aqui usamos a API
 * POST /v1/payments com `payment_method_id: "pix"`, o que retorna
 * o QR Code (qr_code_base64) e o código copia-e-cola (qr_code)
 * para renderizar no próprio site — sem redirect.
 *
 * Recebe: { items: [{photo_id, price, event_name?}], cartId, payer?: {email, first_name, ...} }
 * Retorna: { payment_id, status, qr_code_base64, qr_code (copia-cola), ticket_url }
 */

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@/lib/supabase-server';

interface PixItem {
  photo_id: string;
  event_name?: string;
  price: number | string;
}

function resolveSiteUrl(request: Request): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    request.headers.get('origin'),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    try {
      const u = new URL(c);
      const host = u.hostname.toLowerCase();
      if (!['http:', 'https:'].includes(u.protocol)) continue;
      if (['localhost', '127.0.0.1'].includes(host)) continue;
      return u.origin;
    } catch {
      continue;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const isQa = !accessToken &&
      (process.env.SUPABASE_QA_REF
        ? (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(process.env.SUPABASE_QA_REF)
        : process.env.NODE_ENV !== 'production');

    if (!accessToken && !isQa) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, cartId, payer } = body as {
      items: PixItem[];
      cartId?: string;
      payer?: { email?: string; first_name?: string; last_name?: string };
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // Calcula total
    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.price),
      0
    );

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor total inválido' },
        { status: 400 }
      );
    }

    // Em QA (sem token), retorna um QR mock para validação do fluxo frontend.
    // O teste de backend (simular-webhook-pagamento) roda independentemente
    // do Mercado Pago real.
    if (!accessToken && isQa) {
      const externalRef = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 6)
        .toUpperCase()}`;
      return NextResponse.json({
        payment_id: `QA-MOCK-${Date.now()}`,
        status: 'pending',
        order_number: externalRef,
        qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        qr_code: `00020126580014BR.GOV.BCB.PIX0136${externalRef}@mock.qa5204000053039865404${(totalAmount * 100).toFixed(0)}5802BR5925QA-TEST${Date.now().toString().slice(-6)}6008BRASILIA62070503***6304ABCD`,
        ticket_url: null,
        transaction_amount: totalAmount,
        expires_at: null,
      });
    }

    const siteUrl = resolveSiteUrl(request);
    const externalRef = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    const client = new MercadoPagoConfig({ accessToken: accessToken as string });
    const paymentClient = new Payment(client);

    const result = await paymentClient.create({
      body: {
        transaction_amount: Number(totalAmount.toFixed(2)),
        description: `Compra de ${items.length} foto(s) - ${items[0]?.event_name || 'SisPhoto'}`,
        payment_method_id: 'pix',
        payer: {
          email: payer?.email || user.email || 'test@test.com',
          first_name: payer?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'Cliente',
          last_name: payer?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'SisPhoto',
        },
        external_reference: externalRef,
        notification_url: siteUrl
          ? `${siteUrl}/api/webhooks/mercadopago`
          : undefined,
        metadata: {
          user_id: user.id,
          cart_id: cartId ?? null,
          order_number: externalRef,
        },
      },
    });

    const txData = result.point_of_interaction?.transaction_data;
    if (!txData?.qr_code) {
      return NextResponse.json(
        {
          error: 'Mercado Pago não retornou QR Code',
          payment_id: result.id,
          mp_status: result.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      payment_id: result.id,
      status: result.status,
      order_number: externalRef,
      qr_code_base64: txData.qr_code_base64,
      qr_code: txData.qr_code, // código copia-e-cola
      ticket_url: txData.ticket_url,
      transaction_amount: result.transaction_amount,
      expires_at: null,
    });
  } catch (error) {
    console.error(
      'Mercado Pago Pix Error:',
      error instanceof Error ? error.message : JSON.stringify(error)
    );
    return NextResponse.json(
      { error: 'Erro ao criar pagamento Pix' },
      { status: 500 }
    );
  }
}
