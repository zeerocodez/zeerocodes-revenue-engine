import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { ConversationService } from './src/application/conversation-service';
import { QualificationOrchestrator } from './src/application/qualification-orchestrator';
import { ClientConfigurationService } from './src/application/client-configuration-service';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { LeadLifecycleService } from './src/application/lead-lifecycle-service';
import { SdrQueueService } from './src/application/sdr-queue-service';
import { SdrDispositionService } from './src/application/sdr-disposition-service';
import { RevenueRecoveryService } from './src/application/revenue-recovery-service';
import { RevenueLeakageService } from './src/application/revenue-leakage-service';
import { TenantMembershipService } from './src/application/tenant-membership-service';
import { MembershipIdentityResolver, requireRole, type AuthenticatedRequestContext } from './src/application/request-context';
import { SessionIdentityResolver, signSession } from './src/application/session-auth';
import { TenantLeadEventRepositoryImpl } from './src/application/tenant-repository';
import { FollowUpWorker, LoggingChannelAdapter } from './src/application/follow-up-worker';
import { planInitialFollowUps } from './src/application/follow-up-planner';
import { MemoryClientConfigurationStore } from './src/integrations/memory-client-configuration';
import { MemoryConversationStore, MemoryMessageStore } from './src/integrations/memory-messaging';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from './src/integrations/memory-lead-events';
import { MemoryTenantMembershipRepository } from './src/integrations/memory-tenant-membership';
import { MemoryRevenueWorkflowRepository } from './src/integrations/memory-workflow';
import { PostgresDatabase } from './src/integrations/postgres';
import { PostgresTenantMembershipRepository } from './src/integrations/postgres-tenant-membership';
import { PostgresLeadStore, PostgresConversationStore, PostgresMessageStore, PostgresLeadEventStore, PostgresClientConfigurationStore } from './src/integrations/postgres-repositories';
import { PostgresRevenueWorkflowRepository } from './src/integrations/postgres-workflow';
import { PostgresFollowUpRepository } from './src/integrations/postgres-follow-up';
import { PostgresRevenueControlPlaneReader } from './src/integrations/postgres-control-plane';
import { WebhookDispatcher } from './src/integrations/webhooks';
import { runPostgresMigrations } from './src/integrations/postgres-migrations';
import { canTransition, transitionLead } from './src/domain/lead-state';
import { buildRevenueControlPlane } from './src/domain/revenue-control-plane';
import type { ClientConfiguration } from './src/domain/client-configuration';
import type { TenantRole } from './src/domain/tenant';
import type { LeadStore } from './src/application/revenue-engine-service';
import type { LeadEventStore } from './src/domain/lead-events';
import type { LeadOutcomeType } from './src/domain/revenue-workflow';
import type { FollowUpChannel } from './src/domain/follow-up';
import { createAuditRequest, type AuditRequestInput } from './src/domain/audit-request';
import { parseLeadCsv, rowToLeadInput } from './src/domain/lead-source';
import { MemoryAuditRequestStore, type AuditRequestStore } from './src/integrations/memory-audit-requests';
import { PostgresAuditRequestStore } from './src/integrations/postgres-audit-requests';

const app = express(), port = Number(process.env.PORT || 3000), usePostgres = Boolean(process.env.DATABASE_URL);

const db = usePostgres ? new PostgresDatabase() : undefined;
const auditRequestStore: AuditRequestStore = db ? new PostgresAuditRequestStore(db) : new MemoryAuditRequestStore();
const leadStore: LeadStore = db ? new PostgresLeadStore(db) : new MemoryLeadStore();
const leadEventStore: LeadEventStore = db ? new PostgresLeadEventStore(db) : new MemoryLeadEventStore();
const tenantEventRepository = new TenantLeadEventRepositoryImpl(leadEventStore);
const clientConfigurationStore = db ? new PostgresClientConfigurationStore(db) : new MemoryClientConfigurationStore();
const clientConfigurationService = new ClientConfigurationService(clientConfigurationStore);
const workflow = db ? new PostgresRevenueWorkflowRepository(db) : new MemoryRevenueWorkflowRepository();
const followUpRepository = db ? new PostgresFollowUpRepository(db) : undefined;
const revenueControlPlaneReader = db ? new PostgresRevenueControlPlaneReader(db) : undefined;
const followUpAdapters = new Map<FollowUpChannel, LoggingChannelAdapter>(
  (['whatsapp', 'sms', 'email', 'voice', 'web'] as const).map((channel) => [channel, new LoggingChannelAdapter(channel)]),
);
const followUpWorker = followUpRepository ? new FollowUpWorker(followUpRepository, followUpAdapters) : undefined;
const webhookDispatcher = db ? new WebhookDispatcher(db) : undefined;

