import { describe, expect, it } from 'vitest';
import { detectLeadRevenueLeakage, deriveEstimatedDealValue } from '../../src/domain/revenue-leakage';
import type { LeadRecord } from '../../src/domain/lead';
import type { AppointmentRecord } from '../../src/domain/revenue-workflow';

function mockLead(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    id: 'lead-1',
    organizationId: 'tenant-1',
    name: 'Alice Johnson',
    state: 'new',
    score: 85,
    consent: true,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
    commercial: { estimatedDealValue: 200_000, currency: 'NGN' },
    profile: {},
    decision: {
      action: 'ai-follow-up',
      route: 'ai-follow-up',
      reason: 'High intent',
      priority: {
        score: 85,
        band: 'high',
        intentMultiplier: 1.2,
        urgencyMultiplier: 1.0,
        valueMultiplier: 1.0,
        reason: ['High priority'],
      },
    },
    ...overrides,
  };
}

describe('Revenue Leakage Engine', () => {
  it('detects uncontacted leakage when new lead exceeds SLA', () => {
    const lead = mockLead({
      state: 'new',
      updatedAt: '2026-09-15T10:00:00.000Z',
    });
    // 30 minutes later (SLA is 5m)
    const leakage = detectLeadRevenueLeakage({
      lead,
      now: '2026-09-15T10:30:00.000Z',
    });

    expect(leakage).not.toBeNull();
    expect(leakage?.leakageType).toBe('uncontacted');
    expect(leakage?.severity).toBe('critical'); // 30m > 4 * 5m
    expect(leakage?.estimatedRecoverableRevenue).toBe(160_000); // 0.8 * 200,000 for score >= 70
    expect(leakage?.recommendedAction).toContain('immediate automated outreach');
  });

  it('detects stalled engagement in qualifying state', () => {
    const lead = mockLead({
      state: 'qualifying',
      updatedAt: '2026-09-15T10:00:00.000Z',
    });
    // 120 minutes later (SLA is 30m, 120m > 2 * 30m)
    const leakage = detectLeadRevenueLeakage({
      lead,
      now: '2026-09-15T12:00:00.000Z',
    });

    expect(leakage).not.toBeNull();
    expect(leakage?.leakageType).toBe('stalled-engagement');
    expect(leakage?.severity).toBe('high');
    expect(leakage?.estimatedRecoverableRevenue).toBe(120_000); // 0.6 * 200,000 for qualifying
  });

  it('detects qualified lead with no booking', () => {
    const lead = mockLead({
      state: 'qualified',
      updatedAt: '2026-09-15T10:00:00.000Z',
    });
    // 150 minutes later without appointment (SLA is 60m)
    const leakage = detectLeadRevenueLeakage({
      lead,
      appointments: [],
      now: '2026-09-15T12:30:00.000Z',
    });

    expect(leakage).not.toBeNull();
    expect(leakage?.leakageType).toBe('qualified-no-booking');
    expect(leakage?.severity).toBe('high');
    expect(leakage?.estimatedRecoverableRevenue).toBe(150_000); // 0.75 * 200,000
  });

  it('does not detect qualified leakage if active appointment exists', () => {
    const lead = mockLead({
      state: 'qualified',
      updatedAt: '2026-09-15T10:00:00.000Z',
    });
    const appointment: AppointmentRecord = {
      id: 'apt-1',
      organizationId: 'tenant-1',
      leadId: 'lead-1',
      scheduledAt: '2026-09-16T14:00:00.000Z',
      status: 'scheduled',
      createdAt: '2026-09-15T10:30:00.000Z',
      updatedAt: '2026-09-15T10:30:00.000Z',
    };

    const leakage = detectLeadRevenueLeakage({
      lead,
      appointments: [appointment],
      now: '2026-09-15T12:30:00.000Z',
    });

    expect(leakage).toBeNull();
  });

  it('detects booked no sale when appointment passed without won outcome', () => {
    const lead = mockLead({
      state: 'booked',
      updatedAt: '2026-09-15T10:00:00.000Z',
    });
    const pastAppointment: AppointmentRecord = {
      id: 'apt-1',
      organizationId: 'tenant-1',
      leadId: 'lead-1',
      scheduledAt: '2026-09-15T11:00:00.000Z',
      status: 'scheduled',
      createdAt: '2026-09-15T09:00:00.000Z',
      updatedAt: '2026-09-15T09:00:00.000Z',
    };

    const leakage = detectLeadRevenueLeakage({
      lead,
      appointments: [pastAppointment],
      outcomes: [],
      now: '2026-09-15T15:00:00.000Z', // 4 hours past appointment
    });

    expect(leakage).not.toBeNull();
    expect(leakage?.leakageType).toBe('booked-no-sale');
    expect(leakage?.severity).toBe('high');
    expect(leakage?.estimatedRecoverableRevenue).toBe(180_000); // 0.9 * 200,000
  });

  it('derives deal value safely from fallback when commercial profile is missing', () => {
    const lead = mockLead({
      commercial: undefined,
      profile: {},
    });
    const value = deriveEstimatedDealValue(lead, 150_000);
    expect(value).toBe(150_000);
  });
});
