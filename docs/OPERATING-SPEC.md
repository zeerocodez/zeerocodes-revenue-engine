# Revenue Engine Operating Specification

## Core flow

Lead source -> capture -> immediate acknowledgement -> qualification -> scoring -> routing -> appointment -> human close -> won/lost -> nurture/recycle.

## Decision hierarchy

1. Safety, consent and client policy constraints always win.
2. Deterministic qualification rules are evaluated before AI interpretation.
3. AI may collect, summarize and recommend; it does not override hard disqualifiers.
4. A requested human or high-intent signal routes to an SDR/closer.
5. Every state change records timestamp, actor, reason and source.

## Lead-state model

`new -> contacting -> engaged -> qualifying -> qualified -> booked -> won`

Side paths:

- `contacting -> nurture`
- `engaged -> nurture | lost`
- `qualifying -> nurture | lost`
- `qualified -> nurture | lost`
- `booked -> nurture | lost`
- `lost -> nurture`
- `nurture -> contacting | qualified | lost`
- `new/contacting -> invalid`

## Pilot control metrics

- Speed to first response
- Contact rate
- Engagement rate
- Qualification rate
- Qualified-to-booked rate
- Booked-to-won rate
- Cost per qualified lead
- Revenue per qualified lead
- Follow-up completion rate
- AI-to-human escalation rate
- Invalid/disqualified rate

## Merge rule

The unified repository is the production source of truth. The two source repositories remain preserved until the unified build passes functional, security and deployment validation.
