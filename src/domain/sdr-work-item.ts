import type { LeadState } from './lead-state';
import type { RevenueActionPlan } from './revenue-action-plan';
import type { LeadIntent } from './lead';

export type SdrWorkAction = 'call-now' | 'call-today' | 'follow-up' | 'recover-sla' | 'handoff-closer' | 'review';
export type SdrDisposition = 'connected' | 'no-answer' | 'callback-requested' | 'qualified' | 'appointment-booked' | 'won' | 'not-qualified' | 'lost' | 'nurture' | 'wrong-number' | 'do-not-contact';

export interface SdrScriptPack {
  opening: string;
  objective: string;
  qualificationQuestions: string[];
  objectionResponses: string[];
  closing: string;
}

export interface SdrWorkItem {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  priorityScore: number;
  priorityBand: RevenueActionPlan['priority']['band'];
  action: SdrWorkAction;
  whyNow: string;
  whyEscalated?: string;
  leadState: LeadState;
  intent?: LeadIntent;
  recommendedAction: string;
  deadlineAt: string;
  slaMinutes: number;
  slaBreached: boolean;
  script: SdrScriptPack;
  dispositionOptions: SdrDisposition[];
  ownerId?: string;
  createdAt: string;
  completedAt?: string;
  disposition?: SdrDisposition;
  outcomeRevenue?: number;
  status: 'open' | 'claimed' | 'completed' | 'cancelled';
}

export interface SdrWorkItemInput {
  organizationId: string;
  leadId: string;
  leadName: string;
  leadState: LeadState;
  intent?: LeadIntent;
  priorityScore: number;
  priorityBand: RevenueActionPlan['priority']['band'];
  nextAction: RevenueActionPlan['nextAction'];
  reason: string;
  slaBreached: boolean;
  now?: string;
  responseSlaMinutes?: number;
  ownerId?: string;
}

const BASE_QUESTIONS = [
  'What exactly are you trying to achieve?',
  'When do you need this solved?',
  'Who will make the final decision?',
  'Have you already set aside a budget for it?',
];

const DISPOSITIONS: SdrDisposition[] = [
  'connected', 'no-answer', 'callback-requested', 'qualified', 'appointment-booked', 'won',
  'not-qualified', 'lost', 'nurture', 'wrong-number', 'do-not-contact',
];

function mapAction(nextAction: RevenueActionPlan['nextAction'], slaBreached: boolean): SdrWorkAction {
  if (nextAction === 'closer-call-now') return 'handoff-closer';
  if (slaBreached) return 'recover-sla';
  if (nextAction === 'sdr-call-now') return 'call-now';
  if (nextAction === 'send-follow-up') return 'follow-up';
  return 'review';
}

function deadline(now: string, minutes: number): string {
  return new Date(Date.parse(now) + minutes * 60000).toISOString();
}

function buildScript(intent?: LeadIntent, action?: SdrWorkAction): SdrScriptPack {
  const objective = action === 'recover-sla'
    ? 'Recover the delayed response, rebuild trust, and determine whether the opportunity is still active.'
    : action === 'handoff-closer'
      ? 'Confirm buying intent and move the opportunity cleanly to the closer.'
      : 'Understand the need, qualify the opportunity, and secure the next commercial step.';

  const objectionResponses = [
    'I understand. Before you decide, can I clarify the one thing that is holding you back?',
    'That makes sense. If we can solve that concern, would you be open to the next step?',
    'No pressure. Would a short call at a better time be more useful?',
  ];

  const opening = intent === 'booking' || action === 'handoff-closer'
    ? 'Hi, this is the team following up on your request. I understand you are looking to move forward, so I wanted to make this quick and useful.'
    : 'Hi, this is the team following up on your enquiry. I want to understand what you need and see if we can help.';

  return {
    opening,
    objective,
    qualificationQuestions: BASE_QUESTIONS,
    objectionResponses,
    closing: 'Based on what you have shared, the best next step is to ____. Does that work for you?',
  };
}

export function createSdrWorkItem(input: SdrWorkItemInput, now = input.now ?? new Date().toISOString()): SdrWorkItem {
  const slaMinutes = Math.max(5, input.responseSlaMinutes ?? (input.priorityBand === 'critical' ? 5 : input.priorityBand === 'high' ? 15 : 60));
  const action = mapAction(input.nextAction, input.slaBreached);
  const whyNow = input.slaBreached
    ? 'Lead response SLA has been breached; recover the opportunity immediately.'
    : input.priorityBand === 'critical'
      ? 'Critical revenue opportunity requires immediate human action.'
      : input.priorityBand === 'high'
        ? 'High-priority opportunity should be worked before lower-value leads.'
        : 'Lead requires a human commercial follow-up.';

  return {
    id: `sdr_${input.leadId}_${Date.parse(now)}`,
    organizationId: input.organizationId,
    leadId: input.leadId,
    leadName: input.leadName,
    priorityScore: input.priorityScore,
    priorityBand: input.priorityBand,
    action,
    whyNow,
    whyEscalated: input.reason,
    leadState: input.leadState,
    intent: input.intent,
    recommendedAction: input.reason,
    deadlineAt: deadline(now, slaMinutes),
    slaMinutes,
    slaBreached: input.slaBreached,
    script: buildScript(input.intent, action),
    dispositionOptions: [...DISPOSITIONS],
    ownerId: input.ownerId,
    createdAt: now,
    status: 'open',
  };
}

export function isSlaAtRisk(item: SdrWorkItem, now = new Date().toISOString()): boolean {
  return Date.parse(now) >= Date.parse(item.deadlineAt) - Math.max(1, item.slaMinutes) * 60000 * 0.5;
}

export function isSlaBreached(item: SdrWorkItem, now = new Date().toISOString()): boolean {
  return Date.parse(now) > Date.parse(item.deadlineAt);
}
