import { describe, expect, it } from 'vitest';
import { ClientConfigurationService } from '../../src/application/client-configuration-service';
import { MemoryClientConfigurationStore } from '../../src/integrations/memory-client-configuration';

function service() {
  return new ClientConfigurationService(new MemoryClientConfigurationStore());
}

describe('ClientConfigurationService', () => {
  it('creates an isolated default configuration per tenant', async () => {
    const configurations = service();
    const a = await configurations.get('tenant_a');
    const b = await configurations.get('tenant_b');

    expect(a.organizationId).toBe('tenant_a');
    expect(b.organizationId).toBe('tenant_b');
    expect(a.version).toBe(1);
    expect(b.version).toBe(1);
  });

  it('increments configuration version when a tenant updates policy', async () => {
    const configurations = service();
    const current = await configurations.get('tenant_a');
    const updated = await configurations.save({
      ...current,
      qualification: { ...current.qualification, qualificationThreshold: 85 },
    });

    expect(updated.organizationId).toBe('tenant_a');
    expect(updated.qualification.qualificationThreshold).toBe(85);
    expect(updated.version).toBe(2);
  });

  it('rejects invalid qualification thresholds', async () => {
    const configurations = service();
    const current = await configurations.get('tenant_a');

    await expect(configurations.save({
      ...current,
      qualification: { ...current.qualification, qualificationThreshold: 101 },
    })).rejects.toThrow('qualification threshold must be between 0 and 100');
  });
});
