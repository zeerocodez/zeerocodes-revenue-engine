import type { FollowUpTask, FollowUpChannel } from '../domain/follow-up';

export interface FollowUpRepository {
  listDue(organizationId: string, limit?: number): Promise<FollowUpTask[]>;
  markProcessing?(id: string): Promise<boolean>;
  complete(id: string): Promise<void>;
  fail(id: string, error: string): Promise<void>;
}

export interface OutboundMessage {
  organizationId: string;
  leadId: string;
  channel: FollowUpChannel;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface FollowUpChannelAdapter {
  readonly channel: FollowUpChannel;
  send(message: OutboundMessage): Promise<{ externalId?: string; metadata?: Record<string, unknown> }>;
}

export interface FollowUpWorkerResult {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
}

export class FollowUpWorker {
  constructor(
    private readonly repository: FollowUpRepository,
    private readonly adapters: ReadonlyMap<FollowUpChannel, FollowUpChannelAdapter>,
    private readonly messageSink?: (message: OutboundMessage & { externalId?: string; metadata?: Record<string, unknown> }) => Promise<void>,
  ) {}

  async runOnce(organizationId: string, limit = 25): Promise<FollowUpWorkerResult> {
    const tasks = await this.repository.listDue(organizationId, limit);
    const result: FollowUpWorkerResult = { processed: 0, completed: 0, failed: 0, skipped: 0 };

    for (const task of tasks) {
      result.processed += 1;
      const adapter = this.adapters.get(task.channel);
      if (!adapter) {
        result.skipped += 1;
        await this.repository.fail(task.id, `No adapter configured for ${task.channel}`);
        continue;
      }

      const claimed = this.repository.markProcessing ? await this.repository.markProcessing(task.id) : true;
      if (!claimed) {
        result.skipped += 1;
        continue;
      }

      try {
        const body = this.render(task);
        const outbound: OutboundMessage = {
          organizationId: task.organizationId,
          leadId: task.leadId,
          channel: task.channel,
          body,
          metadata: { taskId: task.id, taskType: task.taskType, attempts: task.attempts },
        };
        const sent = await adapter.send(outbound);
        await this.messageSink?.({ ...outbound, externalId: sent.externalId, metadata: { ...outbound.metadata, ...sent.metadata } });
        await this.repository.complete(task.id);
        result.completed += 1;
      } catch (error) {
        result.failed += 1;
        await this.repository.fail(task.id, error instanceof Error ? error.message : String(error));
      }
    }

    return result;
  }

  private render(task: FollowUpTask): string {
    const payload = task.payload ?? {};
    const custom = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (custom) return custom;

    switch (task.taskType) {
      case 'instant_response':
        return 'Hi! Thanks for reaching out. We have received your request and will help you shortly. A few quick questions will help us understand what you need.';
      case 'qualification':
        return 'To help us recommend the right option, could you tell us what service you need and when you would like to get started?';
      case 'reminder':
        return 'Just checking in on your request. Would you like us to help you book the next step?';
      case 'nurture':
        return 'We are still here when you are ready. If you would like to continue, simply reply to this message.';
      case 'recycle':
        return 'Checking back in to see whether your plans have changed. Would you like to continue your request?';
      case 'human_handoff':
        return 'Thanks. I am connecting you with a member of our team now.';
    }
  }
}

export class LoggingChannelAdapter implements FollowUpChannelAdapter {
  constructor(public readonly channel: FollowUpChannel) {}
  async send(message: OutboundMessage): Promise<{ metadata: Record<string, unknown> }> {
    console.info(JSON.stringify({ event: 'follow_up.sent', ...message }));
    return { metadata: { adapter: 'logging' } };
  }
}
