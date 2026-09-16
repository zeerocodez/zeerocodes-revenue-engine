import type { RevenueControlPlaneSnapshot } from '../domain/revenue-control-plane';
import { apiFetch, readJsonOrThrow } from './api';

export async function fetchRevenueControlPlane(): Promise<RevenueControlPlaneSnapshot> {
  const response = await apiFetch('/api/revenue/control-plane');
  const payload = await readJsonOrThrow<{ controlPlane?: RevenueControlPlaneSnapshot }>(
    response,
    'Revenue control plane request failed',
  );
  if (!payload.controlPlane) throw new Error('Revenue control plane response is empty');
  return payload.controlPlane;
}
