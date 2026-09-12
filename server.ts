import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConversationService } from './src/application/conversation-service';
import { QualificationOrchestrator } from './src/application/qualification-orchestrator';
import { ClientConfigurationService } from './src/application/client-configuration-service';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { TenantMembershipService } from './src/application/tenant-membership-service';
import { MembershipIdentityResolver, requireRole, type AuthenticatedRequestContext } from './src/application/request-context';
import { MemoryClientConfigurationStore } from './src/integrations/memory-client-configuration';
import { MemoryConversationStore, MemoryMessageStore } from './src/integrations/memory-messaging';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from './src/integrations/memory-lead-events';
import { MemoryTenantMembershipRepository } from './src/integrations/memory-tenant-membership';
import type { ClientConfiguration } from './src/domain/client-configuration';
import type { TenantRole } from './src/domain/tenant';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const leadStore = new MemoryLeadStore();
const leadEventStore = new MemoryLeadEventStore();
const clientConfigurationStore = new MemoryClientConfigurationStore();
const clientConfigurationService = new ClientConfigurationService(clientConfigurationStore);
const revenueEngine = new RevenueEngineService(leadStore, undefined, leadEventStore, clientConfigurationService);
const conversationService = new ConversationService(leadStore, new MemoryConversationStore(), new MemoryMessageStore());
const qualificationOrchestrator = new QualificationOrchestrator(leadStore, leadEventStore);
const membershipRepository = new MemoryTenantMembershipRepository();
const membershipService = new TenantMembershipService(membershipRepository);
const identityResolver = new MembershipIdentityResolver(membershipService);

// Development bootstrap only. Production must replace this repository with persistent membership storage.
if (process.env.NODE_ENV !== 'production') {
  const tenantId = process.env.DEV_TENANT_ID || 'demo-tenant';
  const userId = process.env.DEV_USER_ID || 'demo-user';
  const role = (process.env.DEV_USER_ROLE || 'owner') as TenantRole;
  const validRoles: TenantRole[] = ['viewer', 'agent', 'manager', 'admin', 'owner'];
  if (!validRoles.includes(role)) throw new Error('Invalid DEV_USER_ROLE');
  membershipRepository.seedTenant({ id: tenantId, name: 'Demo Tenant', slug: 'demo-tenant', status: 'active', createdAt: new Date().toISOString() });
  membershipRepository.seedMembership({ id: `membership_${userId}_${tenantId}`, userId, tenantId, email: process.env.DEV_USER_EMAIL || 'demo@example.com', role, active: true, createdAt: new Date().toISOString() });
}

app.use(express.json());
type RequestWithContext = express.Request & { context?: AuthenticatedRequestContext };

function authMiddleware(req: RequestWithContext, res: express.Response, next: express.NextFunction) {
  const userId = req.header('x-user-id');
  const tenantId = req.header('x-tenant-id');
  if (!userId || !tenantId) return res.status(401).json({ error: 'Authenticated user and tenant context are required' });
  void identityResolver.resolve({ userId, tenantId }).then((context) => {
    req.context = context;
    next();
  }).catch((error) => res.status(401).json({ error: error instanceof Error ? error.message : 'Authentication failed' }));
}

function contextOf(req: RequestWithContext): AuthenticatedRequestContext {
  if (!req.context) throw new Error('Authenticated request context is required');
  return req.context;
}

function tenantError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Request failed';
  if (message === 'Tenant access denied' || message === 'Insufficient tenant role') return 403;
  if (message === 'Tenant membership not found' || message === 'Tenant membership is inactive' || message === 'Tenant is suspended' || message === 'Tenant not found') return 403;
  return 400;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'zeerocodes-revenue-engine', mode: 'memory', tenancy: 'membership-backed' }));
app.use('/api', authMiddleware);

app.get('/api/configuration', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'viewer'); return res.json({ configuration: await clientConfigurationService.get(context.tenantId) }); }
  catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Unable to load configuration' }); }
});

app.put('/api/configuration', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'admin'); const body = req.body as ClientConfiguration; return res.json({ configuration: await clientConfigurationService.save({ ...body, organizationId: context.tenantId }) }); }
  catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Unable to save configuration' }); }
});

app.post('/api/leads/intake', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'agent'); const result = await revenueEngine.intake({ ...req.body, organizationId: context.tenantId }); return res.status(201).json(result); }
  catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Invalid lead intake' }); }
});

app.get('/api/leads', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'viewer'); return res.json({ leads: await leadStore.list(context.tenantId) }); }
  catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Unable to list leads' }); }
});

app.get('/api/leads/:id', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'viewer'); return res.json({ lead: await revenueEngine.getLeadForOrganization(req.params.id, context.tenantId) }); }
  catch (error) { const message = error instanceof Error ? error.message : 'Lead not found'; return res.status(message === 'Tenant access denied' ? 403 : message.startsWith('Lead not found') ? 404 : tenantError(error)).json({ error: message }); }
});

app.get('/api/leads/:id/events', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'viewer'); await revenueEngine.getLeadForOrganization(req.params.id, context.tenantId); return res.json({ events: await leadEventStore.list(req.params.id) }); }
  catch (error) { const message = error instanceof Error ? error.message : 'Lead not found'; return res.status(message === 'Tenant access denied' ? 403 : message.startsWith('Lead not found') ? 404 : tenantError(error)).json({ error: message }); }
});

app.get('/api/leads/:id/conversation', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'viewer'); return res.json(await conversationService.getConversation(req.params.id, context.tenantId)); }
  catch (error) { const message = error instanceof Error ? error.message : 'Conversation unavailable'; return res.status(message === 'Tenant access denied' ? 403 : tenantError(error)).json({ error: message }); }
});

app.post('/api/leads/:id/messages', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'agent'); return res.json(await conversationService.sendMessage({ ...req.body, leadId: req.params.id, organizationId: context.tenantId })); }
  catch (error) { const message = error instanceof Error ? error.message : 'Unable to send message'; return res.status(message === 'Tenant access denied' ? 403 : tenantError(error)).json({ error: message }); }
});

app.post('/api/leads/:id/conversation-decision', async (req: RequestWithContext, res) => {
  try {
    const context = contextOf(req); requireRole(context, 'agent');
    await revenueEngine.getLeadForOrganization(req.params.id, context.tenantId);
    const configuration = await clientConfigurationService.get(context.tenantId);
    return res.json(await qualificationOrchestrator.process({ leadId: req.params.id, organizationId: context.tenantId, text: req.body.message, configuration, policy: configuration.qualification }));
  } catch (error) { const message = error instanceof Error ? error.message : 'Unable to process conversation'; return res.status(message === 'Tenant access denied' ? 403 : tenantError(error)).json({ error: message }); }
});

app.post('/api/leads/:id/redecide', async (req: RequestWithContext, res) => {
  try { const context = contextOf(req); requireRole(context, 'manager'); return res.json(await revenueEngine.redecide(req.params.id, context.tenantId)); }
  catch (error) { const message = error instanceof Error ? error.message : 'Unable to redecide lead'; return res.status(message === 'Tenant access denied' ? 403 : message.startsWith('Lead not found') ? 404 : tenantError(error)).json({ error: message }); }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log(`Zeerocodes Revenue Engine listening on ${port}`));
