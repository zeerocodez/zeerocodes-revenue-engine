import { describe, expect, it } from 'vitest';
import { evaluateManagerEscalation } from '../../src/domain/manager-escalation';

describe('manager escalation', () => {
  it('escalates an SLA-breached lead', () => {
    const result = evaluateManagerEscalation({ organizationId: 'org_1', leadId: 'lead_1', priorityScore: 90, slaBreached: true, failedContactCount: 0 });
    expect(result.escalate).toBe(true);
    expect(result.reasons).toContain('sla-breach');
  });

  it('marks compliance risk as critical', () => {
    const result = evaluateManagerEscalation({ organizationId: 'org_1', leadId: 'lead_1', priorityScore: 20, slaBreached: false, failedContactCount: 0, doNotContact: true });
    expect(result.severity).toBe('critical');
    expect(result.reasons).toContain('compliance-risk');
  });
});
