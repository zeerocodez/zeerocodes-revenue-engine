import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RevenueEngineService } from './src/application/revenue-engine-service';
import { MemoryLeadStore } from './src/integrations/memory-lead-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const leadStore = new MemoryLeadStore();
const revenueEngine = new RevenueEngineService(leadStore);

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