const lifecycleService = new LeadLifecycleService(leadStore, leadEventStore);
const revenueEngine = new RevenueEngineService(leadStore, undefined, leadEventStore, clientConfigurationService, workflow);
const sdrQueueService = new SdrQueueService(workflow);
const sdrDispositionService = new SdrDispositionService(lifecycleService);
const revenueRecoveryService = new RevenueRecoveryService(workflow, leadStore, lifecycleService, leadEventStore, db);
const revenueLeakageService = new RevenueLeakageService(leadStore, workflow);

const conversationStore = db ? new PostgresConversationStore(db) : new MemoryConversationStore();
const messageStore = db ? new PostgresMessageStore(db) : new MemoryMessageStore();
const conversationService = new ConversationService(leadStore, conversationStore, messageStore);
const qualificationOrchestrator = new QualificationOrchestrator(leadStore, leadEventStore);
const memoryMembershipRepository = new MemoryTenantMembershipRepository();
const postgresMembershipRepository = db ? new PostgresTenantMembershipRepository(db) : undefined;
const membershipRepository = postgresMembershipRepository ?? memoryMembershipRepository;
const membershipService = new TenantMembershipService(membershipRepository);
const headerIdentityResolver = new MembershipIdentityResolver(membershipService);
const sessionIdentityResolver = new SessionIdentityResolver(membershipService);

if (!usePostgres) {
  const tenantId = process.env.DEV_TENANT_ID || 'demo-tenant', userId = process.env.DEV_USER_ID || 'demo-user', role = (process.env.DEV_USER_ROLE || 'owner') as TenantRole;
  const validRoles: TenantRole[] = ['viewer', 'agent', 'manager', 'admin', 'owner'];
  if (!validRoles.includes(role)) throw new Error('Invalid DEV_USER_ROLE');
  memoryMembershipRepository.seedTenant({ id: tenantId, name: 'Demo Tenant', slug: 'demo-tenant', status: 'active', createdAt: new Date().toISOString() });
  memoryMembershipRepository.seedMembership({ id: `membership_${userId}_${tenantId}`, userId, tenantId, email: process.env.DEV_USER_EMAIL || 'demo@example.com', role, active: true, createdAt: new Date().toISOString() });
}

app.use(express.json({ limit: '2mb' }));
type RequestWithContext = express.Request & { context?: AuthenticatedRequestContext };
function contextOf(req: RequestWithContext): AuthenticatedRequestContext {
  if (!req.context) throw new Error('Authenticated request context is required');
  return req.context;
}
function tenantError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed';
  if (message === 'Tenant access denied' || message === 'Insufficient tenant role') return 403;
  if (message.includes('membership') || message === 'Tenant is suspended' || message === 'Tenant not found') return 403;
  if (message.includes('not found') || message.startsWith('Lead not found') || message.startsWith('SDR work item not found')) return 404;
  if (message.includes('already completed') || message.includes('already belongs') || message.includes('claimed by another')) return 409;
  return 400;
}

// Public endpoints (no auth required)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'zeerocodes-revenue-engine', mode: usePostgres ? 'postgres' : 'memory', workflow: 'lead-to-revenue', rls: usePostgres }));
app.post('/api/auth/dev-session', (req, res) => {
  const tenantId = String(req.body?.tenantId || process.env.DEV_TENANT_ID || 'demo-tenant');
  const userId = String(req.body?.userId || process.env.DEV_USER_ID || 'demo-user');
  return res.json({ token: signSession(userId, tenantId), tenantId, userId });
});

