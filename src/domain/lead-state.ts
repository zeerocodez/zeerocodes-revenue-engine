export const LEAD_STATES = [
  'new',
  'contacting',
  'engaged',
  'qualifying',
  'qualified',
  'booked',
  'won',
  'lost',
  'nurture',
  'invalid',
] as const;

export type LeadState = typeof LEAD_STATES[number];

const transitions: Record<LeadState, readonly LeadState[]> = {
  new: ['contacting', 'nurture', 'invalid'],
  contacting: ['engaged', 'nurture', 'invalid'],
  engaged: ['qualifying', 'nurture', 'lost'],
  qualifying: ['qualified', 'nurture', 'lost'],
  qualified: ['booked', 'lost', 'nurture'],
  booked: ['won', 'lost', 'nurture'],
  won: [],
  lost: ['nurture'],
  nurture: ['contacting', 'qualified', 'lost'],
  invalid: [],
};

export function canTransition(from: LeadState, to: LeadState): boolean {
  return from === to || transitions[from].includes(to);
}

export function transitionLead(from: LeadState, to: LeadState): LeadState {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lead transition: ${from} -> ${to}`);
  }
  return to;
}
