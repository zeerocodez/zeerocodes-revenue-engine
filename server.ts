import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConversationService } from './src/application/conversation-service';
import { QualificationOrchestrator } from './src/application/qualification-orchestrator';
import { ClientConfigurationService } from './src/application/client-configuration-service';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { MemoryClientConfigurationStore } from './src/integrations/memory-client-configuration';
import { MemoryConversationStore, MemoryMessageStore } from './src/integrations/memory-messaging';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from './src/integrations/memory-lead-events';
import type { ClientConfiguration } from './src/domain/client-configuration';

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
app.use(express.json());
function tenantIdFromRequest(req: express.Request): string {
  const header = req.header('x-tenant-id');
  const query = typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined;
  const tenantId = header || query;
  if (!tenantId) throw new Error('Tenant context is required');
  return tenantId;
}
function tenantError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Tenant access denied';
  return message === 'Tenant access denied' ? 403 : 400;
}
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'zeerocodes-revenue-engine', mode: 'memory', tenancy: 'enabled' }));
app.get('/api/configuration', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); return res.json({ configuration: await clientConfigurationService.get(tenantId) }); } catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Unable to load configuration' }); } });
app.put('/api/configuration', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); const body = req.body as ClientConfiguration; if (body.organizationId && body.organizationId !== tenantId) return res.status(403).json({ error: 'Tenant access denied' }); const configuration = await clientConfigurationService.save({ ...body, organizationId: tenantId }); return res.json({ configuration }); } catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Unable to save configuration' }); } });
app.post('/api/leads/intake', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); if (req.body.organizationId && req.body.organizationId !== tenantId) return res.status(403).json({ error: 'Tenant access denied' }); const result = await revenueEngine.intake({ ...req.body, organizationId: tenantId }); return res.status(201).json(result); } catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Invalid lead intake' }); } });
app.get('/api/leads', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); return res.json({ leads: await leadStore.list(tenantId) }); } catch (error) { return res.status(tenantError(error)).json({ error: error instanceof Error ? error.message : 'Tenant context required' }); } });
app.get('/api/leads/:id', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); return res.json({ lead: await revenueEngine.getLeadForOrganization(req.params.id, tenantId) }); } catch (error) { const message = error instanceof Error ? error.message : 'Lead not found'; return res.status(message === 'Tenant access denied' ? 403 : message.startsWith('Lead not found') ? 404 : 400).json({ error: message }); } });
app.get('/api/leads/:id/events', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); await revenueEngine.getLeadForOrganization(req.params.id, tenantId); return res.json({ events: await leadEventStore.list(req.params.id) }); } catch (error) { const message = error instanceof Error ? error.message : 'Lead not found'; return res.status(message === 'Tenant access denied' ? 403 : message.startsWith('Lead not found') ? 404 : 400).json({ error: message }); } });
app.get('/api/leads/:id/conversation', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); return res.json(await conversationService.getConversation(req.params.id, tenantId)); } catch (error) { const message = error instanceof Error ? error.message : 'Conversation unavailable'; return res.status(message === 'Tenant access denied' ? 403 : 400).json({ error: message }); } });
app.post('/api/leads/:id/messages', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); return res.json(await conversationService.sendMessage({ ...req.body, leadId: req.params.id, organizationId: tenantId })); } catch (error) { const message = error instanceof Error ? error.message : 'Unable to send message'; return res.status(message === 'Tenant access denied' ? 403 : 400).json({ error: message }); } });
app.post('/api/leads/:id/conversation-decision', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); await revenueEngine.getLeadForOrganization(req.params.id, tenantId); const configuration = await clientConfigurationService.get(tenantId); const result = await qualificationOrchestrator.process({ leadId: req.params.id, organizationId: tenantId, text: req.body.message, configuration, policy: configuration.qualification }); return res.json(result); } catch (error) { const message = error instanceof Error ? error.message : 'Unable to process conversation'; return res.status(message === 'Tenant access denied' ? 403 : 400).json({ error: message }); } });
app.post('/api/leads/:id/redecide', async (req, res) => { try { const tenantId = tenantIdFromRequest(req); return res.json(await revenueEngine.redecide(req.params.id, tenantId)); } catch (error) { const message = error instanceof Error ? error.message : 'Unable to redecide lead'; return res.status(message === 'Tenant access denied' ? 403 : message.startsWith('Lead not found') ? 404 : 400).json({ error: message }); } });
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(port, () => console.log(`Zeerocodes Revenue Engine listening on ${port}`));