app.post('/api/public/audit-requests', async (req, res) => {
  try {
    const input = req.body as AuditRequestInput;
    const auditRequest = createAuditRequest(input, `audit_${randomUUID()}`);
    await auditRequestStore.create(auditRequest);
    return res.status(201).json({ auditRequest, message: 'Audit request received successfully' });
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : 'Invalid audit request submission' });
  }
});

app.get('/api/public/audit-requests', async (_req, res) => {
  try {
    const requests = await auditRequestStore.list();
    return res.json({ auditRequests: requests });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to fetch audit requests' });
  }
});

// Authenticated API Middleware
async function authMiddleware(req: RequestWithContext, res: express.Response, next: express.NextFunction) {
  try {
    let context: AuthenticatedRequestContext;
    const bearer = req.header('authorization');
    if (bearer?.startsWith('Bearer ')) {
      context = await sessionIdentityResolver.resolveBearer(bearer.slice(7));
    } else if (process.env.NODE_ENV !== 'production') {
      const userId = req.header('x-user-id'), tenantId = req.header('x-tenant-id');
      if (!userId || !tenantId) return res.status(401).json({ error: 'Bearer session required' });
      context = await headerIdentityResolver.resolve({ userId, tenantId });
    } else {
      return res.status(401).json({ error: 'Bearer session required' });
    }
    req.context = context;
    if (db) {
      const transaction = await db.beginRequestTenant(context.tenantId);
      db.runRequestContext(context.tenantId, transaction.client, () => {
        let settled = false;
        const finish = async () => {
          if (settled) return;
          settled = true;
          await transaction.finish(res.statusCode < 500);
        };
        res.on('finish', () => { void finish(); });
        next();
      });
      return;
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: error instanceof Error ? error.message : 'Authentication failed' });
  }
}
app.use('/api', authMiddleware);

// Client Configuration
app.get('/api/configuration', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json({ configuration: await clientConfigurationService.get(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to load configuration' });
  }
});
app.put('/api/configuration', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'admin');
    return res.json({ configuration: await clientConfigurationService.save({ ...(req.body as ClientConfiguration), organizationId: c.tenantId }) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to save configuration' });
  }
});

// Leads & Lifecycle
app.post('/api/leads/intake', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const result = await revenueEngine.intake({ ...req.body, organizationId: c.tenantId });
    if (followUpRepository) await planInitialFollowUps(followUpRepository, result.lead, result.decision);
    if (webhookDispatcher) await webhookDispatcher.enqueue({ id: randomUUID(), organizationId: c.tenantId, type: 'lead.created', occurredAt: new Date().toISOString(), payload: { lead: result.lead, decision: result.decision } });
    return res.status(201).json(result);
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Invalid lead intake' });
  }
});
app.get('/api/leads', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json({ leads: await leadStore.list(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to list leads' });
  }
});
app.get('/api/leads/:id', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json({ lead: await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Lead not found' });
  }
});
app.get('/api/leads/:id/events', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    return res.json({ events: await tenantEventRepository.listForTenant(req.params.id, c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Lead not found' });
  }
});
app.get('/api/leads/:id/conversation', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json(await conversationService.getConversation(req.params.id, c.tenantId));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Conversation unavailable' });
  }
});
app.post('/api/leads/:id/messages', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    return res.json(await conversationService.sendMessage({ ...req.body, leadId: req.params.id, organizationId: c.tenantId }));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to send message' });
  }
});
app.post('/api/leads/:id/conversation-decision', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    const configuration = await clientConfigurationService.get(c.tenantId);
    return res.json(await qualificationOrchestrator.process({ leadId: req.params.id, organizationId: c.tenantId, text: req.body.message, configuration, policy: configuration.qualification }));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to process conversation' });
  }
});
app.post('/api/leads/:id/redecide', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    return res.json(await revenueEngine.redecide(req.params.id, c.tenantId));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to redecide lead' });
  }
});

// Follow-ups
app.post('/api/follow-ups/run', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    if (!followUpWorker) return res.status(503).json({ error: 'Follow-up worker requires PostgreSQL' });
    return res.json(await followUpWorker.runOnce(c.tenantId, Math.min(Number(req.body?.limit || 25), 100)));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to run follow-ups' });
  }
});

