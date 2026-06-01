import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action, data, type } = body;

    if (type === 'payment' && action === 'payment.created' || action === 'payment.updated') {
      const payment = new Payment(client);
      
      const paymentInfo = await payment.get(id);
      
      if (paymentInfo.status === 'approved') {
        const supabase = await createClient();
        
        const orderNumber = paymentInfo.external_reference;
        const metadata = paymentInfo.metadata;
        
        if (orderNumber && metadata) {
          const userId = metadata.user_id;
          
          const { data: cartData } = await supabase
            .from('carts')
            .select('*, cart_items(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .single();
          
          if (cartData) {
            const cartItems = cartData.cart_items || [];
            const totalAmount = cartItems.reduce((sum: number, item: any) => sum + item.price, 0) || paymentInfo.transaction_amount;
            
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert({
                user_id: userId,
                total_amount: paymentInfo.transaction_amount || totalAmount,
                status: 'paid',
                mercadopago_id: id.toString(),
              })
              .select()
              .single();
            
            if (!orderError && order) {
              for (const item of cartItems) {
                await supabase.from('order_items').insert({
                  order_id: order.id,
                  photo_id: item.photo_id,
                  price_at_purchase: item.price,
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
