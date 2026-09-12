import type { WhatsAppClient, WhatsAppOutboundMessage } from './whatsapp';

export interface WhatsAppCloudClientOptions { accessToken: string; phoneNumberId: string; apiVersion?: string; fetchImpl?: typeof fetch; }

export class WhatsAppCloudClient implements WhatsAppClient {
  private readonly fetchImpl: typeof fetch;
  constructor(private readonly options: WhatsAppCloudClientOptions) { this.fetchImpl = options.fetchImpl ?? fetch; }

  async sendText(message: WhatsAppOutboundMessage): Promise<{ externalMessageId?: string }> {
    if (!this.options.accessToken || !this.options.phoneNumberId) throw new Error('WhatsApp Cloud API credentials are required');
    const version = this.options.apiVersion ?? 'v23.0';
    const response = await this.fetchImpl(`https://graph.facebook.com/${version}/${this.options.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.options.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: message.phone, type: 'text', text: { preview_url: false, body: message.body } }),
    });
    if (!response.ok) throw new Error(`WhatsApp send failed: ${response.status} ${await response.text()}`);
    const data = await response.json() as { messages?: Array<{ id?: string }> };
    return { externalMessageId: data.messages?.[0]?.id };
  }
}
