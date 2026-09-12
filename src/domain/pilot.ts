export type PilotDay = {
  day: number;
  objective: string;
  operatorAction: string;
  successMetric: string;
};

export const THIRTY_DAY_PILOT: PilotDay[] = [
  { day: 1, objective: 'Baseline', operatorAction: 'Connect lead source, CRM and notification channels; capture baseline speed-to-lead and conversion.', successMetric: 'Baseline accepted by client' },
  { day: 3, objective: 'Response', operatorAction: 'Activate immediate acknowledgement and first follow-up sequence.', successMetric: 'Median first response <= 5 minutes' },
  { day: 7, objective: 'Qualification', operatorAction: 'Tune client qualification rules using real conversations.', successMetric: 'Qualification accuracy >= 85%' },
  { day: 14, objective: 'Routing', operatorAction: 'Route qualified opportunities to SDR/closer with complete context.', successMetric: '>= 90% qualified leads routed correctly' },
  { day: 21, objective: 'Optimization', operatorAction: 'Review loss reasons, objections, no-response and booking performance.', successMetric: 'Top 3 leakage causes identified and treated' },
  { day: 30, objective: 'ROI review', operatorAction: 'Compare baseline vs pilot performance and agree scale/stop decision.', successMetric: 'Positive economic case or explicit stop decision' },
];
