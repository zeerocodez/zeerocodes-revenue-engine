import 'dotenv/config';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

export interface SendWhatsAppMessageOptions {
  to: string; // E.164 formatted phone number e.g. +2348031234567 or 2348031234567
  text: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  recipient?: string;
  error?: string;
}

/**
 * Sends a live WhatsApp text message via the Meta Cloud API
 */
export async function sendWhatsAppMessage({
  to,
  text,
}: SendWhatsAppMessageOptions): Promise<WhatsAppSendResult> {
  const cleanPhone = to.replace(/\D/g, '');

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp credentials not configured; message logged in simulation mode.');
    return {
      success: true,
      messageId: `sim_wamid_${Date.now()}`,
      recipient: cleanPhone,
    };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('WhatsApp API Response Error:', data);
      return {
        success: false,
        error: data.error?.message || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      recipient: cleanPhone,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown WhatsApp dispatch error',
    };
  }
}
