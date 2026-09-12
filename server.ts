import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConversationService } from './src/application/conversation-service';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { decideConversation } from './src/domain/conversation-decision-engine';
import { scoreLead } from './src/domain/scoring';
import { MemoryConversationStore, MemoryMessageStore } from './src/integrations/memory-messaging';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';
import { MemoryLeadEventStore } from './src/integrations/memory-lead-events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const leadStore = new MemoryLeadStore();
const leadEventStore = new MemoryLeadEventStore();
const revenueEngine = new RevenueEngineService(leadStore, undefined, leadEventStore);
const conversationService = new ConversationService(
  leadStore,
  new MemoryConversationStore(),
  new MemoryMessageStore(),
);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zeerocodes-revenue-engine', mode: 'memory' });
});

app.post('/api/leads/intake', async (req, res) => {
  try {
    const result = await revenueEngine.intake(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid lead intake' });
  }
});

app.get('/api/leads', async (req, res) => {
  const organizationId = String(req.query.organizationId || 'default');
  res.json({ leads: await leadStore.list(organizationId) });
});

app.get('/api/leads/:id', async (req, res) => {
  const lead = await leadStore.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  return res.json({ lead });
});

app.get('/api/leads/:id/events', async (req, res) => {
  const lead = await leadStore.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  return res.json({ events: await leadEventStore.list(req.params.id) });
});

app.get('/api/leads/:id/conversation', async (req, res) => {
  const lead = await leadStore.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  return res.json(await conversationService.getConversation(req.params.id));
});

app.post('/api/leads/:id/messages', async (req, res) => {
  try {
    const lead = await leadStore.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const result = await conversationService.sendMessage({
      leadId: req.params.id,
      organizationId: lead.organizationId,
      body: String(req.body.body || ''),
      channel: req.body.channel,
      actor: req.body.actor,
    });
    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to send message' });
  }
});

app.post('/api/leads/:id/conversation-decision', async (req, res) => {
  try {
    const lead = await leadStore.get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Conversation text is required' });
    const decision = decideConversation({
      text,
      leadScore: scoreLead(lead.profile),
      consent: lead.consent,
      requestedHuman: Boolean(req.body.requestedHuman),
      appointmentBooked: lead.state === 'booked',
      qualificationComplete: Boolean(lead.profile.needConfirmed && lead.profile.serviceFit),
    });
    return res.json({ decision });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to decide conversation action' });
  }
});

app.post('/api/leads/:id/redecide', async (req, res) => {
  try {
    const result = await revenueEngine.redecide(req.params.id);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to redecide lead';
    res.status(message.startsWith('Lead not found') ? 404 : 400).json({ error: message });
  }
});

const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Revenue Engine listening on ${port}`));
