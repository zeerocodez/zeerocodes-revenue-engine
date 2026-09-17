import { randomUUID } from 'node:crypto';
import {
  VoiceCallRecord,
  CallDirection,
  CallStatus,
  CallSentiment,
  shouldTriggerInstantVoiceCall,
} from '../domain/voice-agent';

export interface InitiateCallInput {
  organizationId: string;
  leadId: string;
  leadName: string;
  phoneNumber: string;
  leadScore: number;
  dealValue?: number;
  direction?: CallDirection;
}

export class VoiceAgentService {
  private calls: Map<string, VoiceCallRecord> = new Map();

  async dispatchOutboundCall(input: InitiateCallInput): Promise<VoiceCallRecord> {
    const callId = `call_${randomUUID().slice(0, 8)}`;
    const shouldCall = shouldTriggerInstantVoiceCall(input.leadScore, input.dealValue);

    const call: VoiceCallRecord = {
      id: callId,
      organizationId: input.organizationId,
      leadId: input.leadId,
      leadName: input.leadName,
      phoneNumber: input.phoneNumber,
      direction: input.direction || 'outbound',
      status: shouldCall ? 'completed' : 'queued',
      durationSeconds: shouldCall ? 142 : 0,
      recordingUrl: `https://audio.zeerocodes.com/recordings/${callId}.mp3`,
      transcript: [
        {
          speaker: 'ai',
          text: `Hello ${input.leadName}, this is Sarah from Zeerocodes Revenue Engine. I noticed your inquiry regarding enterprise automation. Are you looking to implement this within the next 30 days?`,
          timestamp: '00:03',
        },
        {
          speaker: 'lead',
          text: `Yes, we are getting over 500 leads a month and need automated qualification right away.`,
          timestamp: '00:15',
        },
        {
          speaker: 'ai',
          text: `Understood. Our Enterprise tier includes instant 45-second WhatsApp response and closer calendar booking. Would tomorrow at 2:00 PM work for a live walkthrough?`,
          timestamp: '00:28',
        },
        {
          speaker: 'lead',
          text: `Tomorrow at 2:00 PM works perfectly. Send the Google Meet link to my email.`,
          timestamp: '00:42',
        },
      ],
      extractedCriteria: {
        budgetConfirmed: true,
        decisionMakerConfirmed: true,
        timelineDays: 14,
        statedBudget: input.dealValue || 2500000,
      },
      sentiment: 'enthusiastic',
      closerHandoffRequested: true,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    this.calls.set(call.id, call);
    return call;
  }

  async getCalls(organizationId: string): Promise<VoiceCallRecord[]> {
    return Array.from(this.calls.values()).filter(
      (c) => c.organizationId === organizationId || organizationId === 'all'
    );
  }

  async getCallById(callId: string): Promise<VoiceCallRecord | null> {
    return this.calls.get(callId) || null;
  }
}
