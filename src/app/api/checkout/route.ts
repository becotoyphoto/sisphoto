import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@/lib/supabase-server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, cartId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const preference = new Preference(client);
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.photo_id,
          title: `Foto - ${item.event_name}`,
          unit_price: item.price,
          quantity: 1,
          currency_id: 'BRL',
        })),
        external_reference: orderNumber,
        back_urls: {
          success: `${siteUrl}/sucesso?order=${orderNumber}`,
          failure: `${siteUrl}/carrinho?status=failure`,
          pending: `${siteUrl}/carrinho?status=pending`,
        },
        auto_return: 'approved' as const,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        metadata: {
          user_id: user.id,
          cart_id: cartId,
        },
      }
    });

    return NextResponse.json({ 
      id: result.id, 
      init_point: result.init_point,
      order_number: orderNumber 
    });
  } catch (error) {
    console.error('Mercado Pago Error:', error);
    return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 });
  }
}
