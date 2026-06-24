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

function isLiveMercadoPagoToken(token: string | undefined): boolean {
  return Boolean(token && token.startsWith('APP_USR-'));
}

function looksLikeTestEmail(email: string | undefined): boolean {
  if (!email) return true;
  const normalized = email.trim().toLowerCase();
  return (
    normalized.includes('test') ||
    normalized.endsWith('@sisphoto.com') ||
    normalized.endsWith('@fotoevento.com') ||
    normalized.endsWith('@example.com') ||
    normalized.endsWith('@test.com') ||
    normalized.endsWith('@testuser.com')
  );
}

function resolveFallbackPayerEmail(request: Request): string {
  // 1. Variável de ambiente explícita — única forma garantida de ter e-mail aceito pelo MP
  const envEmail = process.env.MERCADOPAGO_PAYER_EMAIL;
  if (envEmail && envEmail.includes('@')) return envEmail;

  // 2. E-mail do dono da conta MP configurado no Supabase Auth
  //    (não depende de variável de ambiente extra)
  //    NOTA: em produção, o usuário precisa ter um e-mail real no Supabase
  //    que seja o mesmo da conta Mercado Pago.

  // 3. Último recurso: gera um e-mail a partir do domínio do site
  const siteUrl = resolveSiteUrl(request);
  if (siteUrl) {
    try {
      const host = new URL(siteUrl).hostname.replace(/^www\./, '');
      return `checkout@${host}`;
    } catch {
      // ignora e usa fallback estático abaixo
    }
  }

  return 'contato@becotoy.com.br';
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

    // Detecta ambiente QA pelo ref do Supabase (sfyvyvhuzivpxcyfbbld).
    // Em QA, SEMPRE retorna mock — mesmo que o token exista — porque o
    // token de produção não funciona no sandbox e o teste valida a lógica
    // de negócio via /api/test/simular-webhook-pagamento.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseQaRef = process.env.SUPABASE_QA_REF ?? 'sfyvyvhuzivpxcyfbbld';
    const isQa = supabaseUrl.includes(supabaseQaRef);

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

    // Em QA, retorna um QR mock para validação do fluxo frontend.
    // SEMPRE retorna mock em QA — mesmo que o token exista — porque
    // o token de teste pode não estar configurado na preview deployment.
    if (isQa) {
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
    const rawPayerEmail = payer?.email || user.email || '';
    const payerEmail =
      isLiveMercadoPagoToken(accessToken) && looksLikeTestEmail(rawPayerEmail)
        ? resolveFallbackPayerEmail(request)
        : rawPayerEmail || resolveFallbackPayerEmail(request);

    console.log('[Pix] Creating payment:', {
      payerEmail,
      rawPayerEmail,
      isLiveToken: isLiveMercadoPagoToken(accessToken),
      totalAmount,
      itemCount: items.length,
      siteUrl,
    });
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
          email: payerEmail,
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
    const serializedError = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('[Pix] Mercado Pago Error:', serializedError);

    if (
      serializedError.includes('Unauthorized use of live credentials')
    ) {
      return NextResponse.json(
        {
          error:
            'Credenciais de produção do Mercado Pago não autorizadas para este e-mail de pagador. Configure MERCADOPAGO_PAYER_EMAIL com o e-mail da sua conta MP.',
          detail: 'Unauthorized use of live credentials',
        },
        { status: 400 }
      );
    }

    if (
      serializedError.includes('Invalid test user email') ||
      serializedError.includes('invalid_email')
    ) {
      return NextResponse.json(
        {
          error: 'E-mail do pagador inválido para o Mercado Pago.',
          detail: serializedError,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar pagamento Pix', detail: serializedError },
      { status: 500 }
    );
  }
}
