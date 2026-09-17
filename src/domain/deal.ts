export type DealStage = 
  | 'discovery'
  | 'qualification'
  | 'demo_scheduled'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface DealRecord {
  id: string;
  organizationId: string;
  title: string;
  leadId?: string;
  contactName: string;
  companyName: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number; // 0 - 100%
  ownerId: string;
  ownerName: string;
  expectedCloseDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const DEAL_STAGES_CONFIG: { id: DealStage; label: string; color: string; probability: number }[] = [
  { id: 'discovery', label: 'Discovery / Inbound', color: '#0284c7', probability: 20 },
  { id: 'qualification', label: 'AI Qualified', color: '#7c3aed', probability: 40 },
  { id: 'demo_scheduled', label: 'Meeting / Demo', color: '#2563eb', probability: 60 },
  { id: 'proposal_sent', label: 'Proposal Sent', color: '#d97706', probability: 75 },
  { id: 'negotiation', label: 'Negotiation', color: '#ea580c', probability: 90 },
  { id: 'closed_won', label: 'Closed Won 🎉', color: '#16a34a', probability: 100 },
  { id: 'closed_lost', label: 'Closed Lost', color: '#dc2626', probability: 0 },
];
