import type { ClientConfiguration, ClientConfigurationStore } from '../domain/client-configuration';
import { createDefaultClientConfiguration, validateClientConfiguration } from '../domain/client-configuration';

export class ClientConfigurationService {
  constructor(private readonly store: ClientConfigurationStore) {}

  async get(organizationId: string): Promise<ClientConfiguration> {
    const existing = await this.store.get(organizationId);
    if (existing) return existing;
    const configuration = createDefaultClientConfiguration(organizationId);
    await this.store.save(configuration);
    return configuration;
  }

  async save(configuration: ClientConfiguration): Promise<ClientConfiguration> {
    validateClientConfiguration(configuration);
    const current = await this.store.get(configuration.organizationId);
    const next = {
      ...configuration,
      version: current ? current.version + 1 : configuration.version,
      updatedAt: new Date().toISOString(),
    };
    await this.store.save(next);
    return next;
  }
}
