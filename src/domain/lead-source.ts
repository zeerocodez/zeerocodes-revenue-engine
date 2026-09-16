import type { LeadIntakeInput } from './lead';

export type LeadSourceKind = 'csv' | 'facebook' | 'web-form' | 'api' | 'mcp' | 'webhook' | 'whatsapp' | 'email';

export interface LeadSourceConnection {
  id: string;
  organizationId: string;
  name: string;
  kind: LeadSourceKind;
  status: 'connected' | 'pending' | 'error';
  endpoint?: string;
  createdAt: string;
  lastReceivedAt?: string;
  received: number;
  failed: number;
}

export interface LeadImportResult {
  sourceId?: string;
  total: number;
  accepted: number;
  rejected: number;
  duplicates: number;
  errors: Array<{ row: number; message: string }>;
}

export function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseLeadCsv(csv: string): Array<Record<string, string>> {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((header) =>
    header.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
  );
  return lines.slice(1).map((line) =>
    Object.fromEntries(
      splitCsvLine(line).map((value, index) => [headers[index] ?? `column_${index + 1}`, value])
    )
  );
}

export function rowToLeadInput(
  row: Record<string, string>,
  organizationId: string,
  source = 'csv-import'
): LeadIntakeInput {
  const name = row.name || row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ');
  const serviceType = row.service_type || row.product || row.interest || 'General enquiry';
  const dealVal = Number(row.estimated_deal_value || row.deal_value || row.value || 0);

  return {
    organizationId,
    name: name || 'Unnamed Lead',
    email: row.email?.trim() || undefined,
    phone: (row.phone || row.phone_number || row.mobile)?.trim() || undefined,
    source,
    campaignId: row.campaign_id || row.campaign || undefined,
    consent: row.consent !== 'false' && row.consent !== '0',
    profile: {
      serviceFit: Boolean(serviceType),
      needConfirmed: row.need_confirmed !== 'false',
      decisionMaker: row.decision_maker === 'true' || row.decision_maker === '1',
      budget: Number.isFinite(dealVal) && dealVal > 0 ? dealVal : undefined,
    },
    commercial: {
      estimatedDealValue: Number.isFinite(dealVal) ? dealVal : 0,
      currency: row.currency || 'NGN',
      serviceType,
    },
    metadata: { importedRow: row },
  };
}
