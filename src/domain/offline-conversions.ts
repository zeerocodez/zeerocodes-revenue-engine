import { createHash } from 'node:crypto';

export type AdPlatform = 'meta' | 'google_ads' | 'tiktok_ads' | 'linkedin_ads';

export type ConversionEventType = 'Lead' | 'Schedule' | 'Qualify' | 'Purchase' | 'CustomDealWon';

export interface UserDataPayload {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface OfflineConversionEvent {
  id: string;
  organizationId: string;
  leadId: string;
  eventName: ConversionEventType;
  eventTime: number; // Unix timestamp in seconds
  eventSourceUrl?: string;
  adPlatform: AdPlatform;
  userData: {
    hashedEmail?: string;
    hashedPhone?: string;
    hashedFirstName?: string;
    hashedLastName?: string;
    clientIpAddress?: string;
  };
  customData: {
    currency: string;
    value?: number;
    leadScore?: number;
    serviceType?: string;
    dealStage?: string;
  };
  status: 'pending' | 'dispatched' | 'failed';
  responsePayload?: Record<string, unknown>;
  createdAt: string;
}

export function hashPii(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return createHash('sha256').update(normalized).digest('hex');
}

export function buildMetaCapiPayload(event: OfflineConversionEvent): Record<string, unknown> {
  return {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime,
        action_source: 'system_generated',
        event_id: event.id,
        user_data: {
          em: event.userData.hashedEmail ? [event.userData.hashedEmail] : undefined,
          ph: event.userData.hashedPhone ? [event.userData.hashedPhone] : undefined,
          fn: event.userData.hashedFirstName ? [event.userData.hashedFirstName] : undefined,
          client_ip_address: event.userData.clientIpAddress,
        },
        custom_data: {
          currency: event.customData.currency || 'NGN',
          value: event.customData.value,
          lead_score: event.customData.leadScore,
          service_type: event.customData.serviceType,
        },
      },
    ],
  };
}
