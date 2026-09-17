import 'dotenv/config';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';

export interface InitializePaystackOptions {
  email: string;
  amountKobo: number; // in Kobo (e.g. ₦150,000 = 15000000)
  reference?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaystackInitResult {
  success: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  error?: string;
}

export interface PaystackVerifyResult {
  success: boolean;
  paid: boolean;
  amount?: number;
  currency?: string;
  customerEmail?: string;
  paidAt?: string;
  reference?: string;
  error?: string;
}

/**
 * Initializes a live payment checkout on Paystack
 */
export async function initializePaystackTransaction({
  email,
  amountKobo,
  reference,
  callbackUrl,
  metadata,
}: InitializePaystackOptions): Promise<PaystackInitResult> {
  const ref = reference || `zeero_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (!PAYSTACK_SECRET_KEY) {
    console.warn('Paystack secret key not configured; simulated checkout.');
    return {
      success: true,
      authorizationUrl: `https://checkout.paystack.com/simulate_${ref}`,
      accessCode: `sim_access_${ref}`,
      reference: ref,
    };
  }

  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email,
        amount: amountKobo,
        reference: ref,
        callback_url: callbackUrl || 'http://localhost:3000/#billing',
        metadata: metadata || {},
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        error: data.message || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Paystack error',
    };
  }
}

/**
 * Verifies a transaction by its reference on Paystack
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      success: true,
      paid: true,
      amount: 150000,
      currency: 'NGN',
      reference,
    };
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await res.json();

    if (!res.ok || !data.status) {
      return {
        success: false,
        paid: false,
        error: data.message || `HTTP ${res.status}`,
      };
    }

    const tx = data.data;
    return {
      success: true,
      paid: tx.status === 'success',
      amount: (tx.amount || 0) / 100,
      currency: tx.currency || 'NGN',
      customerEmail: tx.customer?.email,
      paidAt: tx.paid_at,
      reference: tx.reference,
    };
  } catch (error) {
    return {
      success: false,
      paid: false,
      error: error instanceof Error ? error.message : 'Paystack verification failed',
    };
  }
}
