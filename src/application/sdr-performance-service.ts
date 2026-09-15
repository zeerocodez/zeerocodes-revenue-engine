import type { SdrWorkItem } from '../domain/sdr-work-item';

export interface SdrPerformanceInput {
  ownerId: string;
  items: SdrWorkItem[];
}

export interface SdrPerformanceResult {
  ownerId: string;
  assigned: number;
  completed: number;
  slaBreaches: number;
  slaAdherenceRate: number;
  qualified: number;
  appointmentsBooked: number;
  wins: number;
  revenue: number;
  qualificationRate: number;
  bookingRate: number;
  closeRate: number;
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

/** Produces manager-facing SDR performance metrics from assigned work items. */
export class SdrPerformanceService {
  calculate(input: SdrPerformanceInput): SdrPerformanceResult {
    const owned = input.items.filter((item) => item.ownerId === input.ownerId);
    const completed = owned.filter((item) => item.status === 'completed');
    const qualified = completed.filter(
      (item) => item.disposition === 'qualified' || item.disposition === 'appointment-booked' || item.disposition === 'won',
    );
    const booked = completed.filter(
      (item) => item.disposition === 'appointment-booked' || item.disposition === 'won',
    );
    const wins = completed.filter((item) => item.disposition === 'won');
    const breaches = owned.filter((item) => item.slaBreached).length;

    return {
      ownerId: input.ownerId,
      assigned: owned.length,
      completed: completed.length,
      slaBreaches: breaches,
      slaAdherenceRate: rate(Math.max(0, owned.length - breaches), owned.length),
      qualified: qualified.length,
      appointmentsBooked: booked.length,
      wins: wins.length,
      revenue: Math.round(wins.reduce((sum, item) => sum + Math.max(0, item.outcomeRevenue ?? 0), 0)),
      qualificationRate: rate(qualified.length, completed.length),
      bookingRate: rate(booked.length, qualified.length),
      closeRate: rate(wins.length, booked.length),
    };
  }
}
