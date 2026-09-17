export type ActivityType = 'call' | 'meeting' | 'task' | 'email' | 'note' | 'sms' | 'whatsapp';
export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

export interface ActivityRecord {
  id: string;
  organizationId: string;
  dealId?: string;
  leadId?: string;
  type: ActivityType;
  title: string;
  description?: string;
  status: ActivityStatus;
  dueAt: string;
  completedAt?: string;
  assignedTo: string;
  assignedToName: string;
  outcome?: string;
  createdAt: string;
}
