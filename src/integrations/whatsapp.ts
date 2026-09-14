import { createHmac, timingSafeEqual } from 'node:crypto';
import type { MessageChannel } from '../domain/message';

export interface WhatsAppInboundMessage {
  externalMessageId: string;
  phone: string;
  body: string;
  timestamp?: string;
  channel: MessageChannel;
}

export interface WhatsAppOutboundMessage {
  phone: string;
  body: string;
}

export interface WhatsAppClient {
  sendText(message: WhatsAppOutboundMessage): Promise<{ externalMessageId?: string }>;
}

export function verifyWhatsAppSignature(rawBody: string | Buffer, signature: string | undefined, appSecret: string): boolean {
  if (!signature?.startsWith('sha256=') || !appSecret) return false;
  const supplied = signature.slice(7);
  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const a = Buffer.from(supplied, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function normalizeWhatsAppWebhook(payload: unknown): WhatsAppInboundMessage[] {
  const result: WhatsAppInboundMessage[] = [];
  const root = record(payload);
  if (!root) return result;
  const entries = Array.isArray(root.entry) ? root.entry : [];
  for (const entry of entries) {
    const entryRecord = record(entry);
    if (!entryRecord) continue;
    const changes = Array.isArray(entryRecord.changes) ? entryRecord.changes : [];
    for (const change of changes) {
      const changeRecord = record(change);
      if (!changeRecord) continue;
      const changeValue = record(changeRecord.value);
      if (!changeValue) continue;
      const messages = Array.isArray(changeValue.messages) ? changeValue.messages : [];
      for (const message of messages) {
        const m = record(message);
        if (!m) continue;
        const type = m.type;
        const from = typeof m.from === 'string' ? m.from : '';
        const id = typeof m.id === 'string' ? m.id : '';
        const textRecord = record(m.text);
        const text = textRecord?.body;
        if (type !== 'text' || !from || !id || typeof text !== 'string' || !text.trim()) continue;
        result.push({ externalMessageId: id, phone: from, body: text.trim(), timestamp: typeof m.timestamp === 'string' ? m.timestamp : undefined, channel: 'whatsapp' });
      }
    }
  }
  return result;
}
