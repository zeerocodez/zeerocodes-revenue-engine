import type { ClientConfiguration, ClientConfigurationStore } from '../domain/client-configuration';

export class MemoryClientConfigurationStore implements ClientConfigurationStore {
  private readonly configurations = new Map<string, ClientConfiguration>();

  async get(organizationId: string): Promise<ClientConfiguration | null> {
    const configuration = this.configurations.get(organizationId);
    return configuration ? structuredClone(configuration) : null;
  }

  async save(configuration: ClientConfiguration): Promise<void> {
    this.configurations.set(configuration.organizationId, structuredClone(configuration));
  }
}
