import { createServiceClient } from '@/lib/supabase-service';

const DEFAULT_COMMISSION_RATE = 0.15;

let cachedRate: number | null = null;
let cacheExpiry = 0;

/**
 * Retorna a taxa de comissão da plataforma (0-1).
 * Usa cache em memória por 5 minutos para evitar queries constantes.
 */
export async function getCommissionRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate !== null && now < cacheExpiry) {
    return cachedRate;
  }

  try {
    const service = createServiceClient();
    const { data } = await service
      .from('platform_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .single();

    if (data?.value?.rate != null) {
      cachedRate = Number(data.value.rate);
      cacheExpiry = now + 5 * 60 * 1000;
      return cachedRate;
    }
  } catch {
    // usa default
  }

  cachedRate = DEFAULT_COMMISSION_RATE;
  cacheExpiry = now + 5 * 60 * 1000;
  return cachedRate;
}
