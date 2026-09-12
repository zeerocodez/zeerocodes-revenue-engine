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

export function normalizeWhatsAppWebhook(payload: unknown): WhatsAppInboundMessage[] {
  const result: WhatsAppInboundMessage[] = [];
  if (!payload || typeof payload !== 'object') return result;
  const value = payload as Record<string, unknown>;
  const entries = Array.isArray(value.entry) ? value.entry : [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const changes = Array.isArray((entry as Record<string, unknown>).changes) ? (entry as Record<string, unknown>).changes : [];
    for (const change of changes) {
      if (!change || typeof change !== 'object') continue;
      const changeValue = (change as Record<string, unknown>).value;
      if (!changeValue || typeof changeValue !== 'object') continue;
      const messages = Array.isArray((changeValue as Record<string, unknown>).messages) ? (changeValue as Record<string, unknown>).messages : [];
      for (const message of messages) {
        if (!message || typeof message !== 'object') continue;
        const m = message as Record<string, unknown>;
        const type = m.type;
        const from = typeof m.from === 'string' ? m.from : '';
        const id = typeof m.id === 'string' ? m.id : '';
        const text = m.text && typeof m.text === 'object' ? (m.text as Record<string, unknown>).body : undefined;
        if (type !== 'text' || !from || !id || typeof text !== 'string' || !text.trim()) continue;
        result.push({ externalMessageId: id, phone: from, body: text.trim(), timestamp: typeof m.timestamp === 'string' ? m.timestamp : undefined, channel: 'whatsapp' });
      }
    }
  }
  return result;
}
