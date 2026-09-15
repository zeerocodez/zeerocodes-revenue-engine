import type { SdrWorkItem } from '../domain/sdr-work-item';

/** Persistence-neutral dependency contract for future server composition. */
export interface RevenueRecoveryDependencies {
  workItems: SdrWorkItem[];
}

export function createRevenueRecoveryDependencies(workItems: SdrWorkItem[]): RevenueRecoveryDependencies {
  return { workItems };
}
