import type { AuditRequest } from '../domain/audit-request';

export interface AuditRequestStore {
  create(request: AuditRequest): Promise<void>;
  list(): Promise<AuditRequest[]>;
  findById(id: string): Promise<AuditRequest | null>;
}

export class MemoryAuditRequestStore implements AuditRequestStore {
  private readonly requests: AuditRequest[] = [];

  async create(request: AuditRequest): Promise<void> {
    this.requests.unshift(structuredClone(request));
  }

  async list(): Promise<AuditRequest[]> {
    return structuredClone(this.requests);
  }

  async findById(id: string): Promise<AuditRequest | null> {
    const found = this.requests.find((r) => r.id === id);
    return found ? structuredClone(found) : null;
  }
}
