import { describe, expect, it } from 'vitest';
import { evaluateLeadStateSla, evaluateLeadTransition, transitionLeadWithPolicy } from '../../src/domain/lead-state-machine';

const qualified = { score: 85, qualified: true, reasons: ['service fit', 'need confirmed'], hardDisqualified: false };

const base = {
  consent: true,
  hasInboundMessage: true,
  now: '2026-09-14T10:00:00.000Z',
};

describe('lead state machine', () => {
  it('allows first contact only when consent exists', () => {
    expect(evaluateLeadTransition({ from: 'new', to: 'contacting', ...base }).allowed).toBe(true);
    expect(evaluateLeadTransition({ from: 'new', to: 'contacting', ...base, consent: false }).allowed).toBe(false);
  });

  it('requires inbound engagement before qualification', () => {
    expect(evaluateLeadTransition({ from: 'contacting', to: 'engaged', ...base, hasInboundMessage: false }).allowed).toBe(false);
    expect(evaluateLeadTransition({ from: 'contacting', to: 'engaged', ...base }).allowed).toBe(true);
  });

  it('requires a positive qualification result before qualified', () => {
    expect(evaluateLeadTransition({ from: 'qualifying', to: 'qualified', ...base }).allowed).toBe(false);
    expect(evaluateLeadTransition({ from: 'qualifying', to: 'qualified', ...base, qualification: qualified }).allowed).toBe(true);
  });

  it('requires an appointment before booked', () => {
    expect(evaluateLeadTransition({ from: 'qualified', to: 'booked', ...base }).allowed).toBe(false);
    expect(evaluateLeadTransition({ from: 'qualified', to: 'booked', ...base, appointmentStatus: 'confirmed' }).allowed).toBe(true);
  });

  it('requires an explicit outcome for won and lost', () => {
    expect(evaluateLeadTransition({ from: 'booked', to: 'won', ...base }).allowed).toBe(false);
    expect(evaluateLeadTransition({ from: 'booked', to: 'won', ...base, outcome: 'won' }).allowed).toBe(true);
    expect(evaluateLeadTransition({ from: 'booked', to: 'lost', ...base, outcome: 'no_sale' }).allowed).toBe(true);
  });

  it('routes recoverable outcomes to nurture and supports reactivation', () => {
    const nurture = evaluateLeadTransition({ from: 'booked', to: 'nurture', ...base, outcome: 'no_show' });
    expect(nurture.allowed).toBe(true);
    expect(nurture.action).toBe('nurture');

    const reactivation = evaluateLeadTransition({ from: 'nurture', to: 'contacting', ...base });
    expect(reactivation.allowed).toBe(true);
  });

  it('treats human escalation as an action, not a bypass around the state graph', () => {
    const result = evaluateLeadTransition({ from: 'qualified', to: 'booked', ...base, requestedHuman: true });
    expect(result.allowed).toBe(false);
    expect(result.action).toBe('book');
  });

  it('enforces state SLA windows', () => {
    const onTime = evaluateLeadStateSla('new', '2026-09-14T10:00:00.000Z', '2026-09-14T10:04:00.000Z');
    const breached = evaluateLeadStateSla('new', '2026-09-14T10:00:00.000Z', '2026-09-14T10:06:00.000Z');
    expect(onTime.breached).toBe(false);
    expect(onTime.dueAt).toBe('2026-09-14T10:05:00.000Z');
    expect(breached.breached).toBe(true);
  });

  it('throws when policy evidence is missing', () => {
    expect(() => transitionLeadWithPolicy({ from: 'qualified', to: 'booked', ...base })).toThrow(/appointment/);
  });
});
