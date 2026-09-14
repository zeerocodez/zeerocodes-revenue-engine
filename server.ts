import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PostgresDatabase } from './src/integrations/postgres';
import { PostgresLeadStore, PostgresConversationStore, PostgresMessageStore, PostgresLeadEventStore, PostgresClientConfigurationStore } from './src/integrations/postgres-repositories';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';
import { MemoryConversationStore } from './src/integrations/memory-conversation';
import { MemoryMessageStore } from './src/integrations/memory-message';
import { MemoryLeadEventStore } from './src/integrations/memory-lead-events';
import { MemoryClientConfigurationStore } from './src/integrations/memory-client-configuration';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { ClientConfigurationService } from './src/application/client-configuration-service';
import { PostgresRevenueWorkflowRepository } from './src/integrations/postgres-workflow';
import { PostgresFollowUpRepository } from './src/integrations/postgres-follow-up';
import { FollowUpWorker, LoggingChannelAdapter } from './src/application/follow-up-worker';
import type { FollowUpChannel } from './src/domain/follow-up';
import { WebhookDispatcher } from './src/integrations/webhook-dispatcher';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(express.json({ limit: '1mb' }));

const db = process.env.DATABASE_URL ? new PostgresDatabase() : undefined;
const leadStore = db ? new PostgresLeadStore(db) : new MemoryLeadStore();
const leadEventStore = db ? new PostgresLeadEventStore(db) : new MemoryLeadEventStore();
const tenantEventRepository = leadEventStore;
const clientConfigurationStore = db ? new PostgresClientConfigurationStore(db) : new MemoryClientConfigurationStore();
const clientConfigurationService = new ClientConfigurationService(clientConfigurationStore);
const workflow = db ? new PostgresRevenueWorkflowRepository(db) : undefined;
const followUpRepository = db ? new PostgresFollowUpRepository(db) : undefined;
const followUpAdapters = new Map<FollowUpChannel, LoggingChannelAdapter>(
  (['whatsapp', 'sms', 'email', 'voice', 'web'] as const).map((channel) => [channel, new LoggingChannelAdapter(channel)]),
);
const followUpWorker = followUpRepository ? new FollowUpWorker(followUpRepository, followUpAdapters) : undefined;
const webhookDispatcher = db ? new WebhookDispatcher(db) : undefined;
const revenueEngine = new RevenueEngineService(leadStore, undefined, leadEventStore, clientConfigurationService, workflow);
const conversationStore = db ? new PostgresConversationStore(db) : new MemoryConversationStore();
const messageStore = db ? new PostgresMessageStore(db) : new MemoryMessageStore();

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/leads/:id', async (req, res) => {
  try {
    const organizationId = String(req.header('x-organization-id') ?? '');
    const lead = await revenueEngine.getLeadForOrganization(req.params.id, organizationId);
    res.json(lead);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const result = await revenueEngine.intake(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/leads/:id/redecide', async (req, res) => {
  try {
    const organizationId = String(req.header('x-organization-id') ?? '');
    const result = await revenueEngine.redecide(req.params.id, organizationId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/webhooks/deliver', async (req, res) => {
  try {
    if (!webhookDispatcher) return res.status(503).json({ error: 'webhook delivery requires DATABASE_URL' });
    const result = await webhookDispatcher.deliverDue(Number(req.body?.limit ?? 25));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/follow-ups/run', async (req, res) => {
  try {
    if (!followUpWorker) return res.status(503).json({ error: 'follow-up worker requires DATABASE_URL' });
    const organizationId = String(req.header('x-organization-id') ?? req.body?.organizationId ?? '');
    const result = await followUpWorker.runOnce(organizationId, Number(req.body?.limit ?? 25));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/conversations/:leadId', async (req, res) => {
  try {
    const conversation = await conversationStore.getByLead(req.params.leadId);
    res.json(conversation);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const messages = await messageStore.list(req.params.conversationId);
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Zeerocodes Revenue Engine listening on ${port}`));
