import { randomUUID } from 'node:crypto';
import {
  CalendarBooking,
  CalendarSlot,
  CloserAvailability,
  createDefaultReminders,
  findNextAvailableSlot,
  generateMeetingLink,
  MeetingPlatform,
} from '../domain/calendar-sync';

export interface BookingCreationInput {
  organizationId: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  closerId?: string;
  closerName?: string;
  closerEmail?: string;
  title?: string;
  description?: string;
  preferredPlatform?: MeetingPlatform;
  dealValue?: number;
  customStartTime?: string;
}

export class CalendarBookingService {
  private bookings: Map<string, CalendarBooking> = new Map();
  private closersAvailability: CloserAvailability[] = [
    {
      closerId: 'closer_folake',
      closerName: 'Folake Adeleke',
      closerEmail: 'folake@zeerocodes.com',
      timeZone: 'Africa/Lagos',
      workingHours: { startHour: 9, endHour: 18, daysOfWeek: [1, 2, 3, 4, 5] },
      existingBookings: [],
    },
    {
      closerId: 'closer_emeka',
      closerName: 'Emeka Nwosu',
      closerEmail: 'emeka@zeerocodes.com',
      timeZone: 'Africa/Lagos',
      workingHours: { startHour: 9, endHour: 18, daysOfWeek: [1, 2, 3, 4, 5] },
      existingBookings: [],
    },
  ];

  async createBooking(input: BookingCreationInput): Promise<CalendarBooking> {
    const bookingId = `book_${randomUUID().slice(0, 8)}`;
    const platform = input.preferredPlatform || 'google_meet';

    let startTime = input.customStartTime;
    let endTime: string;
    let closerId = input.closerId || this.closersAvailability[0].closerId;
    let closerName = input.closerName || this.closersAvailability[0].closerName;
    let closerEmail = input.closerEmail || this.closersAvailability[0].closerEmail;

    if (!startTime) {
      const slot = findNextAvailableSlot(this.closersAvailability, 30);
      if (slot) {
        startTime = slot.startTime;
        endTime = slot.endTime;
        closerId = slot.closerId;
        closerName = slot.closerName;
        closerEmail = slot.closerEmail;
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(14, 0, 0, 0);
        startTime = d.toISOString();
        endTime = new Date(d.getTime() + 30 * 60 * 1000).toISOString();
      }
    } else {
      const d = new Date(startTime);
      endTime = new Date(d.getTime() + 30 * 60 * 1000).toISOString();
    }

    const meetingLink = generateMeetingLink(platform, bookingId);
    const reminders = createDefaultReminders(startTime, input.leadName, meetingLink);

    const booking: CalendarBooking = {
      id: bookingId,
      organizationId: input.organizationId,
      leadId: input.leadId,
      leadName: input.leadName,
      leadPhone: input.leadPhone,
      leadEmail: input.leadEmail,
      closerId,
      closerName,
      closerEmail,
      title: input.title || `Executive Product Demonstration for ${input.leadName}`,
      description: input.description || 'AI-qualified sales appointment and solution walkthrough.',
      startTime,
      endTime,
      timeZone: 'Africa/Lagos',
      meetingPlatform: platform,
      meetingLink,
      status: 'confirmed',
      reminders,
      dealValue: input.dealValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.bookings.set(booking.id, booking);

    // Record booking to closer availability
    const closer = this.closersAvailability.find((c) => c.closerId === closerId);
    if (closer) {
      closer.existingBookings.push({ startTime, endTime });
    }

    return booking;
  }

  async getBookings(organizationId: string): Promise<CalendarBooking[]> {
    return Array.from(this.bookings.values()).filter(
      (b) => b.organizationId === organizationId || organizationId === 'all'
    );
  }

  async getBookingById(bookingId: string): Promise<CalendarBooking | null> {
    return this.bookings.get(bookingId) || null;
  }
}
