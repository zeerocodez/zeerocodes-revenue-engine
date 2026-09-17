import { randomUUID } from 'node:crypto';

export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'queued' | 'ringing' | 'in_progress' | 'completed' | 'busy' | 'failed' | 'no_answer';
export type CallSentiment = 'enthusiastic' | 'positive' | 'neutral' | 'skeptical' | 'hostile';

export interface VoiceCallRecord {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  phoneNumber: string;
  direction: CallDirection;
  status: CallStatus;
  durationSeconds: number;
  recordingUrl?: string;
  transcript: {
    speaker: 'ai' | 'lead';
    text: string;
    timestamp: string;
  }[];
  extractedCriteria: {
    budgetConfirmed?: boolean;
    decisionMakerConfirmed?: boolean;
    timelineDays?: number;
    statedBudget?: number;
  };
  sentiment: CallSentiment;
  closerHandoffRequested: boolean;
  createdAt: string;
  completedAt?: string;
}

export function shouldTriggerInstantVoiceCall(
  leadScore: number,
  dealValue?: number,
  consentGiven: boolean = true
): boolean {
  if (!consentGiven) return false;
  // Trigger immediate AI voice calling if score >= 85 or high-value deal >= ₦2M
  return leadScore >= 85 || (dealValue !== undefined && dealValue >= 2000000);
}