// Appointments & Outcomes
app.post('/api/leads/:id/appointments', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const lead = await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    const idempotencyKey = req.header('idempotency-key')?.trim();
    if (idempotencyKey) {
      const existing = await workflow.findAppointmentByIdempotency(c.tenantId, idempotencyKey);
      if (existing) {
        if (existing.leadId !== lead.id) throw new Error('Idempotency key already belongs to another lead');
        return res.status(200).json({ appointment: existing, lead });
      }
    }
    if (!['qualified', 'nurture'].includes(lead.state)) throw new Error('Lead must be qualified before booking');
    const scheduledAt = new Date(req.body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new Error('Invalid scheduledAt');
    const now = new Date().toISOString();
    const previousState = lead.state;
    const nextState = transitionLead(previousState, 'booked');
    const appointment = { id: randomUUID(), organizationId: c.tenantId, leadId: lead.id, scheduledAt: scheduledAt.toISOString(), status: 'scheduled' as const, ownerUserId: c.userId, source: req.body.source, idempotencyKey, metadata: req.body.metadata, createdAt: now, updatedAt: now };
    await workflow.saveAppointment(appointment);
    lead.state = nextState;
    lead.updatedAt = now;
    await leadStore.save(lead);
    await leadEventStore.append({ id: randomUUID(), leadId: lead.id, organizationId: c.tenantId, type: 'lead.booked', actor: 'sdr', timestamp: now, fromState: previousState, toState: nextState, reason: 'appointment booked', metadata: { appointmentId: appointment.id, idempotencyKey } });
    if (webhookDispatcher) await webhookDispatcher.enqueue({ id: randomUUID(), organizationId: c.tenantId, type: 'appointment.booked', occurredAt: now, payload: { lead, appointment } });
    return res.status(201).json({ appointment, lead });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to book appointment' });
  }
});
app.get('/api/leads/:id/appointments', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    return res.json({ appointments: await workflow.listAppointments(c.tenantId, req.params.id) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to load appointments' });
  }
});
app.post('/api/leads/:id/outcome', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    const lead = await revenueEngine.getLeadForOrganization(req.params.id, c.tenantId);
    const outcome = req.body.outcome as LeadOutcomeType;
    if (!['won', 'lost', 'no_sale', 'no_show', 'cancelled', 'unqualified'].includes(outcome)) throw new Error('Invalid outcome');
    const idempotencyKey = req.header('idempotency-key')?.trim();
    if (idempotencyKey) {
      const existing = await workflow.findOutcomeByIdempotency(c.tenantId, idempotencyKey);
      if (existing) {
        if (existing.leadId !== lead.id) throw new Error('Idempotency key already belongs to another lead');
        return res.status(200).json({ lead, outcome: existing });
      }
    }
    const now = new Date().toISOString();
    const outcomeRecord = { id: randomUUID(), organizationId: c.tenantId, leadId: lead.id, outcome, revenueAmount: typeof req.body.revenueAmount === 'number' ? req.body.revenueAmount : null, currency: req.body.currency || 'NGN', reason: req.body.reason, ownerUserId: c.userId, idempotencyKey, occurredAt: now, metadata: req.body.metadata };
    const previousState = lead.state;
    const targetState = outcome === 'won' ? 'won' : outcome === 'no_show' || outcome === 'cancelled' ? 'nurture' : 'lost';
    if (!canTransition(previousState, targetState)) throw new Error(`Outcome ${outcome} cannot move lead from ${previousState} to ${targetState}`);
    const nextState = transitionLead(previousState, targetState);
    await workflow.saveOutcome(outcomeRecord);
    lead.state = nextState;
    lead.updatedAt = now;
    await leadStore.save(lead);
    await leadEventStore.append({ id: randomUUID(), leadId: lead.id, organizationId: c.tenantId, type: outcome === 'won' ? 'lead.won' : 'lead.lost', actor: 'closer', timestamp: now, fromState: previousState, toState: nextState, reason: outcomeRecord.reason || outcome, metadata: { outcomeId: outcomeRecord.id, revenueAmount: outcomeRecord.revenueAmount, idempotencyKey } });
    if (outcome === 'won' && outcomeRecord.revenueAmount) {
      await workflow.saveAttribution({ id: randomUUID(), organizationId: c.tenantId, leadId: lead.id, outcomeId: outcomeRecord.id, source: lead.source, campaign: String(lead.metadata?.campaign || ''), medium: String(lead.metadata?.medium || ''), attributionModel: 'first_touch', attributedAmount: outcomeRecord.revenueAmount, currency: outcomeRecord.currency, createdAt: now });
    }
    if (webhookDispatcher) await webhookDispatcher.enqueue({ id: randomUUID(), organizationId: c.tenantId, type: 'lead.outcome', occurredAt: now, payload: { lead, outcome: outcomeRecord } });
    return res.json({ lead, outcome: outcomeRecord });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to record outcome' });
  }
});

