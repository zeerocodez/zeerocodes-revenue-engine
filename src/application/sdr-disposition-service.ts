import type { QualificationResult } from '../domain/qualification';
import type { SdrDisposition, SdrWorkItem } from '../domain/sdr-work-item';
import { LeadLifecycleService } from './lead-lifecycle-service';

export interface SdrDispositionInput {
  organizationId: string;
  item: SdrWorkItem;
  disposition: SdrDisposition;
  appointmentStatus?: 'scheduled' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  appointmentId?: string;
  qualification?: QualificationResult;
  now?: string;
}

export interface SdrDispositionResult {
  disposition: SdrDisposition;
  transitioned: boolean;
  state: SdrWorkItem['leadState'];
  lifecycleReason?: string;
}

/** Converts SDR dispositions into guarded lead lifecycle transitions. */
export class SdrDispositionService {
  constructor(private readonly lifecycle: LeadLifecycleService) {}

  async apply(input: SdrDispositionInput): Promise<SdrDispositionResult> {
    if (input.item.organizationId !== input.organizationId) throw new Error('Tenant access denied');
    if (!input.item.dispositionOptions.includes(input.disposition)) throw new Error('Invalid disposition');

    const now = input.now ?? new Date().toISOString();
    const state = input.item.leadState;
    let nextState: SdrWorkItem['leadState'] | undefined;
    let outcome: 'won' | 'lost' | 'no_sale' | 'unqualified' | undefined;

    switch (input.disposition) {
      case 'appointment-booked':
        if (!input.appointmentId) throw new Error('appointment-booked requires appointmentId');
        if (input.appointmentStatus !== 'scheduled' && input.appointmentStatus !== 'confirmed') {
          throw new Error('appointment-booked requires a scheduled or confirmed appointment');
        }
        if (state !== 'qualified') throw new Error(`appointment-booked requires lead to be qualified, found ${state}`);
        nextState = 'booked';
        break;
      case 'won':
        if (state !== 'booked') throw new Error(`won requires lead to be booked, found ${state}`);
        nextState = 'won';
        outcome = 'won';
        break;
      case 'lost':
        nextState = 'lost';
        outcome = 'lost';
        break;
      case 'not-qualified':
        nextState = 'lost';
        outcome = 'unqualified';
        break;
      case 'nurture':
        nextState = 'nurture';
        break;
      case 'do-not-contact':
        nextState = 'invalid';
        break;
      default:
        // Connected, no-answer, callback, qualified, and wrong-number are
        // operational dispositions only; they do not fake lifecycle progress.
        break;
    }

    if (!nextState || nextState === state) {
      return { disposition: input.disposition, transitioned: false, state };
    }

    const result = await this.lifecycle.transition({
      leadId: input.item.leadId,
      organizationId: input.organizationId,
      from: state,
      to: nextState,
      consent: true,
      qualification: input.qualification,
      appointmentStatus: input.appointmentStatus,
      outcome,
      requestedHuman: true,
      now,
    });

    return {
      disposition: input.disposition,
      transitioned: true,
      state: result.lead.state,
      lifecycleReason: result.decision.reason,
    };
  }
}
