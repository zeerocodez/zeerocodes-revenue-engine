export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

export type LeadSource = 'WhatsApp' | 'Instagram' | 'Facebook' | 'Website' | 'Referral';

export type LeadIndustry = 'Home Services' | 'Real Estate' | 'Education' | 'Beauty' | 'Healthcare' | 'Other';

export interface LeadComment {
  id: string;
  text: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  industry: LeadIndustry;
  source: LeadSource;
  status: LeadStatus;
  budgetRange: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  qualificationScore: number; // 0-100
  aiSummary?: string;
  qualificationReasoning?: string;
  comments?: LeadComment[];
}

export type FollowUpType = 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'SMS';

export type FollowUpStatus = 'Upcoming' | 'Overdue' | 'Completed' | 'Missed';

export interface FollowUp {
  id: string;
  organizationId: string;
  leadId: string;
  type: FollowUpType;
  status: FollowUpStatus;
  scheduledAt: string;
  notes?: string;
  outcome?: string;
}

export interface FollowUpInterval {
  minScore: number;
  maxScore: number;
  days: number;
  type: FollowUpType;
}

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  followUpsDue: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  createdAt: string;
}

export type TicketStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed';
export type TicketType = 'Dispute' | 'Billing' | 'Technical' | 'Feedback';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Ticket {
  id: string;
  organizationId: string;
  userId: string;
  leadId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  type: TicketType;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'Charge' | 'Credit' | 'Refund';
export type TransactionStatus = 'Pending' | 'Completed' | 'Failed';

export interface Transaction {
  id: string;
  organizationId: string;
  userId: string;
  leadId?: string;
  amount: number;
  credits?: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: string;
}

export interface ClientRegistration {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  monthlyVolume: string;
  pricingTier: 'Starter' | 'Pro' | 'Enterprise';
  completed: boolean;
}

export interface ClientEmailAccount {
  id: string;
  email: string;
  name: string;
  role?: string;
  active: boolean;
}

export interface EmailSettings {
  enabled: boolean;
  minScore: number;
  templateSubject: string;
  templateBody: string;
  provider: 'Simulated Sandbox' | 'SMTP' | 'Resend';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  resendApiKey?: string;
  resendSender?: string;
  clients: ClientEmailAccount[];
}

export interface TeamMember {
  id: string;
  organizationId: string;
  email: string;
  role: 'Admin' | 'Member';
  addedAt: any;
  addedBy: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  creditBalance: number;
  qualificationRules?: string;
  followUpIntervals?: FollowUpInterval[];
  registration?: ClientRegistration;
  emailSettings?: EmailSettings;
  createdAt: any;
  updatedAt: any;
}
