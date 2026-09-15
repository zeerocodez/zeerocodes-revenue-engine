import type { RevenueIntelligenceResult } from './revenue-intelligence-service';
import type { SdrPerformanceResult } from './sdr-performance-service';
import { buildRevenueControlPlane, type RevenueControlPlaneSnapshot } from '../domain/revenue-control-plane';
import type { SdrWorkItem } from '../domain/sdr-work-item';

export interface RevenueControlPlaneServiceInput {
  organizationId: string;
  intelligence: RevenueIntelligenceResult;
  workItems: SdrWorkItem[];
  performance: SdrPerformanceResult[];
  managerEscalationCount?: number;
  now?: string;
}

/** Tenant-scoped application boundary for the revenue manager control plane. */
export class RevenueControlPlaneService {
  calculate(input: RevenueControlPlaneServiceInput): RevenueControlPlaneSnapshot {
    if (!input.organizationId) throw new Error('organizationId is required');

    const invalidItem = input.workItems.find((item) => item.organizationId !== input.organizationId);
    if (invalidItem) throw new Error('Tenant access denied');

    return buildRevenueControlPlane(input);
  }
}
