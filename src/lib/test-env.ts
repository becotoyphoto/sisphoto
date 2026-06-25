import { getSupabaseUrl } from './supabase-env';

export type MercadoPagoCredentialType = 'TEST' | 'APP_USR' | 'MISSING' | 'OTHER';

export function isQaEnvironment(): boolean {
  const supabaseUrl = getSupabaseUrl();
  const qaRef = process.env.SUPABASE_QA_REF ?? 'sfyvyvhuzivpxcyfbbld';
  return supabaseUrl.includes(qaRef);
}

export function isNonProductionRuntime(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV !== 'production';
  }
  return process.env.NODE_ENV !== 'production';
}

export function isQaTestRouteEnabled(): boolean {
  return isQaEnvironment() && isNonProductionRuntime();
}

export function getMercadoPagoCredentialType(): MercadoPagoCredentialType {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!token) return 'MISSING';
  if (token.startsWith('TEST-')) return 'TEST';
  if (token.startsWith('APP_USR-')) return 'APP_USR';
  return 'OTHER';
}
