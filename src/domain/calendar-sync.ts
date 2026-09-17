import { randomUUID } from 'node:crypto';

export type MeetingPlatform = 'google_meet' | 'zoom' | 'microsoft_teams' | 'phone_call' | 'in_person';

export type BookingStatus = 'pending' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show';

export interface CalendarSlot {
  startTime: string; // ISO String
  endTime: string;   // ISO String
  closerId: string;
  closerName: string;
  closerEmail: string;
  platform: MeetingPlatform;
}

export interface ReminderStep {
  id: string;
  offsetMinutesBefore: number; // e.g. 1440 (24h), 120 (2h), 10 (10m)
  channel: 'whatsapp' | 'sms' | 'email';
  template: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  scheduledAt: string;
  sentAt?: string;
}

export interface CalendarBooking {
  id: string;
  organizationId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  closerId: string;
  closerName: string;
  closerEmail: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  meetingPlatform: MeetingPlatform;
  meetingLink?: string;
  status: BookingStatus;
  reminders: ReminderStep[];
  dealValue?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CloserAvailability {
  closerId: string;
  closerName: string;
  closerEmail: string;
  timeZone: string;
  workingHours: {
    startHour: number; // e.g. 9
    endHour: number;   // e.g. 17
    daysOfWeek: number[]; // 1 = Monday ... 5 = Friday
  };
  existingBookings: { startTime: string; endTime: string }[];
}

export function generateMeetingLink(platform: MeetingPlatform, bookingId: string): string {
  switch (platform) {
    case 'google_meet':
      return `https://meet.google.com/zee-${bookingId.slice(0, 4)}-${bookingId.slice(4, 7)}`;
    case 'zoom':
      return `https://zoom.us/j/849${bookingId.replace(/\D/g, '').padEnd(8, '0').slice(0, 8)}`;
    case 'microsoft_teams':
      return `https://teams.microsoft.com/l/meetup-join/zeero_${bookingId}`;
    case 'phone_call':
      return 'Direct Phone Conference';
    case 'in_person':
      return 'Client Office / Physical Location';
  }
}

export function createDefaultReminders(startTimeIso: string, leadName: string, meetingLink?: string): ReminderStep[] {
  const start = new Date(startTimeIso).getTime();

  return [
    // 24 Hours Before
    {
      id: `rem_24h_${randomUUID().slice(0, 8)}`,
      offsetMinutesBefore: 1440,
      channel: 'whatsapp',
      template: `Hi ${leadName}! This is a reminder for our executive demonstration tomorrow. Meeting link: ${meetingLink || 'Sent to email'}.`,
      status: 'scheduled',
      scheduledAt: new Date(start - 24 * 60 * 60 * 1000).toISOString(),
    },
    // 2 Hours Before
    {
      id: `rem_2h_${randomUUID().slice(0, 8)}`,
      offsetMinutesBefore: 120,
      channel: 'sms',
      template: `Hi ${leadName}, our sales closer is ready for your demo in 2 hours. Link: ${meetingLink || 'Check email'}.`,
      status: 'scheduled',
      scheduledAt: new Date(start - 2 * 60 * 60 * 1000).toISOString(),
    },
    // 10 Minutes Before
    {
      id: `rem_10m_${randomUUID().slice(0, 8)}`,
      offsetMinutesBefore: 10,
      channel: 'whatsapp',
      template: `We are starting in 10 minutes! Join the room here: ${meetingLink || 'Check calendar invite'}. Looking forward to speaking!`,
      status: 'scheduled',
      scheduledAt: new Date(start - 10 * 60 * 1000).toISOString(),
    },
  ];
}

export function findNextAvailableSlot(
  availability: CloserAvailability[],
  requestedDurationMinutes: number = 30,
  referenceDate: Date = new Date()
): CalendarSlot | null {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0); // Default to 2:00 PM next business day

  for (const closer of availability) {
    const isSlotConflict = closer.existingBookings.some((b) => {
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      const sStart = tomorrow.getTime();
      const sEnd = sStart + requestedDurationMinutes * 60 * 1000;
      return (sStart >= bStart && sStart < bEnd) || (sEnd > bStart && sEnd <= bEnd);
    });

    if (!isSlotConflict) {
      const slotEnd = new Date(tomorrow.getTime() + requestedDurationMinutes * 60 * 1000);
      return {
        startTime: tomorrow.toISOString(),
        endTime: slotEnd.toISOString(),
        closerId: closer.closerId,
        closerName: closer.closerName,
        closerEmail: closer.closerEmail,
        platform: 'google_meet',
      };
    }
  }

  return null;
}
