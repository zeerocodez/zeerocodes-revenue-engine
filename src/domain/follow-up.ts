export type FollowUpTaskType = 'instant_response' | 'qualification' | 'reminder' | 'nurture' | 'recycle' | 'human_handoff';
export type FollowUpStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
export type FollowUpChannel = 'whatsapp' | 'sms' | 'email' | 'voice' | 'web';

export interface FollowUpTask {
  id: string;
  organizationId: string;
  leadId: string;
  taskType: FollowUpTaskType;
  channel: FollowUpChannel;
  dueAt: string;
  status: FollowUpStatus;
  attempts: number;
  payload?: Record<string, unknown>;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}
