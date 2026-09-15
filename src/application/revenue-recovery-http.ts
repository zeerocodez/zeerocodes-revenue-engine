import type { Request, Response } from 'express';
import type { AuthenticatedRequestContext } from './request-context';
import { requireRole } from './request-context';
import type { RevenueRecoveryService } from './revenue-recovery-service';

export interface RevenueRecoveryHttpDependencies {
  recovery: RevenueRecoveryService;
  controlPlane: (organizationId: string) => Promise<unknown>;
}

/** HTTP boundary for manager/SDR recovery actions. Tenant comes only from auth context. */
export async function handleRevenueRecovery(
  req: Request & { context?: AuthenticatedRequestContext },
  res: Response,
  dependencies: RevenueRecoveryHttpDependencies,
): Promise<Response> {
  try {
    if (!req.context) throw new Error('Authenticated request context is required');
    const context = req.context;
    requireRole(context, 'agent');

    const result = await dependencies.recovery.recover({
      ...req.body,
      organizationId: context.tenantId,
      ownerId: String(req.body?.ownerId || context.userId),
    });

    return res.json({
      recovery: result,
      controlPlane: await dependencies.controlPlane(context.tenantId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to recover revenue';
    const status = message === 'Tenant access denied' || message === 'Insufficient tenant role' ? 403 : 400;
    return res.status(status).json({ error: message });
  }
}
