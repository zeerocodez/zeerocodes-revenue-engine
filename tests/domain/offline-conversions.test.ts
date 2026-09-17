import { describe, expect, it } from 'vitest';
import {
  hashPii,
  buildMetaCapiPayload,
  OfflineConversionEvent,
} from '../../src/domain/offline-conversions';
import { MetaConversionsAdapter } from '../../src/integrations/meta-conversions-adapter';

describe('Meta Conversions API (CAPI) & Offline Attribution Engine', () => {
  it('hashes PII according to SHA-256 Meta compliance standard', () => {
    const rawEmail = ' Test.User@Example.COM ';
    const hashed = hashPii(rawEmail);

    expect(hashed).toBeDefined();
    expect(hashed).toHaveLength(64); // SHA-256 hex length
    // Lowercase normalized hash check
    expect(hashPii('test.user@example.com')).toBe(hashed);
  });

  it('dispatches server-to-server CAPI purchase event with real deal value', async () => {
    const adapter = new MetaConversionsAdapter();

    const event = await adapter.emitConversion({
      organizationId: 'tenant_lagos',
      leadId: 'lead_999',
      eventName: 'Purchase',
      dealValue: 2500000,
      currency: 'NGN',
      leadScore: 92,
      serviceType: 'Commercial Cleaning',
      userData: {
        email: 'babatunde@primeconstruct.ng',
        phone: '+2348031234567',
      },
    });

    expect(event.eventName).toBe('Purchase');
    expect(event.customData.value).toBe(2500000);
    expect(event.userData.hashedEmail).toBeDefined();
    expect(event.status).toBe('dispatched');

    const metaPayload = buildMetaCapiPayload(event);
    expect(metaPayload.data).toBeDefined();
  });
});
