export interface QualificationCriterion {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  weight: number; // Score points contribution (e.g. 25 pts)
  category: 'budget' | 'authority' | 'urgency' | 'location' | 'need' | 'custom';
  qualifyingQuestion: string; // The exact question asked by the 45s AI setter
  thresholdValue?: string | number; // e.g. ₦1,000,000 or "Owner/MD"
}

export interface QualificationPolicyConfig {
  minScore: number;
  criteria: QualificationCriterion[];
  autoBookAppointments: boolean;
  selectedIndustryPreset?: string;
}

export const DEFAULT_QUALIFICATION_CRITERIA: QualificationCriterion[] = [
  {
    id: 'crit_budget',
    name: 'Require Minimum Budget',
    description: '₦500,000+ budget confirmed for service engagement',
    enabled: true,
    weight: 25,
    category: 'budget',
    thresholdValue: '₦500,000',
    qualifyingQuestion: 'What budget range has your organization allocated for this service engagement (e.g. ₦500k - ₦5M+)?',
  },
  {
    id: 'crit_authority',
    name: 'Confirm Decision-Maker Authority',
    description: 'Must be Owner, Founder, Director, MD, Partner, or VP/Head of Department',
    enabled: true,
    weight: 25,
    category: 'authority',
    thresholdValue: 'Owner, MD, Director, C-Level',
    qualifyingQuestion: 'Are you the primary decision-maker or Managing Director authorizing this project?',
  },
  {
    id: 'crit_urgency',
    name: 'Purchase Urgency & Timeline',
    description: 'Target implementation or kickoff required within 7 to 30 days',
    enabled: true,
    weight: 20,
    category: 'urgency',
    thresholdValue: 'Within 30 Days',
    qualifyingQuestion: 'How soon are you looking to kick off this engagement (Immediate, 14 days, or this quarter)?',
  },
  {
    id: 'crit_need',
    name: 'Service Need & Pain Point Alignment',
    description: 'Confirmed operational bottleneck or core need matching our offering',
    enabled: true,
    weight: 20,
    category: 'need',
    thresholdValue: 'High Pain Fit',
    qualifyingQuestion: 'What is the primary operational or revenue bottleneck you need our team to resolve?',
  },
  {
    id: 'crit_location',
    name: 'Serviceable Geographic Zone',
    description: 'Within designated serviceable states, metros, or remote-eligible regions',
    enabled: true,
    weight: 10,
    category: 'location',
    thresholdValue: 'Nationwide / Key Metros',
    qualifyingQuestion: 'Which city or region is your corporate head office or operational site located in?',
  },
];

