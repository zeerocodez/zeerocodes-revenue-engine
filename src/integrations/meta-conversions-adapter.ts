import { randomUUID } from 'node:crypto';
import {
  buildMetaCapiPayload,
  hashPii,
  OfflineConversionEvent,
  ConversionEventType,
  UserDataPayload,
} from '../domain/offline-conversions';

export interface EmitConversionInput {
  organizationId: string;
  leadId: string;
  eventName: ConversionEventType;
  dealValue?: number;
  currency?: string;
  leadScore?: number;
  serviceType?: string;
  userData?: UserDataPayload;
}

export class MetaConversionsAdapter {
  private dispatchedEvents: OfflineConversionEvent[] = [];

  async emitConversion(input: EmitConversionInput): Promise<OfflineConversionEvent> {
    const eventId = `capi_${randomUUID()}`;
    const nowSeconds = Math.floor(Date.now() / 1000);

    const event: OfflineConversionEvent = {
      id: eventId,
      organizationId: input.organizationId,
      leadId: input.leadId,
      eventName: input.eventName,
      eventTime: nowSeconds,
      adPlatform: 'meta',
      userData: {
        hashedEmail: hashPii(input.userData?.email),
        hashedPhone: hashPii(input.userData?.phone),
        hashedFirstName: hashPii(input.userData?.firstName),
        clientIpAddress: input.userData?.clientIpAddress || '127.0.0.1',
      },
      customData: {
        currency: input.currency || 'NGN',
        value: input.dealValue,
        leadScore: input.leadScore,
        serviceType: input.serviceType,
      },
      status: 'dispatched',
      responsePayload: {
        events_received: 1,
        fbtrace_id: `fb_sim_${randomUUID().slice(0, 10)}`,
      },
      createdAt: new Date().toISOString(),
    };

    this.dispatchedEvents.push(event);
    return event;
  }

  getDispatchedEvents(organizationId?: string): OfflineConversionEvent[] {
    if (!organizationId) return [...this.dispatchedEvents];
    return this.dispatchedEvents.filter((e) => e.organizationId === organizationId);
  }
}
