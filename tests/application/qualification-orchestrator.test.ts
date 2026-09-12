import { describe, expect, it } from 'vitest';
import { QualificationOrchestrator } from '../../src/application/qualification-orchestrator';
import { MemoryLeadEventStore } from '../../src/integrations/memory-lead-events';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';

describe('QualificationOrchestrator', () => {
  it('extracts qualification answers, updates the lead and proposes the next question', async () => {
    const leads = new MemoryLeadStore();
    const events = new MemoryLeadEventStore();
    await leads.save({
      id: 'lead_1',
      organizationId: 'org_1',
      name: 'Ada',
      state: 'contacting',
      profile: {},
      consent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const orchestrator = new QualificationOrchestrator(leads, events);
    const result = await orchestrator.process({
      leadId: 'lead_1',
      organizationId: 'org_1',
      text: 'Yes, I need the service and I can spend NGN 500k. I want to start tomorrow.',
    });

    expect(result.extractedFields.serviceFit).toBe(true);
    expect(result.extractedFields.budget).toBe(500_000);
    expect(result.extractedFields.urgencyDays).toBe(1);
    expect(result.lead.profile.serviceFit).toBe(true);
    expect(result.lead.profile.needConfirmed).toBe(true);
    expect(result.lead.profile.budget).toBe(500_000);
    expect(result.progress.answered.length).toBeGreaterThan(0);
    expect(result.nextQuestion).toBeTruthy();
  });

  it('enforces tenant isolation', async () => {
    const leads = new MemoryLeadStore();
    await leads.save({
      id: 'lead_2',
      organizationId: 'org_a',
      name: 'Bola',
      state: 'contacting',
      profile: {},
      consent: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const orchestrator = new QualificationOrchestrator(leads);
    await expect(orchestrator.process({
      leadId: 'lead_2',
      organizationId: 'org_b',
      text: 'Hello',
    })).rejects.toThrow('Tenant access denied');
  });
});
