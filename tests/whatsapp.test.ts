import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { normalizeWhatsAppWebhook, verifyWhatsAppSignature } from '../src/integrations/whatsapp';

describe('WhatsApp integration', () => {
  it('verifies Meta-style sha256 signatures', () => {
    const body = JSON.stringify({ hello: 'world' });
    const secret = 'test-secret';
    const signature = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
    expect(verifyWhatsAppSignature(body, signature, secret)).toBe(true);
    expect(verifyWhatsAppSignature(body, 'sha256=bad', secret)).toBe(false);
  });

  it('normalizes text messages and ignores unsupported messages', () => {
    const messages = normalizeWhatsAppWebhook({
      entry: [{ changes: [{ value: { messages: [
        { id: 'wamid.1', from: '2348000000000', type: 'text', text: { body: 'I need a website' } },
        { id: 'wamid.2', from: '2348000000000', type: 'image' },
      ] } }] }],
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ externalMessageId: 'wamid.1', phone: '2348000000000', body: 'I need a website', channel: 'whatsapp' });
  });
});
