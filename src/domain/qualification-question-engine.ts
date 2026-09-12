import type { QualificationProfile } from './qualification';
import type { ClientQualificationPolicy } from './client-policy';

export type QualificationField =
  | 'serviceFit'
  | 'needConfirmed'
  | 'budget'
  | 'urgencyDays'
  | 'decisionMaker'
  | 'locationFit';

export interface QualificationQuestion {
  id: string;
  field: QualificationField;
  prompt: string;
  required: boolean;
  priority: number;
}

export interface QualificationProgress {
  asked: QualificationField[];
  answered: QualificationField[];
  missingRequired: QualificationField[];
  complete: boolean;
  progressPercent: number;
  nextQuestion?: QualificationQuestion;
}

const questions: Record<QualificationField, QualificationQuestion> = {
  serviceFit: {
    id: 'service_fit',
    field: 'serviceFit',
    prompt: 'Is this service what you are looking for?',
    required: true,
    priority: 10,
  },
  needConfirmed: {
    id: 'need_confirmed',
    field: 'needConfirmed',
    prompt: 'What result are you trying to achieve?',
    required: true,
    priority: 20,
  },
  budget: {
    id: 'budget',
    field: 'budget',
    prompt: 'What budget range have you set aside for this?',
    required: false,
    priority: 30,
  },
  urgencyDays: {
    id: 'urgency',
    field: 'urgencyDays',
    prompt: 'When would you like to get started?',
    required: false,
    priority: 40,
  },
  decisionMaker: {
    id: 'decision_maker',
    field: 'decisionMaker',
    prompt: 'Are you the person who will make the final decision?',
    required: false,
    priority: 50,
  },
  locationFit: {
    id: 'location_fit',
    field: 'locationFit',
    prompt: 'What location will the service be delivered in?',
    required: false,
    priority: 60,
  },
};

function answered(profile: QualificationProfile, field: QualificationField): boolean {
  const value = profile[field];
  return value !== undefined && value !== null;
}

function requiredForPolicy(field: QualificationField, policy: ClientQualificationPolicy): boolean {
  if (field === 'serviceFit') return policy.requireServiceFit === true;
  if (field === 'decisionMaker') return policy.requireDecisionMaker === true;
  if (field === 'locationFit') return policy.requireLocationFit === true;
  if (field === 'budget') return policy.minimumBudget != null;
  return field === 'needConfirmed';
}

export function getNextQualificationQuestion(
  profile: QualificationProfile,
  policy: ClientQualificationPolicy,
  asked: QualificationField[] = [],
): QualificationQuestion | undefined {
  const missing = Object.values(questions)
    .filter((question) => !answered(profile, question.field))
    .map((question) => ({ ...question, required: requiredForPolicy(question.field, policy) }))
    .filter((question) => question.required || !asked.includes(question.field))
    .sort((a, b) => (Number(b.required) - Number(a.required)) || a.priority - b.priority);

  return missing[0];
}

export function getQualificationProgress(
  profile: QualificationProfile,
  policy: ClientQualificationPolicy,
  asked: QualificationField[] = [],
): QualificationProgress {
  const fields = Object.keys(questions) as QualificationField[];
  const answeredFields = fields.filter((field) => answered(profile, field));
  const missingRequired = fields.filter((field) => requiredForPolicy(field, policy) && !answered(profile, field));
  const nextQuestion = getNextQualificationQuestion(profile, policy, asked);
  const progressPercent = Math.round((answeredFields.length / fields.length) * 100);

  return {
    asked,
    answered: answeredFields,
    missingRequired,
    complete: missingRequired.length === 0,
    progressPercent,
    nextQuestion,
  };
}

export function qualificationQuestionCatalog(): QualificationQuestion[] {
  return Object.values(questions).map((question) => ({ ...question }));
}
