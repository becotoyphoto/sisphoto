/**
 * Validação de assinatura (x-signature) de webhooks do Mercado Pago.
 *
 * Documentação oficial:
 * https://www.mercadopago.com.br/developers/pt/docs/notifications/webhooks/header-configuration
 *
 * Formato do header `x-signature`:
 *   "ts=<timestamp>,v1=<hmac_sha256>"
 *
 * O `data.id` enviado no payload (e em alguns casos no header `x-signature`
 * via `data.id=<id>`) é concatenado ao template `${ts}${id}` e assinado
 * com o secret (access token) usando HMAC-SHA256.
 *
 * Se o `WEBHOOK_SIGNATURE_SECRET` não estiver configurado, a validação
 * é pulada (com aviso em log). Isso é útil em dev local, mas NUNCA deve
 * acontecer em produção.
 */

import crypto from 'crypto';

const SIGNATURE_HEADER = 'x-signature';
const REQUEST_ID_HEADER = 'x-request-id';
const DATA_ID_HEADER = 'x-data-id';

export interface ValidateSignatureResult {
  valid: boolean;
  reason?: string;
}

export function validateMercadoPagoSignature(
  request: Request,
  payload: unknown
): ValidateSignatureResult {
  const signature = request.headers.get(SIGNATURE_HEADER);
  const dataId = request.headers.get(DATA_ID_HEADER);
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // Em dev/test, se não tiver secret configurado, aceita mas avisa
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return {
        valid: false,
        reason: 'MERCADOPAGO_WEBHOOK_SECRET não configurado em produção',
      };
    }
    return { valid: true, reason: 'secret não configurado (dev)' };
  }

  if (!signature) {
    return { valid: false, reason: `header ${SIGNATURE_HEADER} ausente` };
  }

  // Parse "ts=...,v1=..."
  const parts = Object.fromEntries(
    signature.split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;

  if (!ts || !v1) {
    return { valid: false, reason: 'x-signature malformado' };
  }

  // Determina o data.id
  let resolvedDataId = dataId;
  if (!resolvedDataId && payload && typeof payload === 'object' && payload !== null) {
    const p = payload as Record<string, unknown>;
    const data = p.data as Record<string, unknown> | undefined;
    if (data && typeof data.id === 'string') {
      resolvedDataId = data.id;
    } else if (typeof p.id === 'string') {
      resolvedDataId = p.id;
    }
  }

  if (!resolvedDataId) {
    return { valid: false, reason: 'data.id ausente (header e payload)' };
  }

  // Calcula HMAC-SHA256(template.concat(id, ts))
  // Template padrão MP: "id:${data.id};request-id:${xRequestId};ts:${ts};"
  const requestId = request.headers.get(REQUEST_ID_HEADER) || '';
  const template = `id:${resolvedDataId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(template)
    .digest('hex');

  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(v1, 'hex')
  );

  if (!valid) {
    return { valid: false, reason: 'assinatura HMAC não confere' };
  }

  return { valid: true };
}