// SDR Queue & Dispositions
app.get('/api/sdr/queue', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json(await sdrQueueService.queue(c.tenantId));
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to load SDR queue' });
  }
});
app.post('/api/sdr/work-items', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const item = await sdrQueueService.enqueue({ ...req.body, organizationId: c.tenantId });
    return res.status(201).json({ workItem: item });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to create work item' });
  }
});
app.post('/api/sdr/work-items/:id/claim', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const item = await sdrQueueService.claim(c.tenantId, req.params.id, c.userId);
    return res.json({ workItem: item });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to claim work item' });
  }
});
app.post('/api/sdr/work-items/:id/disposition', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const item = await workflow.getSdrWorkItem(c.tenantId, req.params.id);
    if (!item) throw new Error('SDR work item not found');
    const disposition = req.body.disposition;
    const dispositionResult = await sdrDispositionService.apply({
      organizationId: c.tenantId,
      item,
      disposition,
      appointmentId: req.body.appointmentId,
      appointmentStatus: req.body.appointmentStatus,
      qualification: req.body.qualification,
    });
    const completedItem = await sdrQueueService.complete(c.tenantId, req.params.id, disposition, c.userId, req.body.outcomeRevenue);
    return res.json({ workItem: completedItem, lifecycle: dispositionResult });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to apply disposition' });
  }
});

// Revenue Recovery & Leakage Engine
app.post('/api/revenue/recovery', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const idempotencyKey = req.header('idempotency-key')?.trim();
    const result = await revenueRecoveryService.executeRecovery({
      organizationId: c.tenantId,
      workItemId: req.body.workItemId,
      recoveredAmount: Number(req.body.recoveredAmount),
      currency: req.body.currency,
      ownerUserId: c.userId,
      idempotencyKey,
      notes: req.body.notes,
    });
    return res.status(result.idempotentReplay ? 200 : 201).json(result);
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Revenue recovery failed' });
  }
});
app.get('/api/revenue/recovery/attributions', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json({ attributions: await workflow.listRecoveryAttributions(c.tenantId, req.query.leadId as string | undefined) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to load recovery attributions' });
  }
});
app.get('/api/revenue/leakage', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    return res.json({ leakages: await revenueLeakageService.listActiveLeakage(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to list leakage' });
  }
});
app.post('/api/revenue/leakage/detect', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    const summary = await revenueLeakageService.detectAndSyncTenantLeakage(c.tenantId);
    return res.json(summary);
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Leakage detection failed' });
  }
});

