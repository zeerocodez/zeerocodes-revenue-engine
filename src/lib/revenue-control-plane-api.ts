import type { RevenueControlPlaneSnapshot } from '../domain/revenue-control-plane';
import { apiFetch } from './api';

export async function fetchRevenueControlPlane(): Promise<RevenueControlPlaneSnapshot> {
  const response = await apiFetch('/api/revenue/control-plane');
  if (!response.ok) {
    throw new Error(`Revenue control plane request failed (${response.status})`);
  }

  const payload = await response.json() as { controlPlane?: RevenueControlPlaneSnapshot };
  if (!payload.controlPlane) throw new Error('Revenue control plane response is empty');
  return payload.controlPlane;
}
