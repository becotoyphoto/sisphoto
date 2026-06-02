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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { items, cartId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // Usa a URL de produção configurada — nunca localhost em produção
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl || siteUrl.includes('localhost')) {
      console.error('NEXT_PUBLIC_SITE_URL não configurada corretamente:', siteUrl);
      return NextResponse.json(
        { error: 'Configuração de pagamento inválida. Contate o suporte.' },
        { status: 500 }
      );
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: { photo_id: string; event_name: string; price: number }) => ({
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
      },
    });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error('Erro Mercado Pago:', error);
    return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 });
  }
}