// Revenue Ledger & Control Plane
app.get('/api/revenue/usage', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    return res.json({ usage: await workflow.usageSummary(c.tenantId) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to load usage' });
  }
});
app.get('/api/revenue/control-plane', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    if (revenueControlPlaneReader) {
      return res.json({ controlPlane: await revenueControlPlaneReader.calculate(c.tenantId) });
    }
    // In-memory fallback calculation
    const leads = await leadStore.list(c.tenantId);
    const workItems = await workflow.listSdrWorkItems(c.tenantId);
    const recoveries = await workflow.listRecoveryAttributions(c.tenantId);
    const leakages = await workflow.listLeakageOpportunities(c.tenantId, 'active');
    const totalRecovered = recoveries.reduce((sum, r) => sum + r.recoveredAmount, 0);

    const snapshot = buildRevenueControlPlane({
      organizationId: c.tenantId,
      intelligence: {
        funnel: {
          leads: leads.length,
          contacted: leads.filter((l) => l.state !== 'new').length,
          engaged: leads.filter((l) => ['engaged', 'qualifying', 'qualified', 'booked', 'won'].includes(l.state)).length,
          qualified: leads.filter((l) => ['qualified', 'booked', 'won'].includes(l.state)).length,
          booked: leads.filter((l) => ['booked', 'won'].includes(l.state)).length,
          won: leads.filter((l) => l.state === 'won').length,
          revenue: totalRecovered,
          currency: 'NGN',
        },
        contactRate: leads.length > 0 ? (leads.filter((l) => l.state !== 'new').length / leads.length) * 100 : 0,
        qualificationRate: leads.length > 0 ? (leads.filter((l) => ['qualified', 'booked', 'won'].includes(l.state)).length / leads.length) * 100 : 0,
        bookingRate: 0,
        closeRate: 0,
        revenuePerLead: leads.length > 0 ? totalRecovered / leads.length : 0,
        revenueRecovered: totalRecovered,
        attributedRevenue: totalRecovered,
      },
      workItems,
      performance: [],
      leakageOpportunities: leakages,
    });
    return res.json({ controlPlane: snapshot });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to calculate revenue control plane' });
  }
});
app.get('/api/revenue/control-plane/latest', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'manager');
    if (revenueControlPlaneReader) {
      return res.json({ controlPlane: await revenueControlPlaneReader.latest(c.tenantId) });
    }
    return res.json({ controlPlane: null });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to load revenue control plane' });
  }
});
app.post('/api/webhooks/deliver', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'admin');
    if (!webhookDispatcher) return res.status(503).json({ error: 'Webhook delivery requires PostgreSQL' });
    return res.json({ delivered: await webhookDispatcher.deliverPending(Number(req.body?.limit || 20)) });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Unable to deliver webhooks' });
  }
});

app.get('/api/audit-requests', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'viewer');
    const requests = await auditRequestStore.list();
    return res.json({ auditRequests: requests });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Failed to fetch audit requests' });
  }
});

app.post('/api/leads/import-csv', async (req: RequestWithContext, res) => {
  try {
    const c = contextOf(req);
    requireRole(c, 'agent');
    const { csv, source = 'csv-import' } = (req.body || {}) as { csv?: string; source?: string };
    if (typeof csv !== 'string' || !csv.trim()) {
      return res.status(400).json({ error: 'Valid CSV string is required' });
    }
    const rows = parseLeadCsv(csv);
    let accepted = 0;
    let rejected = 0;
    const errors: Array<{ row: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const leadInput = rowToLeadInput(rows[i], c.tenantId, source);
        await revenueEngine.intake(leadInput);
        accepted++;
      } catch (err) {
        rejected++;
        errors.push({ row: i + 1, message: err instanceof Error ? err.message : 'Intake failed' });
      }
    }

    return res.json({
      total: rows.length,
      accepted,
      rejected,
      duplicates: 0,
      errors,
    });
  } catch (e) {
    return res.status(tenantError(e)).json({ error: e instanceof Error ? e.message : 'Failed to import CSV' });
  }
});

if (!process.env.VERCEL) {
  const staticDist = path.resolve(process.cwd(), 'dist');
  app.use(express.static(staticDist));
  app.get('*', (_req, res) => res.sendFile(path.join(staticDist, 'index.html')));
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  return res.status(500).json({ error: message });
});

async function start() {
  if (usePostgres) {
    await runPostgresMigrations(db!);
  }
  app.listen(port, () => console.log(`Zeerocodes Revenue Engine listening on ${port}`));
}

const isDirectExecution = typeof process.argv[1] === 'string' && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.cjs') ||
  process.argv[1].endsWith('server.js')
);

if (isDirectExecution && !process.env.VERCEL) {
  void start();
}

export { app, start };
export default app;

