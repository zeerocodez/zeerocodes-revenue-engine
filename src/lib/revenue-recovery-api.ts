import type { SdrDisposition, SdrWorkItem } from '../domain/sdr-work-item';
import type { RevenueControlPlaneSnapshot } from '../domain/revenue-control-plane';
import { apiFetch } from './api';

export interface RevenueRecoveryRequest {
  workItemId: string;
  disposition: SdrDisposition;
  ownerId?: string;
  appointmentStatus?: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  appointmentId?: string;
  outcomeRevenue?: number;
  currency?: string;
}

export interface RevenueRecoveryResponse {
  recovery: {
    workItem: SdrWorkItem;
    disposition: SdrDisposition;
    lifecycleState: SdrWorkItem['leadState'];
    transitioned: boolean;
    revenueRecorded: boolean;
    revenueAmount: number;
    duplicateRevenue: boolean;
  };
  controlPlane: RevenueControlPlaneSnapshot;
}

export async function recoverRevenue(input: RevenueRecoveryRequest): Promise<RevenueRecoveryResponse> {
  const response = await apiFetch('/api/revenue/recovery', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({})) as { error?: string; recovery?: RevenueRecoveryResponse['recovery']; controlPlane?: RevenueControlPlaneSnapshot };
  if (!response.ok) throw new Error(payload.error ?? `Revenue recovery failed (${response.status})`);
  if (!payload.recovery || !payload.controlPlane) throw new Error('Revenue recovery response is incomplete');
  return { recovery: payload.recovery, controlPlane: payload.controlPlane };
}
