import 'dotenv/config';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

export interface WhatsAppTemplateParameter {
  type: 'text';
  text: string;
}

export interface SendWhatsAppTemplateOptions {
  to: string;
  templateName: 'speed_lead_intro' | 'demo_reminder_24h' | 'unicorn_closer_alert';
  languageCode?: string;
  bodyParameters?: string[];
}

export interface WhatsAppTemplateResult {
  success: boolean;
  messageId?: string;
  templateUsed?: string;
  recipient?: string;
  error?: string;
}

export const CANONICAL_TEMPLATES = {
  speed_lead_intro: {
    name: 'speed_lead_intro',
    category: 'UTILITY',
    textPattern: 'Hello {{1}}, this is Zeus from Zeerocodes regarding your inquiry for {{2}}. We noticed your scaling plan — are you free for a quick 2-minute walkthrough?',
    sampleParams: ['Engr. Babatunde', 'Prime Construct'],
  },
  demo_reminder_24h: {
    name: 'demo_reminder_24h',
    category: 'UTILITY',
    textPattern: 'Hi {{1}}, this is a quick reminder for your scheduled executive walkthrough tomorrow at {{2}} with our Solutions Partner. Google Meet Link: {{3}}',
    sampleParams: ['Dr. Amina', '10:00 AM', 'https://meet.google.com/abc-defg-hij'],
  },
  unicorn_closer_alert: {
    name: 'unicorn_closer_alert',
    category: 'UTILITY',
    textPattern: '🚨 UNICORN LEAD ALERT: {{1}} from {{2}} just booked a ₦{{3}} deal demo for {{4}}. View brief: {{5}}',
    sampleParams: ['Chief Adelekan', 'Adelekan Capital', '7,500,000', 'Today 4:00 PM', 'http://localhost:3000/#inbox'],
  },
};

/**
 * Dispatches an approved WhatsApp Template message via Meta Cloud API
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en_US',
  bodyParameters = [],
}: SendWhatsAppTemplateOptions): Promise<WhatsAppTemplateResult> {
  const cleanPhone = to.replace(/\D/g, '');

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn(`WhatsApp credentials missing; template '${templateName}' simulated.`);
    return {
      success: true,
      messageId: `sim_tpl_${Date.now()}`,
      templateUsed: templateName,
      recipient: cleanPhone,
    };
  }

  const parameters: WhatsAppTemplateParameter[] = bodyParameters.map((p) => ({
    type: 'text',
    text: p,
  }));

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
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: parameters.length > 0
            ? [
                {
                  type: 'body',
                  parameters,
                },
              ]
            : undefined,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn('WhatsApp Template Send Error:', data);
      return {
        success: false,
        templateUsed: templateName,
        error: data.error?.message || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      templateUsed: templateName,
      recipient: cleanPhone,
    };
  } catch (error) {
    return {
      success: false,
      templateUsed: templateName,
      error: error instanceof Error ? error.message : 'Unknown template dispatch error',
    };
  }
}
