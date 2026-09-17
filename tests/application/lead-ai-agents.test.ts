import { describe, expect, it } from 'vitest';
import { LeadAIAgentOrchestrator, LeadQualificationAgent, LeadResponseAgent } from '../../src/application/lead-ai-agents';
import { QualificationOrchestrator } from '../../src/application/qualification-orchestrator';
import { ConversationService } from '../../src/application/conversation-service';
import { MemoryConversationStore, MemoryMessageStore } from '../../src/integrations/memory-messaging';
import { MemoryLeadStore } from '../../src/integrations/memory-lead-store';
import type { ClientConfiguration } from '../../src/domain/client-configuration';
import type { LeadRecord } from '../../src/domain/lead';

const configuration: ClientConfiguration = {
  organizationId: 'org-1',
  version: 1,
  qualification: {
    threshold: 70,
    weights: { serviceFit: 25, needConfirmed: 20, decisionMaker: 20, locationFit: 15, urgency: 10, budget: 10 },
    maximumUrgencyDays: 14,
    requireDecisionMaker: false,
    requireBudget: false,
  },
  scoring: {
    threshold: 70,
    weights: { serviceFit: 25, needConfirmed: 20, decisionMaker: 20, locationFit: 15, urgency: 10, budget: 10 },
  },
};

function lead(): LeadRecord {
  const now = new Date().toISOString();
  return { id: 'lead-1', organizationId: 'org-1', name: 'Ada', state: 'contacting', profile: {}, consent: true, createdAt: now, updatedAt: now };
}

describe('LeadAIAgentOrchestrator', () => {
  it('responds immediately when a lead enters the pipeline', async () => {
    const leads = new MemoryLeadStore();
    const conversations = new MemoryConversationStore();
    const messages = new MemoryMessageStore();
    const seeded = lead();
    await leads.save(seeded);
    const conversation = new ConversationService(leads, conversations, messages);
    const agent = new LeadAIAgentOrchestrator(leads, new LeadResponseAgent(conversation), new LeadQualificationAgent(new QualificationOrchestrator(leads)));

    const result = await agent.onLeadCreated(seeded, configuration, 'whatsapp');
    const transcript = await conversation.getConversation(seeded.id, seeded.organizationId);

    expect(result.responseSent).toBe(true);
    expect(result.response).toBeTruthy();
    expect(transcript.messages).toHaveLength(1);
    expect(transcript.messages[0].actor).toBe('ai');
    expect(transcript.messages[0].channel).toBe('whatsapp');
  });

  it('qualifies an inbound answer and sends the next revenue-safe response', async () => {
    const leads = new MemoryLeadStore();
    const conversations = new MemoryConversationStore();
    const messages = new MemoryMessageStore();
    const seeded = lead();
    await leads.save(seeded);
    const conversation = new ConversationService(leads, conversations, messages);
    const agent = new LeadAIAgentOrchestrator(leads, new LeadResponseAgent(conversation), new LeadQualificationAgent(new QualificationOrchestrator(leads)));

    const result = await agent.onInboundMessage({
      leadId: seeded.id,
      organizationId: seeded.organizationId,
      text: "Yes, I'm the owner and I need help getting more customers within 7 days.",
      configuration,
      channel: 'whatsapp',
    });

    expect(result.qualification?.extractedFields.decisionMaker).toBe(true);
    expect(result.qualification?.extractedFields.urgencyDays).toBe(7);
    expect(result.responseSent).toBe(true);
    expect(result.decision?.owner).toBe('ai');
  });

  it('does not send a reply after an opt-out message', async () => {
    const leads = new MemoryLeadStore();
    const conversations = new MemoryConversationStore();
    const messages = new MemoryMessageStore();
    const seeded = lead();
    await leads.save(seeded);
    const conversation = new ConversationService(leads, conversations, messages);
    const agent = new LeadAIAgentOrchestrator(leads, new LeadResponseAgent(conversation), new LeadQualificationAgent(new QualificationOrchestrator(leads)));

    const result = await agent.onInboundMessage({
      leadId: seeded.id,
      organizationId: seeded.organizationId,
      text: 'STOP',
      configuration,
      channel: 'sms',
    });

    expect(result.responseSent).toBe(false);
    expect(result.decision?.action).toBe('opt-out');
  });
});
