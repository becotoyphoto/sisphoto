import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'contato@becotoy.com';
const FROM_NAME = process.env.FROM_NAME || 'BecoToy';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn('[Email] SMTP não configurado. Emails não serão enviados.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const t = getTransporter();
    if (!t) {
      console.log(`[Email] Simulação - Para: ${options.to}, Assunto: ${options.subject}`);
      return false;
    }

    await t.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });

    console.log(`[Email] Enviado para ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Erro ao enviar:', error);
    return false;
  }
}

// Templates de email

export async function sendPurchaseConfirmation(
  to: string,
  data: {
    orderNumber: string;
    eventName: string;
    photoCount: number;
    total: number;
    downloadLink: string;
  }
) {
  return sendEmail({
    to,
    subject: 'Compra confirmada - BecoToy',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="background:#1a1a2e;padding:24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:24px">BecoToy</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
          <h2 style="color:#111;margin-top:0">Compra Confirmada!</h2>
          <p style="color:#555;line-height:1.6">Olá! Sua compra foi confirmada com sucesso.</p>
          
          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Pedido</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold">${data.orderNumber}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Evento</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold">${data.eventName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Fotos</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold">${data.photoCount}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Total</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:18px">R$ ${data.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <a href="${data.downloadLink}" 
             style="display:block;background:#6c5ce7;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            Baixar minhas fotos
          </a>

          <p style="color:#888;font-size:13px;margin-top:24px;text-align:center">
            BecoToy - Suas memórias em boas mãos<br>
            Se tiver dúvidas, responda a este email.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendNewSaleNotification(
  to: string,
  data: {
    eventName: string;
    photoCount: number;
    total: number;
  }
) {
  return sendEmail({
    to,
    subject: 'Nova venda - BecoToy',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif">
        <div style="background:#1a1a2e;padding:24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:24px">BecoToy</h1>
        </div>
        <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px">
          <h2 style="color:#111;margin-top:0">Nova venda realizada!</h2>
          <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Evento</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold">${data.eventName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Fotos vendidas</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold">${data.photoCount}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#888;font-size:14px">Valor</td>
                <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:18px">R$ ${data.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `,
  });
}
