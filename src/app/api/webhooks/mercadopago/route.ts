import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createServiceClient } from '@/lib/supabase-service';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action, data, type } = body;
    const paymentId = data?.id || id;
    const isPaymentNotification =
      type === 'payment' && ['payment.created', 'payment.updated'].includes(action);

    if (isPaymentNotification && paymentId) {
      const payment = new Payment(client);
      const supabase = createServiceClient();
      
      const paymentInfo = await payment.get({ id: String(paymentId) });
      
      if (paymentInfo.status === 'approved') {
        const orderNumber = paymentInfo.external_reference;
        const metadata = paymentInfo.metadata;
        
        if (orderNumber && metadata) {
          const userId = metadata.user_id as string | undefined;
          const cartId = metadata.cart_id as string | undefined;

          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('mercadopago_id', String(paymentId))
            .maybeSingle();

          if (existingOrder) {
            return NextResponse.json({ received: true });
          }
          
          const cartQuery = supabase
            .from('carts')
            .select('id, user_id, status');

          const { data: cartData } = cartId
            ? await cartQuery.eq('id', cartId).maybeSingle()
            : await cartQuery.eq('user_id', userId).eq('status', 'active').maybeSingle();
          
          if (cartData && userId) {
            const { data: cartItems } = await supabase
              .from('cart_items')
              .select('photo_id, price')
              .eq('cart_id', cartData.id);

            const totalAmount =
              cartItems?.reduce((sum, item) => sum + Number(item.price), 0) ||
              paymentInfo.transaction_amount ||
              0;
            
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                user_id: userId,
                total_amount: Number(paymentInfo.transaction_amount || totalAmount),
                status: 'paid',
                mercadopago_id: String(paymentId),
              })
              .select()
              .single();
            
            if (!orderError && order) {
              for (const item of cartItems || []) {
                await supabase.from('order_items').insert({
                  order_id: order.id,
                  photo_id: item.photo_id,
                  price_at_purchase: Number(item.price),
                });
              }
              
              await supabase
                .from('carts')
                .update({ status: 'converted' })
                .eq('id', cartData.id);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
