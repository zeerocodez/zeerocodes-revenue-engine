import type { ClientQualificationPolicy } from './client-policy';
import { DEFAULT_CLIENT_POLICY } from './client-policy';

export type ConversationChannel = 'whatsapp' | 'sms' | 'email' | 'voice' | 'web';
export type HandoffTarget = 'ai' | 'sdr' | 'closer';

export interface ClientScoringConfig {
  threshold: number;
  hotScore: number;
  warmScore: number;
  weights: {
    serviceFit: number;
    needConfirmed: number;
    decisionMaker: number;
    locationFit: number;
    urgency: number;
    budget: number;
  };
}

export interface ClientConversationConfig {
  allowedChannels: ConversationChannel[];
  workingHours?: { timezone: string; start: string; end: string };
  handoffOnHumanRequest: HandoffTarget;
  handoffOnComplaint: HandoffTarget;
  handoffOnBooking: HandoffTarget;
  maxAiMessagesBeforeHumanHandoff: number;
}

export interface ClientConfiguration {
  organizationId: string;
  qualification: ClientQualificationPolicy;
  scoring: ClientScoringConfig;
  conversation: ClientConversationConfig;
  acceptedServiceTypes: string[];
  locations: string[];
  version: number;
  active: boolean;
  updatedAt: string;
}

export const DEFAULT_CLIENT_CONFIGURATION: Omit<ClientConfiguration, 'organizationId' | 'updatedAt'> = {
  qualification: DEFAULT_CLIENT_POLICY,
  scoring: {
    threshold: 70,
    hotScore: 80,
    warmScore: 50,
    weights: {
      serviceFit: 25,
      needConfirmed: 20,
      decisionMaker: 15,
      locationFit: 10,
      urgency: 15,
      budget: 15,
    },
  },
  conversation: {
    allowedChannels: ['whatsapp', 'sms', 'email', 'voice', 'web'],
    handoffOnHumanRequest: 'sdr',
    handoffOnComplaint: 'sdr',
    handoffOnBooking: 'closer',
    maxAiMessagesBeforeHumanHandoff: 8,
  },
  acceptedServiceTypes: [],
  locations: [],
  version: 1,
  active: true,
};

export function createDefaultClientConfiguration(organizationId: string, now = new Date().toISOString()): ClientConfiguration {
  return {
    ...structuredClone(DEFAULT_CLIENT_CONFIGURATION),
    organizationId,
    updatedAt: now,
  };
}

export function validateClientConfiguration(config: ClientConfiguration): void {
  if (!config.organizationId.trim()) throw new Error('organizationId is required');
  if (config.qualification.qualificationThreshold < 0 || config.qualification.qualificationThreshold > 100) {
    throw new Error('qualification threshold must be between 0 and 100');
  }
  if (config.scoring.hotScore < config.scoring.warmScore) throw new Error('hot score must be >= warm score');
  if (config.conversation.maxAiMessagesBeforeHumanHandoff < 1) throw new Error('AI message limit must be at least 1');
  if (config.conversation.allowedChannels.length === 0) throw new Error('at least one conversation channel is required');
}

export interface ClientConfigurationStore {
  get(organizationId: string): Promise<ClientConfiguration | null>;
  save(configuration: ClientConfiguration): Promise<void>;
}
