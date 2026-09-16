import { describe, expect, it } from 'vitest';
import { parseLeadCsv, rowToLeadInput, splitCsvLine } from '../../src/domain/lead-source';

describe('lead sources and CSV imports', () => {
  it('splits CSV lines respecting quotes and commas', () => {
    const line = 'John Doe,"Acme, Inc.",john@example.com,"+234 800 123 4567","Software, Enterprise"';
    const parsed = splitCsvLine(line);
    expect(parsed).toEqual([
      'John Doe',
      'Acme, Inc.',
      'john@example.com',
      '+234 800 123 4567',
      'Software, Enterprise',
    ]);
  });

  it('parses CSV tables into typed records', () => {
    const csv = `name,email,phone,estimated_deal_value,service_type
Ada Lovelace,ada@example.com,+2348000000001,250000,Web Architecture
Grace Hopper,grace@example.com,+2348000000002,500000,Systems Consulting`;

    const records = parseLeadCsv(csv);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+2348000000001',
      estimated_deal_value: '250000',
      service_type: 'Web Architecture',
    });

    const leadInput = rowToLeadInput(records[0], 'tenant-123', 'csv_campaign_1');
    expect(leadInput.organizationId).toBe('tenant-123');
    expect(leadInput.name).toBe('Ada Lovelace');
    expect(leadInput.email).toBe('ada@example.com');
    expect(leadInput.commercial?.estimatedDealValue).toBe(250000);
    expect(leadInput.commercial?.serviceType).toBe('Web Architecture');
    expect(leadInput.profile?.serviceFit).toBe(true);
  });

  it('handles empty or malformed CSV gracefully', () => {
    expect(parseLeadCsv('')).toEqual([]);
    expect(parseLeadCsv(' \n\n ')).toEqual([]);
  });
});