export const INDUSTRY_CRITERIA_PRESETS: Record<string, { label: string; minBudget: string; criteria: QualificationCriterion[] }> = {
  consulting: {
    label: 'Management & Strategy Consulting',
    minBudget: '₦5,000,000',
    criteria: [
      {
        id: 'crit_budget',
        name: 'Minimum Consulting Retainer Budget',
        description: '₦5,000,000+ corporate advisory budget verified',
        enabled: true,
        weight: 30,
        category: 'budget',
        thresholdValue: '₦5,000,000',
        qualifyingQuestion: 'What budget allocation has been approved for this strategic advisory engagement (e.g. ₦5M - ₦25M)?',
      },
      {
        id: 'crit_authority',
        name: 'C-Level / Board Authority',
        description: 'CEO, COO, CFO, Managing Director, or Board Member',
        enabled: true,
        weight: 30,
        category: 'authority',
        thresholdValue: 'CEO, MD, CFO, Board',
        qualifyingQuestion: 'Are you the CEO, Managing Director, or board-authorized sponsor for external advisory?',
      },
      {
        id: 'crit_company_size',
        name: 'Company Scale (25+ Employees)',
        description: 'Established organization with 25+ headcount or ₦100M+ annual revenue',
        enabled: true,
        weight: 20,
        category: 'custom',
        thresholdValue: '25+ Team Size',
        qualifyingQuestion: 'What is your current team size and operational footprint?',
      },
      {
        id: 'crit_urgency',
        name: 'Mandate Timeline (<30 Days)',
        description: 'Executive restructuring or turnaround mandate required this quarter',
        enabled: true,
        weight: 20,
        category: 'urgency',
        thresholdValue: 'Under 30 Days',
        qualifyingQuestion: 'When does your executive board require this project initiated?',
      },
    ],
  },
  tech_services: {
    label: 'IT Services & Custom Software',
    minBudget: '₦3,000,000',
    criteria: [
      {
        id: 'crit_budget',
        name: 'Custom Development Budget',
        description: '₦3,000,000+ build budget or ₦750,000/mo retainer',
        enabled: true,
        weight: 30,
        category: 'budget',
        thresholdValue: '₦3,000,000',
        qualifyingQuestion: 'What budget is allocated for this engineering sprint or cloud rollout?',
      },
      {
        id: 'crit_authority',
        name: 'Technical Decision Maker',
        description: 'CTO, Founder, Head of Product, or VP Engineering',
        enabled: true,
        weight: 25,
        category: 'authority',
        thresholdValue: 'CTO, Founder, VP Eng',
        qualifyingQuestion: 'Are you the technical founder or product lead directing software architecture?',
      },
      {
        id: 'crit_specs',
        name: 'Documented Technical Scope Ready',
        description: 'Has wireframes, PRD, API documentation, or active repository',
        enabled: true,
        weight: 25,
        category: 'need',
        thresholdValue: 'Specs / PRD Ready',
        qualifyingQuestion: 'Do you have documented architecture specifications or user workflows prepared?',
      },
      {
        id: 'crit_urgency',
        name: 'Sprint Kickoff (<21 Days)',
        description: 'Immediate engineering capacity required within 3 weeks',
        enabled: true,
        weight: 20,
        category: 'urgency',
        thresholdValue: 'Within 21 Days',
        qualifyingQuestion: 'When is your target sprint kick-off date?',
      },
    ],
  },
  financial_advisory: {
    label: 'Financial & Wealth Advisory',
    minBudget: '₦10,000,000',
    criteria: [
      {
        id: 'crit_budget',
        name: 'Asset / Transaction Size',
        description: '₦10,000,000+ transaction size or portfolio under review',
        enabled: true,
        weight: 35,
        category: 'budget',
        thresholdValue: '₦10,000,000',
        qualifyingQuestion: 'What is the estimated portfolio or transaction value under review?',
      },
      {
        id: 'crit_authority',
        name: 'Principal / Accredited Stakeholder',
        description: 'High-Net-Worth Individual, CFO, or Corporate Treasurer',
        enabled: true,
        weight: 35,
        category: 'authority',
        thresholdValue: 'HNWI, CFO, Treasurer',
        qualifyingQuestion: 'Are you the beneficial asset owner or corporate finance director?',
      },
      {
        id: 'crit_need',
        name: 'M&A / Tax Structuring Mandate',
        description: 'Specific capital raise, M&A, or tax governance requirement',
        enabled: true,
        weight: 30,
        category: 'need',
        thresholdValue: 'Formal Mandate',
        qualifyingQuestion: 'What specific structuring outcome is required (Tax, M&A, Audit, or Asset Protection)?',
      },
    ],
  },
  agency: {
    label: 'High-Ticket Marketing Agency',
    minBudget: '₦1,500,000/mo',
    criteria: [
      {
        id: 'crit_budget',
        name: 'Monthly Ad Spend & Retainer',
        description: '₦1,500,000/mo minimum ad budget allocated',
        enabled: true,
        weight: 30,
        category: 'budget',
        thresholdValue: '₦1,500,000/mo',
        qualifyingQuestion: 'What is your current average monthly advertising spend on Meta, Google, or LinkedIn?',
      },
      {
        id: 'crit_authority',
        name: 'CMO, Marketing Director or Founder',
        description: 'Direct authority over marketing budget and agency retainers',
        enabled: true,
        weight: 25,
        category: 'authority',
        thresholdValue: 'Founder, CMO, Head of Growth',
        qualifyingQuestion: 'Are you the Founder or Chief Marketing Officer authorizing agency partnerships?',
      },
      {
        id: 'crit_sales_team',
        name: 'Dedicated Sales Team In Place',
        description: 'Has internal sales reps to close 100+ inbound leads/mo',
        enabled: true,
        weight: 25,
        category: 'custom',
        thresholdValue: 'Sales Closers In Place',
        qualifyingQuestion: 'Do you have an active sales team in place to handle increased qualified pipeline?',
      },
      {
        id: 'crit_urgency',
        name: 'Campaign Launch (<14 Days)',
        description: 'Ready to onboard and launch acquisition campaigns immediately',
        enabled: true,
        weight: 20,
        category: 'urgency',
        thresholdValue: 'Under 14 Days',
        qualifyingQuestion: 'How quickly are you prepared to launch new revenue campaigns?',
      },
    ],
  },
};

export function getTenantQualificationPolicy(tenantId: string): QualificationPolicyConfig {
  const key = `zeero_qualify_policy_${tenantId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.criteria)) {
        return parsed;
      }
    }
  } catch (e) {}

  return {
    minScore: 75,
    criteria: DEFAULT_QUALIFICATION_CRITERIA,
    autoBookAppointments: true,
    selectedIndustryPreset: 'custom',
  };
}

export function saveTenantQualificationPolicy(tenantId: string, policy: QualificationPolicyConfig): void {
  const key = `zeero_qualify_policy_${tenantId}`;
  try {
    localStorage.setItem(key, JSON.stringify(policy));
  } catch (e) {}
}
