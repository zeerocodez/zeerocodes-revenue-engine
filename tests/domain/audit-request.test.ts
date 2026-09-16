import { describe, expect, it } from 'vitest';
import { createAuditRequest, validateAuditRequest } from '../../src/domain/audit-request';

describe('audit requests', () => {
  it('normalizes valid public submissions', () => {
    const request = createAuditRequest(
      {
        name: ' Ada Lovelace ',
        business: ' Example Co ',
        email: 'ADA@EXAMPLE.COM',
        phone: '+2348000000000',
        monthlyLeadVolume: '10–50',
        biggestSalesBottleneck: 'Qualified leads are not booking',
        averageDealValue: 500000,
      },
      'audit-1',
      '2026-09-16T00:00:00.000Z'
    );
    expect(request).toMatchObject({
      id: 'audit-1',
      name: 'Ada Lovelace',
      business: 'Example Co',
      email: 'ada@example.com',
      phone: '+2348000000000',
      status: 'new',
      averageDealValue: 500000,
    });
  });

  it('rejects missing fields and invalid email', () => {
    expect(() =>
      validateAuditRequest({
        name: '',
        business: 'Example',
        email: 'bad',
        phone: '+1',
        monthlyLeadVolume: '1–10',
        biggestSalesBottleneck: 'x',
      })
    ).toThrow('name is required');

    expect(() =>
      validateAuditRequest({
        name: 'Ada',
        business: 'Example',
        email: 'bad',
        phone: '+1',
        monthlyLeadVolume: '1–10',
        biggestSalesBottleneck: 'x',
      })
    ).toThrow('valid email is required');

    expect(() =>
      validateAuditRequest({
        name: 'Ada',
        business: 'Example',
        email: 'ada@example.com',
        phone: '+1',
        monthlyLeadVolume: '1–10',
        biggestSalesBottleneck: 'x',
        averageDealValue: -100,
      })
    ).toThrow('average deal value must be a non-negative number');
  });
});
