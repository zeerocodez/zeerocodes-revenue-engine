import { describe, expect, it } from 'vitest';
import { planInitialFollowUps } from '../src/application/follow-up-planner';
import { calculateRevenuePriority } from '../src/domain/revenue-priority';
import type { LeadRecord } from '../src/domain/lead';

const lead: LeadRecord = {
  id: 'lead-1', organizationId: 'tenant-1', name: 'Ada', email: 'ada@example.com', phone: '+2348000000000',
  source: 'website', state: 'contacting', profile: {}, consent: true,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

const priority = calculateRevenuePriority({ score: 0, intent: 'unknown' });

describe('planInitialFollowUps', () => {
  it('plans immediate response, qualification and reminder for AI follow-up', async () => {
    const tasks: any[] = [];
    const scheduled = await planInitialFollowUps({ enqueue: async (task) => { tasks.push(task); return true; } }, lead, {
      action: 'ai-follow-up', route: 'ai-follow-up', reason: 'qualified lead requires automated follow-up', priority,
    });
    expect(scheduled).toBe(3);
    expect(tasks.map((task) => task.taskType)).toEqual(['instant_response', 'qualification', 'reminder']);
    expect(tasks.every((task) => task.channel === 'whatsapp')).toBe(true);
  });

  it('never schedules outbound work after consent is withdrawn', async () => {
    const tasks: any[] = [];
    const scheduled = await planInitialFollowUps({ enqueue: async (task) => { tasks.push(task); return true; } }, { ...lead, consent: false }, {
      action: 'ai-follow-up', route: 'ai-follow-up', reason: 'qualified', priority,
    });
    expect(scheduled).toBe(0);
    expect(tasks).toHaveLength(0);
  });
});
