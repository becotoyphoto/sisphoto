/**
 * Webhook de notificações do Mercado Pago.
 *
 * Recebe notificações IPN/Webhooks v2 do Mercado Pago quando o status
 * de um pagamento muda. Usa a função compartilhada
 * `processarConfirmacaoPagamento` (src/lib/payment.ts) para garantir
 * que a lógica de negócio seja EXATAMENTE a mesma do caminho de teste.
 *
 * IDEMPOTÊNCIA está coberta em `processarConfirmacaoPagamento`
 * (verifica `mercadopago_id` antes de criar registros).
 *
 * Validação de assinatura `x-signature` (HMAC-SHA256) é feita em
 * src/lib/webhook-signature.ts. Se o secret não estiver configurado
 * em produção, rejeita a request.
 */

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { processarConfirmacaoPagamento } from '@/lib/payment';
import { validateMercadoPagoSignature } from '@/lib/webhook-signature';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // 1. Lê o payload bruto (precisamos dele tanto para a validação
    //    da assinatura quanto para extrair o paymentId)
    const rawBody = await request.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // 2. Valida a assinatura (se secret configurado)
    const sigResult = validateMercadoPagoSignature(request, payload);
    if (!sigResult.valid) {
      console.error('[webhook] Assinatura inválida:', sigResult.reason);
      return NextResponse.json(
        { error: 'Invalid signature', reason: sigResult.reason },
        { status: 401 }
      );
    }

    // 3. Identifica o paymentId
    const body = payload as {
      id?: string | number;
      type?: string;
      action?: string;
      data?: { id?: string | number };
    };
    const paymentId = body.data?.id ?? body.id;
    const isPaymentNotification =
      body.type === 'payment' &&
      ['payment.created', 'payment.updated'].includes(body.action ?? '');

    if (!isPaymentNotification || !paymentId) {
      // Não é uma notificação de pagamento que nos interesse — responde 200 OK
      return NextResponse.json({ received: true, ignored: true });
    }

    // 4. Busca os dados do pagamento na API do MP
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado' },
        { status: 500 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);
    const paymentInfo = await paymentClient.get({ id: String(paymentId) });

    // 5. Chama a função compartilhada (mesma lógica do caminho de teste)
    const result = await processarConfirmacaoPagamento({
      paymentId: String(paymentId),
      status: paymentInfo.status ?? 'pending',
      userId: (paymentInfo.metadata?.user_id as string) ?? undefined,
      cartId: (paymentInfo.metadata?.cart_id as string) ?? undefined,
      transactionAmount: paymentInfo.transaction_amount ?? undefined,
      orderNumber: paymentInfo.external_reference ?? undefined,
    });

    return NextResponse.json({
      received: true,
      ...result,
    });
  } catch (error) {
    console.error('[webhook] error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
