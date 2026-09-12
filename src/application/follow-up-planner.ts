import { randomUUID } from 'node:crypto';
import type { DecisionResult } from '../domain/decision-engine';
import type { FollowUpChannel, FollowUpTask, FollowUpTaskType } from '../domain/follow-up';
import type { LeadRecord } from '../domain/lead';

export interface FollowUpScheduler {
  enqueue(task: FollowUpTask): Promise<boolean>;
}

function channelFor(lead: LeadRecord): FollowUpChannel {
  if (lead.phone) return 'whatsapp';
  if (lead.email) return 'email';
  return 'web';
}

function task(lead: LeadRecord, taskType: FollowUpTaskType, dueAt: string, message?: string): FollowUpTask {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    organizationId: lead.organizationId,
    leadId: lead.id,
    taskType,
    channel: channelFor(lead),
    dueAt,
    status: 'pending',
    attempts: 0,
    payload: message ? { message } : {},
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Turns a deterministic lead decision into durable next actions.
 * Consent is a hard safety boundary: no outbound task is created without it.
 */
export async function planInitialFollowUps(
  scheduler: FollowUpScheduler,
  lead: LeadRecord,
  decision: DecisionResult,
): Promise<number> {
  if (lead.consent === false || decision.action === 'reject') return 0;

  const now = Date.now();
  let scheduled = 0;
  if (await scheduler.enqueue(task(lead, 'instant_response', new Date(now).toISOString()))) scheduled += 1;

  if (decision.action === 'ai-follow-up') {
    if (await scheduler.enqueue(task(lead, 'qualification', new Date(now + 2 * 60_000).toISOString()))) scheduled += 1;
    if (await scheduler.enqueue(task(lead, 'reminder', new Date(now + 24 * 60 * 60_000).toISOString()))) scheduled += 1;
  } else if (decision.action === 'nurture') {
    if (await scheduler.enqueue(task(lead, 'nurture', new Date(now + 3 * 24 * 60 * 60_000).toISOString()))) scheduled += 1;
  } else if (decision.action === 'sdr-follow-up') {
    if (await scheduler.enqueue(task(lead, 'human_handoff', new Date(now).toISOString()))) scheduled += 1;
  }

  return scheduled;
}
