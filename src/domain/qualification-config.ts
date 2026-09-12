export type QualificationConfig = {
  threshold: number;
  weights: {
    serviceFit: number;
    needConfirmed: number;
    decisionMaker: number;
    locationFit: number;
    urgency: number;
    budget: number;
  };
  maxUrgencyDays: number;
  requireDecisionMaker: boolean;
  requireBudget: boolean;
};

export const DEFAULT_QUALIFICATION_CONFIG: QualificationConfig = {
  threshold: 70,
  weights: {
    serviceFit: 25,
    needConfirmed: 20,
    decisionMaker: 20,
    locationFit: 15,
    urgency: 10,
    budget: 10,
  },
  maxUrgencyDays: 14,
  requireDecisionMaker: false,
  requireBudget: false,
};
