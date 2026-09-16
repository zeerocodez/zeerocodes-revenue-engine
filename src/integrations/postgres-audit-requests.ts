import type { AuditRequest } from '../domain/audit-request';
import type { AuditRequestStore } from './memory-audit-requests';
import type { PostgresDatabase } from './postgres';

interface AuditRequestRow {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  website: string | null;
  monthly_lead_volume: string;
  current_crm: string | null;
  biggest_sales_bottleneck: string;
  average_deal_value: string | number | null;
  where_leads_are_lost: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  created_at: string | Date;
}

export class PostgresAuditRequestStore implements AuditRequestStore {
  constructor(private readonly db: PostgresDatabase) {}

  async create(request: AuditRequest): Promise<void> {
    await this.db.query(
      `insert into audit_requests (
        id, name, business, email, phone, website, monthly_lead_volume,
        current_crm, biggest_sales_bottleneck, average_deal_value,
        where_leads_are_lost, status, created_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      on conflict (id) do nothing`,
      [
        request.id,
        request.name,
        request.business,
        request.email,
        request.phone,
        request.website ?? null,
        request.monthlyLeadVolume,
        request.currentCrm ?? null,
        request.biggestSalesBottleneck,
        request.averageDealValue ?? null,
        request.whereLeadsAreLost ?? null,
        request.status,
        request.createdAt,
      ]
    );
  }

  async list(): Promise<AuditRequest[]> {
    const result = await this.db.query<AuditRequestRow>(
      `select * from audit_requests order by created_at desc`
    );
    return result.rows.map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<AuditRequest | null> {
    const result = await this.db.query<AuditRequestRow>(
      `select * from audit_requests where id = $1`,
      [id]
    );
    if (!result.rows.length) return null;
    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: AuditRequestRow): AuditRequest {
    return {
      id: row.id,
      name: row.name,
      business: row.business,
      email: row.email,
      phone: row.phone,
      website: row.website ?? undefined,
      monthlyLeadVolume: row.monthly_lead_volume,
      currentCrm: row.current_crm ?? undefined,
      biggestSalesBottleneck: row.biggest_sales_bottleneck,
      averageDealValue: row.average_deal_value ? Number(row.average_deal_value) : undefined,
      whereLeadsAreLost: row.where_leads_are_lost ?? undefined,
      status: row.status,
      createdAt: typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString(),
    };
  }
}
