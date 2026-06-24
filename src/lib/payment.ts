/**
 * Lógica de processamento de pagamento Pix.
 *
 * Esta função é compartilhada entre:
 *  - /api/webhooks/mercadopago (webhook real do Mercado Pago)
 *  - /api/test/simular-webhook-pagamento (rota interna de teste, só ativa em QA)
 *
 * Garante IDEMPOTÊNCIA: se o `mercadopago_id` já existe na tabela `orders`,
 * a função retorna sem criar registros duplicados. Isso é fundamental
 * porque o Mercado Pago reenvia notificações repetidamente.
 */

import { createServiceClient } from '@/lib/supabase-service';

export interface ProcessarConfirmacaoInput {
  paymentId: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded' | 'in_process' | string;
  userId?: string;
  cartId?: string;
  transactionAmount?: number;
  orderNumber?: string;
}

export interface ProcessarConfirmacaoResult {
  alreadyProcessed: boolean;
  orderId?: string;
  status: 'paid' | 'pending' | 'rejected' | 'no-op';
  message: string;
}

export async function processarConfirmacaoPagamento(
  input: ProcessarConfirmacaoInput
): Promise<ProcessarConfirmacaoResult> {
  const supabase = createServiceClient();
  const { paymentId, status, userId, cartId, transactionAmount, orderNumber } = input;

  // 1. IDEMPOTÊNCIA: se já existe order com esse mercadopago_id, sai sem fazer nada
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('mercadopago_id', String(paymentId))
    .maybeSingle();

  if (existingOrder) {
    return {
      alreadyProcessed: true,
      orderId: existingOrder.id,
      status: existingOrder.status as ProcessarConfirmacaoResult['status'],
      message: `Pedido ${existingOrder.id} já foi processado (status=${existingOrder.status}).`,
    };
  }

  // 2. Só "approved" cria pedido pagos; rejeitados criam registro para rastreio
  if (status !== 'approved') {
    const mappedStatus = status === 'pending' || status === 'in_process' ? 'pending' : 'rejected';

    // Para rejeições/cancelamentos: cria order para o frontend poder detectar o status
    if (mappedStatus === 'rejected') {
      // Resolve userId e cartId antes de criar o registro
      let rejUserId = userId;
      let rejCartId = cartId;
      if (!rejCartId && rejUserId) {
        const { data: cart } = await supabase.from('carts').select('id').eq('user_id', rejUserId).eq('status', 'active').maybeSingle();
        rejCartId = cart?.id;
      } else if (rejCartId && !rejUserId) {
        const { data: owner } = await supabase.from('carts').select('user_id').eq('id', rejCartId).maybeSingle();
        rejUserId = owner?.user_id;
      }
      if (rejUserId) {
        await supabase.from('orders').insert({
          user_id: rejUserId,
          total_amount: 0,
          status: 'rejected',
          mercadopago_id: String(paymentId),
        });
      }
    }

    return {
      alreadyProcessed: false,
      status: mappedStatus,
      message: `Pagamento ${paymentId} com status "${status}" — nenhuma ação necessária.`,
    };
  }

  // 3. Descobre o carrinho para extrair os itens
  let targetUserId = userId;
  let targetCartId = cartId;

  if (!targetCartId && targetUserId) {
    const { data: activeCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .maybeSingle();
    targetCartId = activeCart?.id;
  } else if (targetCartId && !targetUserId) {
    const { data: cartOwner } = await supabase
      .from('carts')
      .select('user_id')
      .eq('id', targetCartId)
      .maybeSingle();
    targetUserId = cartOwner?.user_id;
  }

  if (!targetUserId) {
    return {
      alreadyProcessed: false,
      status: 'no-op',
      message: `Não foi possível identificar o usuário para o pagamento ${paymentId}.`,
    };
  }

  // 4. Calcula o total a partir do carrinho
  let totalAmount = Number(transactionAmount || 0);
  let cartItems: { photo_id: string; price: number }[] = [];

  if (targetCartId) {
    const { data: items } = await supabase
      .from('cart_items')
      .select('photo_id, price')
      .eq('cart_id', targetCartId);
    if (items && items.length > 0) {
      cartItems = items.map((i) => ({ photo_id: i.photo_id, price: Number(i.price) }));
      if (!totalAmount) {
        totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0);
      }
    }
  }

  if (!totalAmount) {
    return {
      alreadyProcessed: false,
      status: 'no-op',
      message: `Pagamento ${paymentId} aprovado, mas nenhum item no carrinho e sem transaction_amount.`,
    };
  }

  // 5. Cria a order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: targetUserId,
      total_amount: totalAmount,
      status: 'paid',
      mercadopago_id: String(paymentId),
    })
    .select()
    .single();

  if (orderError || !order) {
    return {
      alreadyProcessed: false,
      status: 'no-op',
      message: `Erro ao criar pedido: ${orderError?.message ?? 'unknown'}`,
    };
  }

  // 6. Cria os order_items
  for (const item of cartItems) {
    await supabase.from('order_items').insert({
      order_id: order.id,
      photo_id: item.photo_id,
      price_at_purchase: item.price,
    });
  }

  // 7. Marca o carrinho como convertido
  if (targetCartId) {
    await supabase
      .from('carts')
      .update({ status: 'converted' })
      .eq('id', targetCartId);
  }

  return {
    alreadyProcessed: false,
    orderId: order.id,
    status: 'paid',
    message: `Pedido ${order.id} criado a partir do pagamento ${paymentId}${orderNumber ? ` (ref ${orderNumber})` : ''}.`,
  };
}
