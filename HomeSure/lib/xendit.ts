import { CreateInvoiceRequest, CreateQRRequest } from './types';

const xenditSecretKey = process.env.XENDIT_SECRET_KEY || 'xnd_development_placeholder';

// Helper for Base64 Authorization header required by Xendit API
function getXenditAuthHeader() {
  const authString = `${xenditSecretKey}:`;
  const base64Auth = Buffer.from(authString).toString('base64');
  return `Basic ${base64Auth}`;
}

/**
 * Creates a Xendit Payment Invoice (Supports GCash, Maya, Credit Cards, QRPH)
 */
export async function createXenditInvoice(data: CreateInvoiceRequest) {
  const externalId = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (process.env.XENDIT_SECRET_KEY && process.env.XENDIT_SECRET_KEY.startsWith('xnd_')) {
    try {
      const response = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          'Authorization': getXenditAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_id: externalId,
          amount: data.amount,
          payer_email: data.payer_email,
          description: data.description || 'HomeSure Rental Payment',
          success_redirect_url: data.redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/module/buyer/payments.html?status=success`,
          failure_redirect_url: data.redirect_url || `${process.env.NEXT_PUBLIC_APP_URL}/module/buyer/payments.html?status=failed`,
          currency: 'PHP',
          payment_methods: ['GCASH', 'PAYMAYA', 'QRPH', 'CREDIT_CARD', 'SHOPEEPAY'],
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || resData.error_code || 'Xendit Invoice Creation Error');
      }

      return {
        externalId: resData.external_id,
        invoiceId: resData.id,
        checkoutUrl: resData.invoice_url,
        status: resData.status,
        amount: resData.amount,
      };
    } catch (error: any) {
      console.error('Error creating Xendit invoice:', error.message);
      throw error;
    }
  } else {
    // Mock response for local development when secret key is not set
    return {
      externalId: externalId,
      invoiceId: `mock_inv_${Date.now()}`,
      checkoutUrl: `https://checkout.xendit.co/web/mock_inv_${Date.now()}`,
      status: 'PENDING',
      amount: data.amount,
    };
  }
}

/**
 * Creates a Xendit QR Code (QRPH Standard for GCash / Maya scanning)
 */
export async function createXenditQRCode(data: CreateQRRequest) {
  const externalId = `QRPH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  if (process.env.XENDIT_SECRET_KEY && process.env.XENDIT_SECRET_KEY.startsWith('xnd_')) {
    try {
      const response = await fetch('https://api.xendit.co/qr_codes', {
        method: 'POST',
        headers: {
          'Authorization': getXenditAuthHeader(),
          'Content-Type': 'application/json',
          'api-version': '2022-07-31',
        },
        body: JSON.stringify({
          external_id: externalId,
          type: 'DYNAMIC',
          amount: data.amount,
          currency: 'PHP',
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || resData.error_code || 'Xendit QR Code Creation Error');
      }

      return {
        externalId: resData.external_id,
        qrId: resData.id,
        qrString: resData.qr_string,
        status: resData.status,
        amount: resData.amount,
      };
    } catch (error: any) {
      console.error('Error creating Xendit QR code:', error.message);
      throw error;
    }
  } else {
    // Mock response for local development
    return {
      externalId: externalId,
      qrId: `mock_qr_${Date.now()}`,
      qrString: `00020101021226680016COM.XENDIT.QRPH0118MOCK${Date.now()}53036085404${data.amount}5802PH5908HOMESURE6006MANILA6304ABCD`,
      status: 'ACTIVE',
      amount: data.amount,
    };
  }
}

/**
 * Validates incoming Xendit Webhook callback token for security
 */
export function verifyXenditWebhookToken(requestToken: string | null): boolean {
  const expectedToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;
  if (!expectedToken) {
    console.warn('XENDIT_WEBHOOK_VERIFICATION_TOKEN is not configured. Skipping token verification in sandbox mode.');
    return true;
  }
  return requestToken === expectedToken;
}
