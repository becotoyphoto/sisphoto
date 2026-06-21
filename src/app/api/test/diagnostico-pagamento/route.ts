import { NextResponse } from 'next/server';
import {
  getMercadoPagoCredentialType,
  isQaTestRouteEnabled,
} from '@/lib/test-env';

export const runtime = 'nodejs';

export async function GET() {
  if (!isQaTestRouteEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    mercadopago_credential_type: getMercadoPagoCredentialType(),
  });
}
