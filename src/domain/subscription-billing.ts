export type SubscriptionPlanId = 'starter' | 'growth' | 'enterprise';

export interface PlanDetails {
  id: SubscriptionPlanId;
  name: string;
  monthlyFeeNgn: number;
  monthlyFeeUsd: number;
  maxMonthlyLeads: number;
  includesVoiceAgent: boolean;
  performanceCommissionPercentage: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter Retainer',
    monthlyFeeNgn: 150000,
    monthlyFeeUsd: 250,
    maxMonthlyLeads: 300,
    includesVoiceAgent: false,
    performanceCommissionPercentage: 3.5,
    features: [
      'Up to 300 active leads/mo',
      'Instant 45s AI WhatsApp & Webhook Triage',
      'Standard Qualification Policy Engine',
      '2 Closer Seats',
      'Email & Slack Support',
    ],
  },
  growth: {
    id: 'growth',
    name: 'Growth Engine',
    monthlyFeeNgn: 350000,
    monthlyFeeUsd: 550,
    maxMonthlyLeads: 1500,
    includesVoiceAgent: true,
    performanceCommissionPercentage: 2.5,
    features: [
      'Up to 1,500 active leads/mo',
      'AI Voice Outbound Telephony Calling',
      'Meta CAPI Closed-Loop ROAS sync',
      'Revenue Leakage Radar & Automated Recovery',
      'Unlimited Closer Seats',
      'Dedicated Account Manager',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Scale',
    monthlyFeeNgn: 850000,
    monthlyFeeUsd: 1200,
    maxMonthlyLeads: 10000,
    includesVoiceAgent: true,
    performanceCommissionPercentage: 1.5,
    features: [
      '10,000+ custom active leads/mo',
      'Custom LLM Fine-Tuning on Brand Scripts',
      'Dedicated Webhook Pipelines & RLS Isolation',
      'Real-Time Omnichannel Voice + WhatsApp',
      '99.9% SLA & 24/7 Priority Support',
    ],
  },
};

export interface TenantUsageSummary {
  organizationId: string;
  currentPlan: SubscriptionPlanId;
  billingCycleStart: string;
  billingCycleEnd: string;
  leadsIngestedCount: number;
  leadsIngestedLimit: number;
  voiceMinutesUsed: number;
  voiceMinutesLimit: number;
  whatsappMessagesSent: number;
  closedWonAttributedRevenue: number;
  commissionPayableNgn: number;
}

export function calculateUsagePercentage(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}
