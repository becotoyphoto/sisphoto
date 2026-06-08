import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createClient } from '@/lib/supabase-server';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

interface CheckoutItem {
  photo_id: string;
  event_name?: string;
  price: number | string;
}

function normalizeSiteUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, '');
}

function isPublicSiteUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    return ![
      'localhost',
      '127.0.0.1',
      '[::1]',
    ].includes(hostname) && !hostname.endsWith('.local');
  } catch {
    return false;
  }
}

function resolvePublicSiteUrl(request: Request) {
  const requestOrigin = normalizeSiteUrl(request.headers.get('origin') || new URL(request.url).origin);
  const vercelProjectProductionUrl = normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const vercelUrl = normalizeSiteUrl(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  const candidates = [
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
    vercelProjectProductionUrl,
    vercelUrl,
    requestOrigin,
  ].filter((value): value is string => Boolean(value));

  return candidates.find(isPublicSiteUrl) ?? null;
}

export async function POST(request: Request) {
  try {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mercado Pago não configurado.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, cartId } = await request.json() as {
      items: CheckoutItem[];
      cartId?: string | null;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const siteUrl = resolvePublicSiteUrl(request);

    if (!siteUrl) {
      return NextResponse.json(
        {
          error: 'Configure `NEXT_PUBLIC_SITE_URL` com uma URL publica https para habilitar o checkout do Mercado Pago.',
        },
        { status: 500 }
      );
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.photo_id,
          title: `Foto - ${item.event_name || 'Evento SisPhoto'}`,
          unit_price: Number(item.price),
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
      init_point: result.init_point || result.sandbox_init_point,
      order_number: orderNumber 
    });
  } catch (error) {
    console.error(
      'Mercado Pago Error:',
      error instanceof Error ? error.message : JSON.stringify(error)
    );
    return NextResponse.json({ error: 'Erro ao criar preferência de pagamento' }, { status: 500 });
  }
}
