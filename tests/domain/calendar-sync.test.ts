import { describe, expect, it } from 'vitest';
import {
  createDefaultReminders,
  findNextAvailableSlot,
  generateMeetingLink,
  CloserAvailability,
} from '../../src/domain/calendar-sync';

describe('Calendar Synchronization & Automated Reminder Engine', () => {
  it('generates platform-specific meeting links', () => {
    const meetLink = generateMeetingLink('google_meet', 'booking_123456');
    expect(meetLink).toContain('https://meet.google.com/zee-');

    const zoomLink = generateMeetingLink('zoom', 'booking_999888');
    expect(zoomLink).toContain('https://zoom.us/j/');
  });

  it('generates 3-step reminder sequence (24h, 2h, 10m before call)', () => {
    const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const reminders = createDefaultReminders(startTime, 'John Doe', 'https://meet.google.com/test');

    expect(reminders).toHaveLength(3);
    expect(reminders[0].offsetMinutesBefore).toBe(1440);
    expect(reminders[0].channel).toBe('whatsapp');
    expect(reminders[1].offsetMinutesBefore).toBe(120);
    expect(reminders[1].channel).toBe('sms');
    expect(reminders[2].offsetMinutesBefore).toBe(10);
    expect(reminders[2].channel).toBe('whatsapp');
  });

  it('allocates available closer slot without scheduling conflict', () => {
    const closers: CloserAvailability[] = [
      {
        closerId: 'closer_1',
        closerName: 'Folake Adeleke',
        closerEmail: 'folake@zeerocodes.com',
        timeZone: 'Africa/Lagos',
        workingHours: { startHour: 9, endHour: 18, daysOfWeek: [1, 2, 3, 4, 5] },
        existingBookings: [],
      },
    ];

    const slot = findNextAvailableSlot(closers, 30);
    expect(slot).not.toBeNull();
    expect(slot?.closerName).toBe('Folake Adeleke');
    expect(slot?.platform).toBe('google_meet');
  });
});
