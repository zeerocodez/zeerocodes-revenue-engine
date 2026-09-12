import type { QualificationProfile } from './qualification';
import { qualifyLead } from './qualification';

export interface LeadScore {
  score: number;
  band: 'cold' | 'warm' | 'hot';
  qualified: boolean;
  reasons: string[];
  hardDisqualified: boolean;
}

export function scoreLead(profile: QualificationProfile): LeadScore {
  const result = qualifyLead(profile);
  const band = result.score >= 80 ? 'hot' : result.score >= 50 ? 'warm' : 'cold';
  return { ...result, band };
}
