import { calculateRevenueRecoveryRoi, type RevenueRecoveryRoiResult } from '../domain/revenue-roi';

export interface RevenueRoiSnapshotInput {
  currency: string;
  estimatedRecoverableRevenue: number;
  recoveredRevenue: number;
  totalOpportunityValue?: number;
}

/** Read-only executive ROI boundary for recovered revenue reporting. */
export class RevenueRoiService {
  calculate(input: RevenueRoiSnapshotInput): RevenueRecoveryRoiResult {
    return calculateRevenueRecoveryRoi(input);
  }
}
