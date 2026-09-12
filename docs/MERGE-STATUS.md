# Merge Status

## Source repositories

- `zeerocodez/lead-zero`
- `zeerocodez/zeerocodes`

## Target

`zeerocodez/zeerocodes-revenue-engine`

## Pass 2 completed

- Imported source snapshots into `legacy/lead-zero` and `legacy/zeerocodes` without modifying either source repository.
- Established one React/Vite + Express runtime in the target.
- Added a unified Revenue Engine dashboard shell.
- Connected the UI to qualification, scoring, routing, lead-state and pricing domain logic.
- Added configurable qualification policy and hard-disqualification routing.
- Added Lead Zero domain types and a Lead Zero → unified lead-state adapter.
- Added integration contracts for CRM/lead storage, messaging, voice, payments and ad sources.
- Added auditable state/event primitives.
- Added Vitest coverage for qualification, routing, state transitions and pricing.

## Architectural decision

Zeerocodes remains the runtime foundation. Lead Zero is a capability inside the Revenue Engine, not a second application.

The imported source snapshots are migration safety copies. They are not the production entry points and should not be edited directly.

## Pass 3 — next

1. Extract the highest-value Lead Zero screens into `src/features/lead-zero/`.
2. Extract the CRM/pipeline screens from Zeerocodes into shared feature modules.
3. Implement Firebase-backed repositories behind `LeadRepository`.
4. Implement WhatsApp/email/voice adapters behind gateway contracts.
5. Replace demo dashboard data with tenant-scoped data.
6. Add client-specific qualification profiles, pricing rules and pilot controls.
7. Run full TypeScript/build/security validation before retiring duplicate legacy code.
