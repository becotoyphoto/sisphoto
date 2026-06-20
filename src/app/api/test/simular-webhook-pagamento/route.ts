/**
 * ROTA DE TESTE — simula o webhook de pagamento aprovado.
 *
 * ATIVAR APENAS QUANDO:
 *   - NODE_ENV !== 'production'
 *   - SUPABASE_URL contém o ref do projeto QA (sfyvyvhuzivpxcyfbbld)
 *
 * Esta rota existe para que os testes Playwright (e2e/05-payment-flow.spec.ts)
 * possam validar a SUA lógica de negócio (lib/payment.ts) sem depender
 * do Mercado Pago sandbox aprovar um Pix real (o que pode demorar ou
 * ficar inconsistente).
 *
 * A rota chama a MESMA função `processarConfirmacaoPagamento` que o
 * webhook real chama, garantindo que o que está sendo testado é
 * EXATAMENTE o que roda em produção.
 */

import { NextResponse } from 'next/server';
import { processarConfirmacaoPagamento } from '@/lib/payment';
import { createServiceClient } from '@/lib/supabase-service';

export const runtime = 'nodejs';

function isQaEnvironment(): boolean {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const isProd = process.env.NODE_ENV === 'production';
  // Identifica o projeto QA pelo ref do Supabase
  const isQaProject = supabaseUrl.includes('sfyvyvhuzivpxcyfbbld');
  return !isProd && isQaProject;
}

export async function POST(request: Request) {
  // 🔒 Trava de segurança: esta rota só roda em QA (e nunca em produção)
  if (!isQaEnvironment()) {
    return NextResponse.json(
      { error: 'Esta rota só está disponível no ambiente de QA (Sandbox).' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const {
      paymentId,
      status = 'approved',
      userId,
      cartId,
      transactionAmount,
      orderNumber,
    } = body as {
      paymentId: string;
      status?: string;
      userId?: string;
      cartId?: string;
      transactionAmount?: number;
      orderNumber?: string;
    };

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      );
    }

    // Se não veio userId/cartId, tenta descobrir via o cartId
    let resolvedUserId = userId;
    if (!resolvedUserId && cartId) {
      const supabase = createServiceClient();
      const { data: cart } = await supabase
        .from('carts')
        .select('user_id')
        .eq('id', cartId)
        .maybeSingle();
      resolvedUserId = cart?.user_id;
    }

    const result = await processarConfirmacaoPagamento({
      paymentId,
      status,
      userId: resolvedUserId,
      cartId,
      transactionAmount,
      orderNumber,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[test/simular-webhook] error:', error);
    return NextResponse.json(
      { error: 'Erro ao simular webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (!isQaEnvironment()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    message:
      'POST aqui com { paymentId, status?, userId?, cartId?, transactionAmount?, orderNumber? } para simular um webhook do Mercado Pago.',
  });
}
