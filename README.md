# Zeerocodes Revenue Engine

Unified revenue-engine platform combining the Lead Zero lead qualification/follow-up product with the Zeerocodes CRM, workflow, billing, Firebase, and security foundation.

## Source repositories

- `zeerocodez/lead-zero` — Lead Zero dashboard, landing page, lead/follow-up/revenue/billing/team/admin UI.
- `zeerocodez/zeerocodes` — Zeerocodes application shell, CRM/workflow capabilities, Firebase, API/server, payments, security rules and tests.

## Current consolidation state

The target repository is now an executable React/Vite + Express application with a shared revenue-engine domain layer. The first product shell exposes the qualification, scoring, routing, lead-state and pricing models directly in the dashboard.

Source snapshots are imported under `legacy/` during migration so the originals can remain untouched until functional, security and deployment validation is complete.

## Runtime architecture

```text
src/
  domain/
    qualification.ts
    scoring.ts
    routing.ts
    lead-state.ts
    pricing.ts
    pilot.ts
  App.tsx              # unified revenue-engine shell
  main.tsx
  index.css
server.ts              # production Express host
legacy/
  zeerocodes/          # imported source snapshot
  lead-zero/           # imported source snapshot

docs/
tests/
```

## Operating principles

1. Preserve working functionality before refactoring.
2. Never copy secrets; only example environment variables.
3. Keep source repositories intact until the unified repository is validated.
4. Treat lead qualification, state transitions, routing, billing and auditability as core domain logic.
5. Prefer small, testable modules over business logic embedded in UI components.
6. Deterministic rules outrank AI recommendations; high-intent and human-request signals escalate to people.

## Next consolidation layer

1. Extract reusable UI from the imported Zeerocodes and Lead Zero snapshots.
2. Replace demo lead data with the existing Firebase/CRM data model behind an adapter.
3. Add messaging, voice, payment and ads adapters without coupling them to the UI.
4. Add client-specific qualification profiles and pricing configuration.
5. Add audit/event persistence and KPI aggregation.
6. Run functional, security and deployment validation before retiring the source repositories.
