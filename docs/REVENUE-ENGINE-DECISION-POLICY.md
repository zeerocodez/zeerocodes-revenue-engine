# Revenue Engine Decision Policy

The Revenue Engine uses a strict decision hierarchy.

## 1. Safety, consent and client policy

Hard rules execute first. A withdrawn consent, hard disqualification, or client policy failure cannot be overridden by an AI recommendation.

## 2. Deterministic qualification

The engine evaluates service fit, need, decision authority, location, urgency and budget. The threshold and hard requirements are client-configurable.

## 3. Scoring and reason codes

Every qualification result contains a numeric score, temperature band and reasons. Operators should be able to explain why a lead was routed.

## 4. Routing

- Booked appointment → closer
- Human reply/request → SDR
- Qualified but not booked → AI follow-up
- Not sales-ready → nurture
- Hard disqualified → reject

## 5. Auditability

Every material decision should produce an audit event containing the organization, lead, actor, action, state change, reason and source.

## 6. AI boundary

AI may collect information, summarize conversations, classify intent and recommend the next action. It must not override hard policy rules or silently change qualification criteria.
