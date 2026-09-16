import { describe, expect, it, beforeEach } from 'vitest';
import { RevenueLeakageService } from '../../src/application/revenue-leakage-service';
import { MemoryRevenueWorkflowRepository } from '../../src/integrations/memory-workflow';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import type { LeadRecord } from '../../src/domain/lead';

describe('RevenueLeakageService', () => {
  let workflow: MemoryRevenueWorkflowRepository;
  let leadStore: MemoryLeadStore;
  let leakageService: RevenueLeakageService;

  beforeEach(() => {
    workflow = new MemoryRevenueWorkflowRepository();
    leadStore = new MemoryLeadStore();
    leakageService = new RevenueLeakageService(leadStore, workflow);
  });

  it('detects uncontacted and qualified-no-booking leads and creates SDR work items', async () => {
    const uncontactedLead: LeadRecord = {
      id: 'lead-uncontacted',
      organizationId: 'tenant-1',
      name: 'Bob Vance',
      state: 'new',
      score: 80,
      consent: true,
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z',
      commercial: { estimatedDealValue: 150_000, currency: 'NGN' },
      profile: {},
      decision: {
        action: 'sdr-follow-up',
        route: 'sdr',
        reason: 'New lead',
        priority: {
          score: 80,
          band: 'high',
          intentMultiplier: 1.2,
          urgencyMultiplier: 1.0,
          valueMultiplier: 1.0,
          reason: ['Contact lead'],
        },
      },
    };

    const qualifiedLead: LeadRecord = {
      id: 'lead-qualified',
      organizationId: 'tenant-1',
      name: 'Pam Beesly',
      state: 'qualified',
      score: 95,
      consent: true,
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-15T08:00:00.000Z',
      commercial: { estimatedDealValue: 300_000, currency: 'NGN' },
      profile: {},
      decision: {
        action: 'closer-handoff',
        route: 'closer',
        reason: 'Qualified',
        priority: {
          score: 95,
          band: 'critical',
          intentMultiplier: 1.5,
          urgencyMultiplier: 1.2,
          valueMultiplier: 1.1,
          reason: ['Book appointment'],
        },
      },
    };

    await leadStore.save(uncontactedLead);
    await leadStore.save(qualifiedLead);

    const summary = await leakageService.detectAndSyncTenantLeakage(
      'tenant-1',
      '2026-09-15T11:00:00.000Z', // 1 hr after Bob, 3 hrs after Pam
    );

    expect(summary.scannedLeads).toBe(2);
    expect(summary.detectedLeakages).toHaveLength(2);
    expect(summary.enqueuedWorkItems).toHaveLength(2);
    expect(summary.totalRecoverableRevenue).toBeGreaterThan(0);

    // Verify persisted work items in queue
    const workItems = await workflow.listSdrWorkItems('tenant-1');
    expect(workItems).toHaveLength(2);
    expect(workItems.some((w) => w.leadId === 'lead-uncontacted')).toBe(true);
    expect(workItems.some((w) => w.leadId === 'lead-qualified')).toBe(true);
  });
});
